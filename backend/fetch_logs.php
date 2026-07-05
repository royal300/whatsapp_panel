<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$logs = \App\Models\CampaignLog::orderBy('id', 'desc')->take(10)->get();
print_r($logs->toArray());
