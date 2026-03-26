<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Exception;

class WhatsAppService
{
    protected string $baseUrl = 'https://graph.facebook.com/v21.0';
    protected Tenant $tenant;

    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;

        if (!$this->tenant->meta_access_token) {
            throw new Exception("WhatsApp API Credentials NOT set for this tenant.");
        }
    }

    /**
     * Send a plain text message to a user.
     */
    public function sendTextMessage(string $to, string $text)
    {
        if (!$this->tenant->meta_phone_number_id) throw new Exception("Phone Number ID missing.");
        $url = "{$this->baseUrl}/{$this->tenant->meta_phone_number_id}/messages";

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(10)
            ->post($url, [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'text',
                'text' => [
                    'preview_url' => false,
                    'body' => $text
                ]
            ]);

        return $response->json();
    }

    /**
     * Send a template message to a user.
     */
    public function sendTemplateMessage(string $to, string $templateName, string $languageCode = 'en', array $components = [])
    {
        if (!$this->tenant->meta_phone_number_id) throw new Exception("Phone Number ID missing.");
        $url = "{$this->baseUrl}/{$this->tenant->meta_phone_number_id}/messages";

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(10)
            ->post($url, [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => [
                        'code' => $languageCode
                    ],
                    'components' => $components
                ]
            ]);

        return $response->json();
    }

    /**
     * Create a new message template in Meta.
     */
    public function createTemplate(string $name, string $category, string $language, array $components)
    {
        if (!$this->tenant->meta_waba_id) throw new Exception("WABA ID missing.");
        $url = "{$this->baseUrl}/{$this->tenant->meta_waba_id}/message_templates";

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(10)
            ->post($url, [
                'name' => $name,
                'category' => $category,
                'language' => $language,
                'components' => $components
            ]);

        return $response->json();
    }

    /**
     * Sync approved templates from WhatsApp Business Account (WABA).
     */
    public function syncTemplates()
    {
        if (!$this->tenant->meta_waba_id) throw new Exception("WABA ID missing.");
        $url = "{$this->baseUrl}/{$this->tenant->meta_waba_id}/message_templates";

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(10)
            ->get($url, [
                'limit' => 100
            ]);

        return $response->json();
    }
}
