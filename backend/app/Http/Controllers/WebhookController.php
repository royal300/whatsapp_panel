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

        // Logic to extract message and chat...
        // For MVP, if there is a message, we create it and broadcast
        if (isset($payload['entry'][0]['changes'][0]['value']['messages'][0])) {
            $msgData = $payload['entry'][0]['changes'][0]['value']['messages'][0];
            $wabaId = $payload['entry'][0]['id'];
            $tenant = \App\Models\Tenant::where('meta_waba_id', $wabaId)->first();

            if ($tenant) {
                $contact = \App\Models\Contact::where('phone_number', $msgData['from'])
                    ->where('tenant_id', $tenant->id)
                    ->first();

                $profileName = $payload['entry'][0]['changes'][0]['value']['contacts'][0]['profile']['name'] ?? 'WhatsApp User';

                if (!$contact) {
                    $contact = \App\Models\Contact::create([
                        'phone_number' => $msgData['from'],
                        'tenant_id' => $tenant->id,
                        'name' => $profileName,
                        'status' => 'subscribed'
                    ]);
                } elseif ($contact->name === 'WhatsApp User' && $profileName !== 'WhatsApp User') {
                    // Update if we only have generic name but Meta gave us a real one
                    $contact->update(['name' => $profileName]);
                }

                $chat = \App\Models\Chat::firstOrCreate(
                    ['contact_id' => $contact->id, 'tenant_id' => $tenant->id],
                    ['status' => 'open']
                );

                $chat->touch();

                $message = \App\Models\Message::create([
                    'chat_id' => $chat->id,
                    'sender_type' => 'contact',
                    'message_body' => $msgData['text']['body'] ?? '[Media/Unsupported]',
                    'meta_message_id' => $msgData['id'],
                    'status' => 'delivered'
                ]);

                // Use Tenant-specific Pusher config
                \App\Services\PusherService::useTenantConfig($tenant);

                broadcast(new \App\Events\MessageReceived($message))->toOthers();

                // Trigger Automation
                (new \App\Services\AutomationService())->processMessage($message);
            }
        }

        return response('EVENT_RECEIVED', 200);
    }
}
