<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->json('features')->nullable()->after('ai_quick_replies_enabled');
        });

        // Set default features for existing tenants
        $defaultFeatures = json_encode([
            'flow_builder' => true,
            'automation' => true,
            'campaigns' => true,
            'templates' => true,
            'team_inbox' => true,
            'agents' => true,
            'analytics' => true,
            'settings' => true
        ]);
        DB::table('tenants')->update(['features' => DB::raw("'$defaultFeatures'")]);
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('features');
        });
    }
};
