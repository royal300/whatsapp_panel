<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('whatsapp_display_name')->nullable()->after('domain');
            $table->string('whatsapp_profile_picture_url')->nullable()->after('whatsapp_display_name');
            $table->text('whatsapp_business_description')->nullable()->after('whatsapp_profile_picture_url');
            $table->string('whatsapp_business_address')->nullable()->after('whatsapp_business_description');
            $table->string('whatsapp_business_email')->nullable()->after('whatsapp_business_address');
            $table->json('whatsapp_business_websites')->nullable()->after('whatsapp_business_email');
            $table->string('whatsapp_business_vertical')->nullable()->after('whatsapp_business_websites');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_display_name',
                'whatsapp_profile_picture_url',
                'whatsapp_business_description',
                'whatsapp_business_address',
                'whatsapp_business_email',
                'whatsapp_business_websites',
                'whatsapp_business_vertical',
            ]);
        });
    }
};
