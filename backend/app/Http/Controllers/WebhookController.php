<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;
use App\Models\Message;
use App\Models\CampaignLog;

class WebhookController extends Controller
{
    public function verify(Request $request)
    {
        $verifyToken = env('VITE_WHATSAPP_VERIFY_TOKEN', 'royal300_secret_token');

        if ($request->query('hub_mode') === 'subscribe' && $request->query('hub_verify_token') === $verifyToken) {
            return response($request->query('hub_challenge'), 200);
        }

        return response('Forbidden', 403);
    }

    public function handle(Request $request)
    {
        $payload = $request->all();
        Log::info('WhatsApp Webhook Payload: ', $payload);

        if (isset($payload['entry']) && is_array($payload['entry'])) {
            foreach ($payload['entry'] as $entry) {
                $wabaId = $entry['id'] ?? null;
                if (!isset($entry['changes']) || !is_array($entry['changes'])) continue;

                foreach ($entry['changes'] as $change) {
                    $value = $change['value'] ?? [];
                    
                    // Process messages
                    if (isset($value['messages']) && is_array($value['messages'])) {
                        foreach ($value['messages'] as $msgData) {
                            // Normalize phone number to include +
                            $phoneNumber = $msgData['from'] ?? '';
                            if ($phoneNumber && !str_starts_with($phoneNumber, '+')) {
                                $phoneNumber = '+' . $phoneNumber;
                            }

                            $tenant = \App\Models\Tenant::where('meta_waba_id', $wabaId)->first();

                            if ($tenant) {
                                // Extract contact name if available
                                $contactName = 'WhatsApp User';
                                if (isset($value['contacts']) && is_array($value['contacts'])) {
                                    foreach ($value['contacts'] as $c) {
                                        if (($c['wa_id'] ?? '') === ($msgData['from'] ?? '')) {
                                            $contactName = $c['profile']['name'] ?? 'WhatsApp User';
                                            break;
                                        }
                                    }
                                }

                                // Ensure we use the normalized number for contact lookup
                                $contact = \App\Models\Contact::firstOrCreate(
                                    ['phone_number' => $phoneNumber, 'tenant_id' => $tenant->id],
                                    ['name' => $contactName]
                                );

                                $chat = \App\Models\Chat::firstOrCreate(
                                    ['contact_id' => $contact->id, 'tenant_id' => $tenant->id],
                                    ['status' => 'open']
                                );

                                $chat->touch();

                                $messageBody = '[Media/Unsupported]';
                                if (isset($msgData['text']['body'])) {
                                    $messageBody = $msgData['text']['body'];
                                } elseif (isset($msgData['button']['text'])) {
                                    $messageBody = $msgData['button']['text'];
                                } elseif (isset($msgData['interactive']['button_reply']['title'])) {
                                    $messageBody = $msgData['interactive']['button_reply']['title'];
                                } elseif (isset($msgData['interactive']['list_reply']['title'])) {
                                    $messageBody = $msgData['interactive']['list_reply']['title'];
                                } elseif (isset($msgData['image']['id'])) {
                                    $mediaUrl = (new \App\Services\WhatsAppService($tenant))->downloadMedia($msgData['image']['id']);
                                    $messageBody = $mediaUrl ? "![media]({$mediaUrl})" : '[Image]';
                                } elseif (isset($msgData['document']['id'])) {
                                    $mediaUrl = (new \App\Services\WhatsAppService($tenant))->downloadMedia($msgData['document']['id']);
                                    $messageBody = $mediaUrl ? "Document: {$mediaUrl}" : '[Document]';
                                } elseif (isset($msgData['video']['id'])) {
                                    $mediaUrl = (new \App\Services\WhatsAppService($tenant))->downloadMedia($msgData['video']['id']);
                                    $messageBody = $mediaUrl ? "Video: {$mediaUrl}" : '[Video]';
                                } elseif (isset($msgData['audio']['id'])) {
                                    $mediaUrl = (new \App\Services\WhatsAppService($tenant))->downloadMedia($msgData['audio']['id']);
                                    $messageBody = $mediaUrl ? "Audio: {$mediaUrl}" : '[Audio]';
                                }

                                $message = \App\Models\Message::create([
                                    'chat_id' => $chat->id,
                                    'sender_type' => 'contact',
                                    'message_body' => $messageBody,
                                    'meta_message_id' => $msgData['id'] ?? null,
                                    'status' => 'delivered'
                                ]);

                                // Use Tenant-specific Pusher config
                                \App\Services\PusherService::useTenantConfig($tenant);

                                broadcast(new \App\Events\MessageReceived($message))->toOthers();

                                // Trigger Automation
                                (new \App\Services\AutomationService())->processMessage($message);
                            }
                        }
                    }

                    // Process statuses (delivered, read, failed)
                    if (isset($value['statuses']) && is_array($value['statuses'])) {
                        foreach ($value['statuses'] as $statusData) {
                            $statusId = $statusData['id'] ?? null;
                            $status = $statusData['status'] ?? null;
                            
                            if ($statusId && $status) {
                                // Check if there are errors and extract them safely
                                $errorMessage = null;
                                if (isset($statusData['errors']) && is_array($statusData['errors']) && count($statusData['errors']) > 0) {
                                    $error = $statusData['errors'][0];
                                    if (is_array($error) && isset($error['message'])) {
                                        $errorMessage = $error['message'];
                                    } elseif (is_string($error)) {
                                        $errorMessage = $error;
                                    }
                                }
                                
                                // Update CampaignLog
                                $campaignLog = CampaignLog::where('message_id', $statusId)->first();
                                if ($campaignLog) {
                                    $campaignLog->update([
                                        'status' => $status,
                                        'error_message' => $errorMessage
                                    ]);
                                }

                                // Update standard Message status if it's a direct chat
                                $messageRecord = Message::where('meta_message_id', $statusId)->first();
                                if ($messageRecord) {
                                    $messageRecord->update(['status' => $status]);
                                }
                            }
                        }
                    }
                }
            }
        }

        return response('EVENT_RECEIVED', 200);
    }
}
