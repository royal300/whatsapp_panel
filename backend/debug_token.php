<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$t = App\Models\Tenant::find(1);
$token = $t->meta_access_token;
$res = Illuminate\Support\Facades\Http::get('https://graph.facebook.com/v21.0/debug_token', [
    'input_token' => $token,
    'access_token' => $token
]);
echo "DEBUG_TOKEN:\n" . json_encode($res->json(), JSON_PRETTY_PRINT) . "\n";
