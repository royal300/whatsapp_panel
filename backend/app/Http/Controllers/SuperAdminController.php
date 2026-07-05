<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    public function getTenants(Request $request)
    {
        // Only super_admin allowed
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Return all tenants with their primary owner
        $tenants = Tenant::with(['users' => function($query) {
            $query->select('id', 'tenant_id', 'name', 'email', 'role');
        }])->get();

        return response()->json($tenants);
    }

    public function updateFeatures(Request $request, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'features' => 'required|array'
        ]);

        $tenant = Tenant::findOrFail($id);
        $tenant->features = $request->features;
        $tenant->save();

        return response()->json(['message' => 'Features updated successfully', 'tenant' => $tenant]);
    }

    public function updateValidity(Request $request, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'valid_until' => 'nullable|date'
        ]);

        $tenant = Tenant::findOrFail($id);
        $tenant->valid_until = $request->valid_until ? \Carbon\Carbon::parse($request->valid_until) : null;
        $tenant->save();

        return response()->json(['message' => 'Validity updated successfully', 'tenant' => $tenant]);
    }
}
