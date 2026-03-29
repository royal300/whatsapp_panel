<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessCampaignJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public \App\Models\Campaign $campaign,
        public ?array $numbersToRetry = null
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $tenant = $this->campaign->tenant;
        $template = $this->campaign->template;
        $whatsapp = new \App\Services\WhatsAppService($tenant);
        $billing = new \App\Services\BillingService();

        $this->campaign->update(['status' => 'running']);

        $audience = $this->campaign->audience ?? [];

        // If retrying specific numbers, filter the audience
        if (!empty($this->numbersToRetry)) {
            $audience = array_filter($audience, function($item) {
                return in_array($item['phone'], $this->numbersToRetry);
            });
        }

        foreach ($audience as $item) {
            $phoneNumber = $item['phone'] ?? null;
            $contactName = $item['name'] ?? null;
            $tags = $item['tags'] ?? [];
            $variables = $item['variables'] ?? [];

            if (!$phoneNumber) continue;

            // Fix Scientific Notation and clean non-numeric characters
            if (is_numeric($phoneNumber)) {
                $phoneNumber = number_format((float)$phoneNumber, 0, '', '');
            }
            $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);

            if (empty($phoneNumber)) continue;

            if (!$billing->canSend($tenant)) {
                $this->campaign->update(['status' => 'failed', 'error_message' => 'Insufficient credits']);
                return; // Safely stop the job from marking itself as completed.
            }

            try {
                // Map variables to Meta component format
                $formattedComponents = [];
                if (!empty($variables)) {
                    $parameters = [];
                    foreach ($variables as $val) {
                        $parameters[] = ['type' => 'text', 'text' => (string)$val];
                    }
                    $formattedComponents[] = [
                        'type' => 'body',
                        'parameters' => $parameters
                    ];
                }

                $response = $whatsapp->sendTemplateMessage(
                    $phoneNumber,
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

                \App\Models\CampaignLog::updateOrCreate(
                    [
                        'campaign_id' => $this->campaign->id,
                        'number' => $phoneNumber,
                    ],
                    [
                        'contact_id' => null,
                        'message_id' => $messageId,
                        'status' => 'sent',
                        'error_message' => null,
                    ]
                );

                try {
                    // SYNC TO TEAM INBOX
                    $contact = \App\Models\Contact::updateOrCreate(
                        ['phone_number' => $phoneNumber, 'tenant_id' => $tenant->id],
                        ['name' => $contactName ?: 'WhatsApp User']
                    );

                    // Sync Tags
                    if (!empty($tags)) {
                        $tagIds = [];
                        foreach ($tags as $tagName) {
                            $tag = \App\Models\ContactTag::firstOrCreate([
                                'tenant_id' => $tenant->id,
                                'name' => trim($tagName)
                            ]);
                            $tagIds[] = $tag->id;
                        }
                        $contact->tags()->syncWithoutDetaching($tagIds);
                    }

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
                \App\Models\CampaignLog::updateOrCreate(
                    [
                        'campaign_id' => $this->campaign->id,
                        'number' => $phoneNumber,
                    ],
                    [
                        'status' => 'failed',
                        'error_message' => $e->getMessage()
                    ]
                );
            }

            // Sleep to avoid hitting Meta rate limits too fast (adjust as needed)
            usleep(200000); // 0.2 seconds
        }

        $this->campaign->update(['status' => 'completed']);
    }
}
