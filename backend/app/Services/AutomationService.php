<?php

namespace App\Services;

use App\Models\Message;
use App\Models\AutomationRule;
use App\Models\Chat;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

class AutomationService
{
    /**
     * Process an incoming message through automation rules.
     */
    public function processMessage(Message $message)
    {
        $chat = $message->chat;
        $tenant = $chat->tenant;
        $text = strtolower(trim($message->message_body));

        // If AI Quick Replies is enabled, use AIService to auto-respond
        if ($tenant->ai_quick_replies_enabled) {
            $aiReply = AIService::generateReply($message->message_body, $tenant);
            if ($aiReply) {
                $billing = new BillingService();
                if ($billing->canSend($tenant)) {
                    $whatsapp = new WhatsAppService($tenant);
                    $whatsapp->sendTextMessage($chat->contact->phone_number, $aiReply);
                    $billing->incrementUsage($tenant);

                    // Save bot response to database
                    $replyMsg = Message::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'bot',
                        'message_body' => $aiReply,
                        'status' => 'sent'
                    ]);

                    // Use Tenant-specific Pusher config and broadcast
                    PusherService::useTenantConfig($tenant);
                    broadcast(new \App\Events\MessageReceived($replyMsg))->toOthers();

                    return; // Skip standard keyword responders if AI handled the message
                }
            }
        }

        // Find active rules for this tenant
        $rules = AutomationRule::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get();

        foreach ($rules as $rule) {
            if ($this->shouldTrigger($rule, $text)) {
                $this->executeAction($rule, $chat);
            }
        }
    }

    protected function shouldTrigger(AutomationRule $rule, string $text): bool
    {
        $triggerType = $rule->trigger_type ?: 'keyword';
        switch ($triggerType) {
            case 'keyword':
                return $text === strtolower($rule->trigger_keyword);
            
            case 'default_reply':
                // For MVP, we can treat this as a fallback if no other keyword matched
                // (requires a bit more logic in the loop, but skipping for now)
                return false;

            default:
                return false;
        }
    }

    /**
     * Execute the action defined in the rule.
     */
    protected function executeAction(AutomationRule $rule, Chat $chat)
    {
        $billing = new BillingService();
        $tenant = $chat->tenant;

        switch ($rule->action_type) {
            case 'send_message':
                if ($rule->template_id && $billing->canSend($tenant)) {
                    $whatsapp = new WhatsAppService($tenant);
                    
                    $components = [];
                    $bodyText = '';
                    
                    if ($rule->template && is_array($rule->template->content)) {
                        foreach ($rule->template->content as $component) {
                            if (isset($component['type']) && $component['type'] === 'BODY') {
                                $bodyText = $component['text'] ?? '';
                                if (isset($component['example']['body_text'][0])) {
                                    $params = [];
                                    foreach ($component['example']['body_text'][0] as $val) {
                                        $params[] = ['type' => 'text', 'text' => (string)$val];
                                        // Update bodyText for inbox simulation
                                        $bodyText = preg_replace('/\{\{\d+\}\}/', $val, $bodyText, 1);
                                    }
                                    $components[] = [
                                        'type' => 'body',
                                        'parameters' => $params
                                    ];
                                }
                            }
                            
                            if (isset($component['type']) && $component['type'] === 'HEADER') {
                                if (in_array($component['format'] ?? '', ['IMAGE', 'VIDEO', 'DOCUMENT'])) {
                                    $format = strtolower($component['format']);
                                    $handle = $component['example']['header_handle'][0] ?? null;
                                    if ($handle) {
                                        $components[] = [
                                            'type' => 'header',
                                            'parameters' => [
                                                [
                                                    'type' => $format,
                                                    $format => ['link' => $handle]
                                                ]
                                            ]
                                        ];
                                        if ($format === 'image') {
                                            $bodyText = "![media]({$handle})\n\n" . $bodyText;
                                        }
                                    }
                                }
                            }
                            
                            if (isset($component['type']) && $component['type'] === 'FOOTER') {
                                $footerText = $component['text'] ?? '';
                                if ($footerText) {
                                    $bodyText .= "\n\n_{$footerText}_";
                                }
                            }

                            if (isset($component['type']) && $component['type'] === 'BUTTONS') {
                                $bodyText .= "\n\n";
                                foreach ($component['buttons'] as $btn) {
                                    $bodyText .= "🔘 {$btn['text']}  ";
                                }
                            }
                        }
                    }

                    $res = $whatsapp->sendTemplateMessage(
                        $chat->contact->phone_number,
                        $rule->template->name,
                        $rule->template->language,
                        $components
                    );
                    \Illuminate\Support\Facades\Log::info("Automation Template Send Result:", $res ?? []);
                    
                    if (isset($res['error'])) {
                        \Illuminate\Support\Facades\Log::error("Failed to send automation template: " . json_encode($res['error']));
                    }

                    $fullMessage = !empty($bodyText) ? $bodyText : "[Template: " . $rule->template->name . "]";

                    $billing->incrementUsage($tenant);

                    // Store the bot's reply message
                    $replyMsg = Message::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'bot',
                        'message_body' => $fullMessage,
                        'status' => isset($res['error']) ? 'failed' : 'sent'
                    ]);

                    // Use Tenant-specific Pusher config and broadcast
                    PusherService::useTenantConfig($tenant);
                    broadcast(new \App\Events\MessageReceived($replyMsg))->toOthers();
                }
                break;

            case 'assign_agent':
                // Logic to transition chat status or assign user_id
                $chat->update(['status' => 'open']);
                break;
        }
    }
}
