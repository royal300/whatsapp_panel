<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ws = new App\Services\WhatsAppService(App\Models\Tenant::find(1));
echo json_encode($ws->syncTemplates());
