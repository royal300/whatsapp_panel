<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TenantSettingsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : \App\Models\Tenant::first();

        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        return response()->json($tenant);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : \App\Models\Tenant::first();

        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $data = $request->only([
            'meta_waba_id',
            'meta_phone_number_id',
            'meta_access_token',
            'meta_app_id',
            'meta_app_secret',
            'pusher_app_id',
            'pusher_app_key',
            'pusher_app_secret',
            'pusher_app_cluster',
            'whatsapp_display_name',
            'whatsapp_business_description',
            'whatsapp_business_address',
            'whatsapp_business_email',
            'whatsapp_business_websites',
            'whatsapp_business_vertical'
        ]);

        // Filter out nulls to prevent accidental overwrites if fields were missing
        // except for business profile fields which might be cleared
        $updatableData = array_filter($data, fn($v) => !is_null($v));

        $tenant->update($updatableData);

        // If business profile fields are present, sync to Meta
        $profileFields = ['description', 'address', 'email', 'vertical', 'websites'];
        $metaData = [];
        foreach ($profileFields as $field) {
            $dbField = "whatsapp_business_{$field}";
            if ($request->has($dbField)) {
                $metaData[$field] = $request->input($dbField);
            }
        }

        if (!empty($metaData) && $tenant->meta_access_token && $tenant->meta_phone_number_id) {
            try {
                $whatsapp = new \App\Services\WhatsAppService($tenant);
                $whatsapp->updateBusinessProfile($metaData);
            } catch (\Exception $e) {
                \Log::error('Failed to sync business profile to Meta: ' . $e->getMessage());
            }
        }

        \Log::info('Tenant settings updated', ['tenant_id' => $tenant->id, 'updated_fields' => array_keys($updatableData)]);

        return response()->json([
            'message' => 'Settings updated successfully',
            'data' => $tenant->fresh()
        ]);
    }

    /**
     * Sync business profile from Meta to local DB.
     */
    public function syncProfile()
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : \App\Models\Tenant::first();

        if (!$tenant || !$tenant->meta_access_token || !$tenant->meta_phone_number_id) {
            return response()->json(['message' => 'Credentials not set'], 400);
        }

        try {
            $whatsapp = new \App\Services\WhatsAppService($tenant);
            $response = $whatsapp->getBusinessProfile();

            if (isset($response['data'][0])) {
                $profile = $response['data'][0];
                $tenant->update([
                    'whatsapp_business_description' => $profile['description'] ?? null,
                    'whatsapp_business_address' => $profile['address'] ?? null,
                    'whatsapp_business_email' => $profile['email'] ?? null,
                    'whatsapp_business_vertical' => $profile['vertical'] ?? null,
                    'whatsapp_business_websites' => $profile['websites'] ?? [],
                    'whatsapp_profile_picture_url' => $profile['profile_picture_url'] ?? null,
                ]);

                return response()->json(['message' => 'Profile synced from WhatsApp', 'data' => $tenant]);
            }

            return response()->json(['message' => 'No profile data found in Meta', 'response' => $response], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update business profile picture in Meta.
     */
    public function updateLogo(Request $request)
    {
        \Log::info('UpdateLogo called', ['has_file' => $request->hasFile('logo')]);
        
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png|max:5120',
        ]);

        $user = Auth::user();
        $tenant = $user ? $user->tenant : \App\Models\Tenant::first();

        if (!$tenant || !$tenant->meta_access_token || !$tenant->meta_phone_number_id) {
            \Log::error('Logo update failed: Missing credentials', ['tenant_id' => $tenant->id ?? 'none']);
            return response()->json(['message' => 'WhatsApp Credentials not set'], 400);
        }

        try {
            \Log::info('Initiating Meta logo upload', ['app_id' => $tenant->meta_app_id]);
            $whatsapp = new \App\Services\WhatsAppService($tenant);
            $response = $whatsapp->updateProfilePicture($request->file('logo'));
            
            \Log::info('Meta logo update response', ['response' => $response]);

            if (isset($response['error'])) {
                return response()->json(['message' => 'Meta API Error: ' . ($response['error']['message'] ?? 'Unknown Error')], 500);
            }

            // Sync after update to get the new URL
            $syncResponse = $whatsapp->getBusinessProfile();
            if (isset($syncResponse['data'][0])) {
                $tenant->update([
                    'whatsapp_profile_picture_url' => $syncResponse['data'][0]['profile_picture_url'] ?? $tenant->whatsapp_profile_picture_url,
                ]);
            }

            return response()->json([
                'message' => 'Profile picture updated successfully',
                'profile_picture_url' => $tenant->whatsapp_profile_picture_url
            ]);
        } catch (\Exception $e) {
            \Log::error('Logo update exception: ' . $e->getMessage());
            return response()->json(['message' => 'Update failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
