<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $tenant = Tenant::updateOrCreate(
            ['domain' => 'localhost'],
            ['name' => 'Royal300 Main']
        );

        // Only set default credentials if they are currently completely empty
        if (!$tenant->meta_access_token) {
            $tenant->update([
                'meta_access_token' => 'EAAaJnjntZCIABRLvNpYhYxK7m1x3I0chstKraFyX1iZC1hIZCiS699PVbSqacvQ1dEkdbPQDT09tQGHDgFPGV19nRDgTOXKB4VWCFFjZAPB8zuE7D8JTtZCizGX4Vf2pJzZCkaZCmWmeEqh7mL5QF1N9wucHGyjkA39mOwbHsMFMLJG658wXIvFYAkmzAdxRUJjEWBDLKjqhmpjhCF6jkcg4IvsAeKgIPo0bk251FUup5yja3NuKumna5Hlsr2DVt33Ymkg6atq7QqoVNSy7sHY',
                'meta_phone_number_id' => '1064265423431400',
                'meta_waba_id' => '1790024925299028',
            ]);
        }

        $user = User::updateOrCreate(
            ['email' => 'admin@royal300.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password123'),
                'tenant_id' => $tenant->id,
                'role' => 'admin'
            ]
        );

        $plan = \App\Models\Plan::updateOrCreate(
            ['name' => 'Unlimited Plan'],
            [
                'price' => 0,
                'message_limit' => 1000000,
                'billing_cycle' => 'monthly'
            ]
        );

        \App\Models\Subscription::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'plan_id' => $plan->id,
                'credits_used' => 0,
                'starts_at' => now(),
                'ends_at' => now()->addYears(10),
                'status' => 'active'
            ]
        );
    }
}
