<?php
require '/var/www/whatsapp_panel/backend/vendor/autoload.php';
$app = require '/var/www/whatsapp_panel/backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenant = \App\Models\Tenant::first();
$token = $tenant->meta_access_token;
$wabaId = $tenant->meta_waba_id;

// Get the happyvalley template
$template = \App\Models\Template::where('name', 'happyvalley')->first() 
         ?? \App\Models\Template::first();

echo "Template: " . $template->name . " | Meta ID: " . $template->whatsapp_template_id . "\n";

$url = "https://graph.facebook.com/v21.0/{$wabaId}/template_analytics";
$res = \Illuminate\Support\Facades\Http::withToken($token)->get($url, [
    'start'        => strtotime('-40 days'),
    'end'          => time(),
    'granularity'  => 'DAILY',
    'template_ids' => $template->whatsapp_template_id,
]);

echo "\n=== RAW META RESPONSE ===\n";
echo $res->body() . "\n";
