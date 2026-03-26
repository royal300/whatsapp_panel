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
        $tenantId = $chat->tenant_id;
        $text = strtolower(trim($message->message_body));

        // Find active rules for this tenant
        $rules = AutomationRule::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get();

        foreach ($rules as $rule) {
            if ($this->shouldTrigger($rule, $text)) {
                $this->executeAction($rule, $chat);
            }
        }
    }

    /**
     * Check if a rule should trigger based on message text.
     */
    protected function shouldTrigger(AutomationRule $rule, string $text): bool
    {
        switch ($rule->trigger_type) {
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
                    $whatsapp->sendTemplateMessage(
                        $chat->contact->phone_number,
                        $rule->template->name,
                        $rule->template->language
                    );
                    
                    $billing->incrementUsage($tenant);

                    // Store the bot's reply message
                    Message::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'bot',
                        'message_body' => "Automated Reply: " . $rule->template->name,
                        'status' => 'sent'
                    ]);
                }
                break;

            case 'assign_agent':
                // Logic to transition chat status or assign user_id
                $chat->update(['status' => 'open']);
                break;
        }
    }
}
