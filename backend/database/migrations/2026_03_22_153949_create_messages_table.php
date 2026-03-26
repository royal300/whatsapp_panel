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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->onDelete('cascade');
            $table->enum('sender_type', ['contact', 'agent', 'bot', 'system']);
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // if sent by agent
            $table->text('message_body');
            $table->string('meta_message_id')->nullable(); // ID returned by WhatsApp
            $table->string('status')->default('sent'); // sent, delivered, read, failed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
