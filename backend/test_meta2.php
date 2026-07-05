<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$t = App\Models\Tenant::find(1);
$res = Illuminate\Support\Facades\Http::withToken($t->meta_access_token)
    ->post('https://graph.facebook.com/v21.0/' . $t->meta_waba_id . '/message_templates', [
        'name' => 'test_url_' . time(),
        'category' => 'MARKETING',
        'language' => 'en_US',
        'components' => [
            [
                'type' => 'HEADER', 
                'format' => 'IMAGE',
                'example' => [
                    'header_handle' => [
                        // Try to trick it by passing a URL as a handle?
                        // Or pass header_url
                    ]
                ]
            ],
            ['type' => 'BODY', 'text' => 'Testing url']
        ]
    ]);
echo "RESPONSE:\n" . json_encode($res->json(), JSON_PRETTY_PRINT) . "\n";
