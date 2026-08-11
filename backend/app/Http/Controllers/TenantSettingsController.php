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
        \Log::info('Settings Update Initiated', [
            'user_id' => $user?->id,
            'email' => $user?->email
        ]);

        $tenant = $user ? $user->tenant : \App\Models\Tenant::first();

        if (!$tenant) {
            \Log::error('Settings Update Failed: Tenant not found');
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $data = $request->only([
            'meta_waba_id',
            'meta_phone_number_id',
            'meta_access_token',
            'meta_catalog_id',
            'pusher_app_id',
            'pusher_app_key',
            'pusher_app_secret',
            'pusher_app_cluster',
            'ai_quick_replies_enabled'
        ]);

        // Filter out nulls
        $data = array_filter($data, fn($v) => !is_null($v));

        // Trim specific fields if they exist in data
        foreach (['meta_waba_id', 'meta_phone_number_id', 'meta_access_token'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = trim($data[$field]);
            }
        }

        \Log::info('Incoming Settings Data', [
            'tenant_id' => $tenant->id,
            'payload' => array_keys($data) // log keys for security
        ]);

        $tenant->fill($data);
        $saved = $tenant->save();

        if ($saved) {
            \Log::info('Settings updated successfully in database', ['tenant_id' => $tenant->id]);
        } else {
            \Log::error('Database save operation failed', ['tenant_id' => $tenant->id]);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'data' => $tenant,
            'debug_saved' => $saved
        ]);
    }

    public function getBusinessProfile()
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : \App\Models\Tenant::first();

        if (!$tenant || !$tenant->meta_access_token || !$tenant->meta_phone_number_id) {
            return response()->json(['message' => 'Meta credentials missing'], 400);
        }

        // 1. Fetch Profile Data (About, Address, etc.)
        $profileUrl = "https://graph.facebook.com/v20.0/{$tenant->meta_phone_number_id}/whatsapp_business_profile?fields=about,address,description,email,vertical,websites,profile_picture_url";
        $profileResponse = \Illuminate\Support\Facades\Http::withToken($tenant->meta_access_token)->get($profileUrl);

        // 2. Fetch Phone Number Data (verified_name / display_name)
        $phoneUrl = "https://graph.facebook.com/v20.0/{$tenant->meta_phone_number_id}?fields=display_phone_number,verified_name";
        $phoneResponse = \Illuminate\Support\Facades\Http::withToken($tenant->meta_access_token)->get($phoneUrl);

        $data = $profileResponse->json();
        if (isset($data['data'][0])) {
            $data['data'][0]['verified_name'] = $phoneResponse->json()['verified_name'] ?? 'Unknown Business';
        }

        return response()->json($data);
    }

    public function updateBusinessProfile(Request $request)
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : \App\Models\Tenant::first();

        if (!$tenant || !$tenant->meta_access_token || !$tenant->meta_phone_number_id) {
            return response()->json(['message' => 'Meta credentials missing'], 400);
        }

        $fields = $request->only(['about', 'address', 'description', 'email', 'vertical', 'websites']);
        $fields['messaging_product'] = 'whatsapp';

        // Filter out null or empty websites
        if (isset($fields['websites']) && is_array($fields['websites'])) {
            $fields['websites'] = array_values(array_filter($fields['websites']));
        }
        
        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $fileLength = $file->getSize();
            $fileType = $file->getMimeType();

            // 1. Get App ID
            $appRes = \Illuminate\Support\Facades\Http::withToken($tenant->meta_access_token)->get('https://graph.facebook.com/v20.0/app');
            $appId = $appRes->json()['id'] ?? null;

            if ($appId) {
                // 2. Create Resumable Upload Session
                $sessionRes = \Illuminate\Support\Facades\Http::withToken($tenant->meta_access_token)
                    ->post("https://graph.facebook.com/v20.0/{$appId}/uploads?file_length={$fileLength}&file_type={$fileType}");
                
                $uploadId = $sessionRes->json()['id'] ?? null;

                if ($uploadId) {
                    // 3. Upload File
                    $uploadRes = \Illuminate\Support\Facades\Http::withToken($tenant->meta_access_token)
                        ->withHeaders(['file_offset' => '0'])
                        ->send('POST', "https://graph.facebook.com/v20.0/{$uploadId}", [
                            'body' => file_get_contents($file->getRealPath())
                        ]);
                    
                    $handle = $uploadRes->json()['h'] ?? null;

                    if ($handle) {
                        $fields['profile_picture_handle'] = $handle;
                    } else {
                        \Log::error('Meta profile picture upload failed', $uploadRes->json());
                    }
                } else {
                    \Log::error('Meta upload session failed', $sessionRes->json());
                }
            } else {
                \Log::error('Failed to retrieve App ID from Meta', $appRes->json());
            }
        }
        
        $url = "https://graph.facebook.com/v20.0/{$tenant->meta_phone_number_id}/whatsapp_business_profile";
        
        $response = \Illuminate\Support\Facades\Http::withToken($tenant->meta_access_token)->post($url, $fields);

        return response()->json($response->json());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
