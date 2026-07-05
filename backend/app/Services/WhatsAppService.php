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

        $payload = [
            'name' => $name,
            'category' => $category,
            'language' => $language,
            'components' => $components
        ];

        \Illuminate\Support\Facades\Log::info('Meta Create Template Request: ', $payload);

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(10)
            ->post($url, $payload);

        $resJson = $response->json();
        \Illuminate\Support\Facades\Log::info('Meta Create Template Response: ', $resJson ?? []);

        return $resJson;
    }

    /**
     * Upload media to Resumable Upload API and return handle.
     */
    public function uploadMedia(string $fileContent, string $fileType, int $fileLength)
    {
        // 1. Ensure we have the App ID
        if (empty($this->tenant->meta_app_id)) {
            $debugRes = Http::get("{$this->baseUrl}/debug_token", [
                'input_token' => $this->tenant->meta_access_token,
                'access_token' => $this->tenant->meta_access_token
            ]);
            $appId = $debugRes->json()['data']['app_id'] ?? null;
            if (!$appId) {
                throw new Exception("Could not resolve App ID from access token.");
            }
            $this->tenant->meta_app_id = $appId;
            $this->tenant->save();
        }

        $appId = $this->tenant->meta_app_id;

        // 2. Create upload session
        $sessionUrl = "{$this->baseUrl}/{$appId}/uploads?file_length={$fileLength}&file_type={$fileType}";
        $sessionRes = Http::withToken($this->tenant->meta_access_token)
            ->post($sessionUrl);
            
        $sessionId = $sessionRes->json()['id'] ?? null;
        if (!$sessionId) {
            throw new Exception("Failed to create Meta upload session: " . $sessionRes->body());
        }

        // 3. Upload file content
        $uploadRes = Http::withToken($this->tenant->meta_access_token)
            ->withHeaders([
                'file_offset' => '0'
            ])
            ->withBody($fileContent, $fileType)
            ->post("{$this->baseUrl}/{$sessionId}");

        $handle = $uploadRes->json()['h'] ?? null;
        if (!$handle) {
            throw new Exception("Failed to upload media to Meta: " . $uploadRes->body());
        }

        return $handle;
    }

    /**
     * Download media from WhatsApp by media ID.
     */
    public function downloadMedia(string $mediaId)
    {
        // 1. Get media URL
        $res = Http::withToken($this->tenant->meta_access_token)
            ->get("{$this->baseUrl}/{$mediaId}");
            
        $mediaUrl = $res->json()['url'] ?? null;
        $mimeType = $res->json()['mime_type'] ?? 'image/jpeg';
        
        if (!$mediaUrl) {
            \Log::error("Failed to get media URL for ID $mediaId", $res->json());
            return null;
        }

        // 2. Download binary content
        $downloadRes = Http::withToken($this->tenant->meta_access_token)->get($mediaUrl);
        
        if (!$downloadRes->successful()) {
            \Log::error("Failed to download media binary from $mediaUrl");
            return null;
        }

        // 3. Save to public storage
        $extension = explode('/', $mimeType)[1] ?? 'jpg';
        // Handle common mime type mappings
        if ($extension === 'jpeg') $extension = 'jpg';
        
        $filename = 'received_media/' . uniqid('wa_media_') . '.' . $extension;
        \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $downloadRes->body());

        return asset('storage/' . $filename);
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
     * Fetch template-level analytics from Meta's WABA template_analytics API.
     * Returns sent, delivered, read, button click counts per template per day.
     */
    public function getTemplateAnalytics(string $templateMetaId, ?string $startDate = null, ?string $endDate = null): array
    {
        if (!$this->tenant->meta_waba_id) throw new Exception("WABA ID missing.");

        // Default to 40 days to ensure campaign data is captured
        $end   = $endDate   ? strtotime($endDate)   : time();
        $start = $startDate ? strtotime($startDate) : strtotime('-40 days');

        $url = "{$this->baseUrl}/{$this->tenant->meta_waba_id}/template_analytics";

        $response = Http::withToken($this->tenant->meta_access_token)
            ->timeout(15)
            ->get($url, [
                'start'        => $start,
                'end'          => $end,
                'granularity'  => 'DAILY',
                'template_ids' => $templateMetaId,   // Must be numeric Meta template ID
            ]);

        $raw = $response->json();
        \Illuminate\Support\Facades\Log::info('Meta Template Analytics Raw', ['status' => $response->status(), 'body' => substr($response->body(), 0, 500)]);

        // Meta response format:
        // data[0].data[] = array of daily data points
        // Each dp: { template_id, start, end, sent, delivered, read, replied,
        //            clicked: [{type, button_content, count}], cost: [...] }
        $dataPoints = $raw['data'][0]['data'] ?? [];

        $summary = ['sent' => 0, 'delivered' => 0, 'read' => 0, 'replied' => 0, 'clicked' => 0];
        $buttonClicks = [];  // [{label, type, count}]
        $daily = [];         // [{date, sent, delivered, read, clicked}]

        foreach ($dataPoints as $dp) {
            $summary['sent']      += $dp['sent']      ?? 0;
            $summary['delivered'] += $dp['delivered'] ?? 0;
            $summary['read']      += $dp['read']       ?? 0;
            $summary['replied']   += $dp['replied']    ?? 0;

            // clicked is an array of button click objects
            $clickedArr = is_array($dp['clicked'] ?? null) ? $dp['clicked'] : [];
            $dayClicks  = 0;
            foreach ($clickedArr as $click) {
                // Only count unique_url_button or url_button (not both — prefer unique)
                if (($click['type'] ?? '') === 'unique_url_button') {
                    $dayClicks += $click['count'] ?? 0;
                    $label = $click['button_content'] ?? 'Button';
                    $buttonClicks[$label] = ($buttonClicks[$label] ?? 0) + ($click['count'] ?? 0);
                }
            }
            $summary['clicked'] += $dayClicks;

            if (($dp['sent'] ?? 0) > 0 || ($dp['delivered'] ?? 0) > 0 || ($dp['read'] ?? 0) > 0 || $dayClicks > 0) {
                $daily[] = [
                    'date'      => date('M j', $dp['start'] ?? time()),
                    'sent'      => $dp['sent']      ?? 0,
                    'delivered' => $dp['delivered'] ?? 0,
                    'read'      => $dp['read']       ?? 0,
                    'clicked'   => $dayClicks,
                ];
            }
        }

        // Build button click rows
        $buttonRows = [];
        foreach ($buttonClicks as $label => $count) {
            $buttonRows[] = ['label' => $label, 'type' => 'Website click', 'count' => $count];
        }

        return [
            'summary'      => $summary,
            'daily'        => $daily,
            'button_clicks' => $buttonRows,
            'raw'          => $raw,  // Keep raw for debugging
        ];
    }
}

