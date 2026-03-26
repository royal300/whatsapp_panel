<?php
use App\Models\Tenant;
use App\Models\User;

$t = Tenant::updateOrCreate(
    ['domain' => '127.0.0.1'],
    ['name' => 'Royal300 Main']
);

$u = User::updateOrCreate(
    ['email' => 'admin@royal300.com'],
    [
        'name' => 'Admin',
        'password' => bcrypt('password123'),
        'tenant_id' => $t->id,
        'role' => 'admin'
    ]
);

echo "Created/Updated Tenant ID: {$t->id} and User ID: {$u->id}\n";
