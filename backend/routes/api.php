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
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::middleware('auth:sanctum')->group(function () {
    Broadcast::routes(); // Enable private channel authorization

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    
    Route::get('/tenant/settings', [\App\Http\Controllers\TenantSettingsController::class, 'index']);
    Route::post('/tenant/settings', [\App\Http\Controllers\TenantSettingsController::class, 'update']);
    Route::get('/tenant/business-profile', [\App\Http\Controllers\TenantSettingsController::class, 'getBusinessProfile']);
    Route::post('/tenant/business-profile', [\App\Http\Controllers\TenantSettingsController::class, 'updateBusinessProfile']);
    
    Route::post('/templates/sync', [TemplateController::class, 'sync']);

    Route::post('/contacts/bulk', [ContactController::class, 'bulkStore']);
    Route::delete('/contacts/all', [ContactController::class, 'destroyAll']);
    Route::apiResource('contacts', ContactController::class);
    Route::apiResource('templates', TemplateController::class);
    Route::apiResource('campaigns', CampaignController::class);
    Route::get('campaigns/{campaign}/analytics', [CampaignController::class, 'analytics']);

    Route::apiResource('chats', ChatController::class);
    Route::post('chats/{chat}/send', [ChatController::class, 'sendMessage']);
    Route::apiResource('automation-rules', \App\Http\Controllers\AutomationRuleController::class);
    Route::get('agents', [\App\Http\Controllers\AgentController::class, 'publicList']);

    Route::middleware('role:admin')->group(function () {
        // Only admins can access these
        Route::get('/admin/dashboard', function () {
            return response()->json(['message' => 'Welcome Admin']);
        });
        Route::get('/admin/agents', [\App\Http\Controllers\AgentController::class, 'index']);
        Route::post('/admin/agents', [\App\Http\Controllers\AgentController::class, 'store']);
        Route::put('/admin/agents/{id}', [\App\Http\Controllers\AgentController::class, 'update']);
        Route::delete('/admin/agents/{id}', [\App\Http\Controllers\AgentController::class, 'destroy']);
    });
});
