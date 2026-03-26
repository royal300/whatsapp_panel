<?php
namespace App\Models;

try {
    $tenant = Tenant::updateOrCreate(
        ['domain' => 'localhost'],
        [
            'name' => 'Royal300 Main',
            'meta_access_token' => 'EAAaJnjntZCIABRLvNpYhYxK7m1x3I0chstKraFyX1iZC1hIZCiS699PVbSqacvQ1dEkdbPQDT09tQGHDgFPGV19nRDgTOXKB4VWCFFjZAPB8zuE7D8JTtZCizGX4Vf2pJzZCkaZCmWmeEqh7mL5QF1N9wucHGyjkA39mOwbHsMFMLJG658wXIvFYAkmzAdxRUJjEWBDLKjqhmpjhCF6jkcg4IvsAeKgIPo0bk251FUup5yja3NuKumna5Hlsr2DVt33Ymkg6atq7QqoVNSy7sHY',
            'meta_phone_number_id' => '1064265423431400',
            'meta_waba_id' => '1790024925299028',
        ]
    );

    $user = User::updateOrCreate(
        ['email' => 'admin@royal300.com'],
        [
            'name' => 'Admin',
            'password' => bcrypt('password123'),
            'tenant_id' => $tenant->id,
            'role' => 'admin'
        ]
    );

    echo "SUCCESS: Admin account created/updated.\n";
    echo "Login: admin@royal300.com / password123\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
