<?php

use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\WebhookController;

use App\Http\Controllers\TemplateController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ChatController;

Route::get('/webhook', [WebhookController::class, 'verify']);
Route::post('/webhook', [WebhookController::class, 'handle']);

Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::middleware('auth:sanctum')->group(function () {
    Broadcast::routes(); // Enable private channel authorization

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    
    Route::get('/tenant/settings', [\App\Http\Controllers\TenantSettingsController::class, 'index']);
    Route::post('/tenant/settings', [\App\Http\Controllers\TenantSettingsController::class, 'update']);
    Route::post('/tenant/settings/sync-profile', [\App\Http\Controllers\TenantSettingsController::class, 'syncProfile']);
    Route::post('/tenant/settings/logo', [\App\Http\Controllers\TenantSettingsController::class, 'updateLogo']);
    
    Route::post('/templates/sync', [TemplateController::class, 'sync']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    Route::post('contacts/import', [ContactController::class, 'import']);
    Route::apiResource('contacts', ContactController::class);
    Route::apiResource('templates', TemplateController::class);
    Route::apiResource('campaigns', CampaignController::class);
    Route::apiResource('chats', ChatController::class);
    Route::post('chats/{chat}/send', [ChatController::class, 'sendMessage']);
    Route::get('automation-rules', [\App\Http\Controllers\AutomationRuleController::class, 'index']);

    Route::middleware('role:admin')->group(function () {
        // Only admins can access these
        Route::get('/admin/dashboard', function () {
            return response()->json(['message' => 'Welcome Admin']);
        });
    });
});
