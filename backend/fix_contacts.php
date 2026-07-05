<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Contact;
use App\Models\Chat;

$contacts = Contact::all();
foreach ($contacts as $contact) {
    if (!str_starts_with($contact->phone_number, '+')) {
        $normalizedPhone = '+' . $contact->phone_number;
        $existing = Contact::where('phone_number', $normalizedPhone)
                           ->where('tenant_id', $contact->tenant_id)
                           ->first();
        if ($existing) {
            Chat::where('contact_id', $contact->id)->update(['contact_id' => $existing->id]);
            $contact->delete();
            echo "Merged {$contact->phone_number} into {$normalizedPhone}\n";
        } else {
            $contact->update(['phone_number' => $normalizedPhone]);
            echo "Updated {$contact->phone_number} to {$normalizedPhone}\n";
        }
    }
}
