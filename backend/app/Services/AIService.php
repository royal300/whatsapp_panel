<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    /**
     * Generate an AI reply for a given message.
     */
    public static function generateReply(string $messageText, Tenant $tenant): ?string
    {
        // Completely stop and disable AI execution on local environments or if no keys are configured
        if (app()->environment('local') || !(env('GEMINI_API_KEY') || env('OPENAI_API_KEY'))) {
            return null;
        }

        $apiKey = env('GEMINI_API_KEY') ?: env('OPENAI_API_KEY');

        try {
            if (env('GEMINI_API_KEY')) {
                // Call Gemini API
                $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => "You are a helpful customer support agent for '{$tenant->name}'. Keep your response concise (under 2 sentences) and suitable for a WhatsApp message. Answer this message: {$messageText}"]
                            ]
                        ]
                    ]
                ]);
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            } else {
                // Call OpenAI API
                $response = Http::withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-3.5-turbo',
                    'messages' => [
                        ['role' => 'system', 'content' => "You are a helpful customer support agent for '{$tenant->name}'. Keep your response concise (under 2 sentences) and suitable for a WhatsApp message."],
                        ['role' => 'user', 'content' => $messageText]
                    ]
                ]);
                $data = $response->json();
                return $data['choices'][0]['message']['content'] ?? null;
            }
        } catch (\Exception $e) {
            Log::error('AI Service Error: ' . $e->getMessage());
            return null;
        }
    }
}
