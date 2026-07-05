<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Bus\Dispatchable;

class ProcessCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public \App\Models\Campaign $campaign)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Refresh the campaign model to ensure we have the latest token and status
        $this->campaign->refresh();
        $this->campaign->load('tenant', 'template');
        
        $tenant = $this->campaign->tenant;
        $template = $this->campaign->template;
        $whatsapp = new \App\Services\WhatsAppService($tenant);
        $billing = new \App\Services\BillingService();

        $this->campaign->update(['status' => 'running']);

        $audience = $this->campaign->audience ?? [];

        foreach ($audience as $item) {
            $phoneNumber = $item['phone'] ?? null;
            $variables = $item['variables'] ?? []; // Array of strings for {{1}}, {{2}} etc.

            if (!$phoneNumber) continue;

            if (!$billing->canSend($tenant)) {
                $this->campaign->update(['status' => 'failed', 'error_message' => 'Insufficient credits']);
                return; // Safely stop the job from marking itself as completed.
            }

            try {
                // Map variables to Meta component format
                $formattedComponents = [];

                if ($this->campaign->media_url && is_array($template->content)) {
                    $headerFormat = null;
                    foreach ($template->content as $c) {
                        if (isset($c['type']) && $c['type'] === 'HEADER' && in_array($c['format'], ['IMAGE', 'VIDEO', 'DOCUMENT'])) {
                            $headerFormat = strtolower($c['format']);
                            break;
                        }
                    }
                    if ($headerFormat) {
                        $formattedComponents[] = [
                            'type' => 'header',
                            'parameters' => [
                                [
                                    'type' => $headerFormat,
                                    $headerFormat => ['link' => $this->campaign->media_url]
                                ]
                            ]
                        ];
                    }
                }

                if (!empty($variables)) {
                    $parameters = [];
                    foreach ($variables as $val) {
                        $parameters[] = ['type' => 'text', 'text' => (string)$val];
                    }
                    $formattedComponents[] = [
                        'type' => 'body',
                        'parameters' => $parameters
                    ];

                    // Meta requires OTP button parameters if the template uses a COPY_CODE button
                    if (is_array($template->content)) {
                        foreach ($template->content as $c) {
                            if (isset($c['type']) && $c['type'] === 'BUTTONS' && isset($c['buttons'])) {
                                foreach ($c['buttons'] as $idx => $btn) {
                                    if (isset($btn['type']) && $btn['type'] === 'OTP') {
                                        // The OTP code is always the first variable
                                        $otpCode = (string)$variables[0];
                                        $formattedComponents[] = [
                                            'type' => 'button',
                                            'sub_type' => 'url',
                                            'index' => (string)$idx,
                                            'parameters' => [
                                                ['type' => 'text', 'text' => $otpCode]
                                            ]
                                        ];
                                    }
                                }
                            }
                        }
                    }
                }

                $response = $whatsapp->sendTemplateMessage(
                    ltrim($phoneNumber, '+'),
                    $template->name,
                    $template->language,
                    $formattedComponents
                );

                if (isset($response['error'])) {
                    throw new \Exception($response['error']['message'] ?? 'Meta API Error');
                }

                $messageId = $response['messages'][0]['id'] ?? null;
                
                if (!$messageId) {
                    throw new \Exception('Failed to get message ID from Meta');
                }

                $billing->incrementUsage($tenant);

                \App\Models\CampaignLog::create([
                    'campaign_id' => $this->campaign->id,
                    'contact_id' => null,
                    'number' => $phoneNumber,
                    'message_id' => $messageId,
                    'status' => 'sent'
                ]);

                try {
                    // Normalize phone number to include +
                    $normalizedPhone = str_starts_with($phoneNumber, '+') ? $phoneNumber : '+' . $phoneNumber;

                    // SYNC TO TEAM INBOX
                    $contact = \App\Models\Contact::firstOrCreate(
                        ['phone_number' => $normalizedPhone, 'tenant_id' => $tenant->id],
                        ['name' => 'WhatsApp User']
                    );

                    $chat = \App\Models\Chat::firstOrCreate(
                        ['contact_id' => $contact->id, 'tenant_id' => $tenant->id],
                        ['status' => 'open']
                    );

                    $chat->touch(); // Ensure it comes to top of inbox

                    // Reconstruct the actual message body for the inbox
                    $bodyText = collect($template->content)->where('type', 'BODY')->first()['text'] ?? '';
                    foreach ($variables as $index => $value) {
                        $placeholder = '{{' . ($index + 1) . '}}';
                        $bodyText = str_replace($placeholder, $value, $bodyText);
                    }

                    $footerText = collect($template->content)->where('type', 'FOOTER')->first()['text'] ?? null;
                    if ($footerText) {
                        $bodyText .= "\n\n_{$footerText}_";
                    }

                    $buttonsComponent = collect($template->content)->where('type', 'BUTTONS')->first();
                    if ($buttonsComponent && isset($buttonsComponent['buttons'])) {
                        $bodyText .= "\n\n";
                        foreach ($buttonsComponent['buttons'] as $btn) {
                            $bodyText .= "🔘 {$btn['text']}  ";
                        }
                    }

                    if (!empty($this->campaign->media_url)) {
                        $bodyText = "![media]({$this->campaign->media_url})\n\n" . $bodyText;
                    }

                    $message = \App\Models\Message::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'agent',
                        'message_body' => $bodyText ?: "Template: {$template->name}",
                        'meta_message_id' => $messageId,
                        'status' => 'sent'
                    ]);

                    // Use Tenant-specific Pusher config and broadcast
                    \App\Services\PusherService::useTenantConfig($tenant);
                    if ($tenant->pusher_app_id && $tenant->pusher_app_key && $tenant->pusher_app_secret) {
                        broadcast(new \App\Events\MessageReceived($message))->toOthers();
                    }
                } catch (\Exception $inboxError) {
                    \Illuminate\Support\Facades\Log::error("Inbox sync failed for campaign message: " . $inboxError->getMessage());
                    // We don't throw here to avoid marking the actual WhatsApp sent message as 'failed'
                }

            } catch (\Exception $e) {
                \App\Models\CampaignLog::create([
                    'campaign_id' => $this->campaign->id,
                    'number' => $phoneNumber,
                    'status' => 'failed',
                    'error_message' => $e->getMessage()
                ]);
            }

            // Sleep to avoid hitting Meta rate limits too fast (adjust as needed)
            usleep(200000); // 0.2 seconds
        }

        $this->campaign->update(['status' => 'completed']);
    }
}
