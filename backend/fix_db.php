<?php
use App\Models\AutomationRule;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$count = AutomationRule::whereNull('trigger_type')
    ->orWhere('trigger_type', '')
    ->update(['trigger_type' => 'keyword']);

echo "Updated $count automation rules successfully!\n";
unlink(__file__); // Auto-delete the file after run for security
