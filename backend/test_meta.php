<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$t = App\Models\Tenant::find(1);
$res = Illuminate\Support\Facades\Http::withToken($t->meta_access_token)
    ->post('https://graph.facebook.com/v21.0/' . $t->meta_waba_id . '/message_templates', [
        'name' => 'test_no_ex_' . time(),
        'category' => 'MARKETING',
        'language' => 'en_US',
        'components' => [
            ['type' => 'HEADER', 'format' => 'IMAGE'],
            ['type' => 'BODY', 'text' => 'Testing without example']
        ]
    ]);
echo "RESPONSE:\n" . json_encode($res->json(), JSON_PRETTY_PRINT) . "\n";
