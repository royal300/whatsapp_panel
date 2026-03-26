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
            'pusher_app_id',
            'pusher_app_key',
            'pusher_app_secret',
            'pusher_app_cluster'
        ]);

        // Filter out nulls to prevent accidental overwrites if fields were missing
        $data = array_filter($data, fn($v) => !is_null($v));

        $tenant->update($data);

        \Log::info('Tenant settings updated', ['tenant_id' => $tenant->id, 'updated_fields' => array_keys($data)]);

        return response()->json(['message' => 'Settings updated successfully', 'data' => $tenant]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
