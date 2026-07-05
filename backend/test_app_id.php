<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenant = \App\Models\Tenant::first();
if(!$tenant) { die("No tenant\n"); }

$token = $tenant->meta_access_token;
if(!$token) { die("No token\n"); }

$response = \Illuminate\Support\Facades\Http::withToken($token)->get('https://graph.facebook.com/v20.0/app');
echo "APP Endpoint: \n";
print_r($response->json());

$response2 = \Illuminate\Support\Facades\Http::withToken($token)->get('https://graph.facebook.com/v20.0/debug_token?input_token='.$token);
echo "Debug Token Endpoint: \n";
print_r($response2->json());
