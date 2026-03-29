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

    /**
     * Get a single template by name from Meta.
     */
    public function getTemplateByName(string $name)
    {
        if (!$this->tenant->meta_waba_id) throw new Exception("WABA ID missing.");
        $url = "{$this->baseUrl}/{$this->tenant->meta_waba_id}/message_templates";

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(10)
            ->get($url, [
                'name' => $name
            ]);

        return $response->json();
    }

    /**
     * Get WhatsApp Business Profile details.
     */
    public function getBusinessProfile()
    {
        if (!$this->tenant->meta_phone_number_id) throw new Exception("Phone Number ID missing.");
        $url = "{$this->baseUrl}/{$this->tenant->meta_phone_number_id}/whatsapp_business_profile";

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(15)
            ->get($url, [
                'fields' => 'about,address,description,email,profile_picture_url,websites,vertical'
            ]);

        return $response->json();
    }

    /**
     * Update WhatsApp Business Profile details.
     */
    public function updateBusinessProfile(array $data)
    {
        if (!$this->tenant->meta_phone_number_id) throw new Exception("Phone Number ID missing.");
        $url = "{$this->baseUrl}/{$this->tenant->meta_phone_number_id}/whatsapp_business_profile";

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(15)
            ->post($url, array_merge(['messaging_product' => 'whatsapp'], $data));

        return $response->json();
    }

    /**
     * Upload and update the business profile picture.
     */
    public function updateProfilePicture($file)
    {
        if (!$this->tenant->meta_access_token) throw new Exception("Meta Access Token missing.");
        if (!$this->tenant->meta_phone_number_id) throw new Exception("Phone Number ID missing.");

        // Ensure Meta App ID is present for resumable upload
        if (!$this->tenant->meta_app_id) {
            // Try to discover App ID from the token automatically
            try {
                $statusResp = Http::get("https://graph.facebook.com/debug_token", [
                    'input_token' => $this->tenant->meta_access_token,
                    'access_token' => $this->tenant->meta_access_token
                ]);
                
                if ($statusResp->successful() && isset($statusResp->json()['data']['app_id'])) {
                    $appId = $statusResp->json()['data']['app_id'];
                    $this->tenant->update(['meta_app_id' => $appId]);
                    $this->tenant->meta_app_id = $appId; // Update in-memory for the current service instance
                } else {
                    throw new Exception("Meta App ID is missing and auto-discovery failed. " . ($statusResp->json()['error']['message'] ?? 'Please provide it manually in API settings.'));
                }
            } catch (Exception $e) {
                throw new Exception("Meta App ID is required for media uploads. " . $e->getMessage());
            }
        }

        $fileSize = $file->getSize();
        $fileType = $file->getMimeType();

        // 1. Initialize Resumable Upload
        $initUrl = "{$this->baseUrl}/{$this->tenant->meta_app_id}/uploads";
        $initResponse = Http::withToken($this->tenant->meta_access_token)
            ->post($initUrl, [
                'file_length' => $fileSize,
                'file_type' => $fileType,
            ]);

        if (!$initResponse->successful()) {
            throw new Exception("Meta Upload Initialization Failed: " . $initResponse->body());
        }

        $uploadSessionId = $initResponse->json('id');

        // 2. Upload File Content
        $uploadUrl = "{$this->baseUrl}/{$uploadSessionId}";
        $uploadResponse = Http::withToken($this->tenant->meta_access_token)
            ->withBody(file_get_contents($file->getRealPath()), $fileType)
            ->post($uploadUrl);

        if (!$uploadResponse->successful()) {
            throw new Exception("Meta File Upload Failed: " . $uploadResponse->body());
        }

        $fileHandle = $uploadResponse->json('h');

        // 3. Update Profile with Handle
        return $this->updateBusinessProfile([
            'profile_picture_handle' => $fileHandle
        ]);
    }
}
