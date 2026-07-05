<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AgentController extends Controller
{
    /**
     * List all agents for the current tenant (for assignment - basic info).
     */
    public function publicList()
    {
        $tenantId = Auth::user()->tenant_id;
        $users = User::where('tenant_id', $tenantId)
            ->select('id', 'name', 'email', 'role')
            ->get();
        return response()->json($users);
    }

    /**
     * Admin view: List all users/agents for the current tenant.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        $users = User::where('tenant_id', $tenantId)->get();
        return response()->json($users);
    }

    /**
     * Admin view: Create a new agent.
     */
    public function store(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,agent'
        ]);

        $user = User::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role']
        ]);

        return response()->json($user, 201);
    }

    /**
     * Admin view: Update an agent.
     */
    public function update(Request $request, string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'role' => 'required|string|in:admin,agent'
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role']
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return response()->json($user);
    }

    /**
     * Admin view: Delete an agent.
     */
    public function destroy(string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        // Prevent self-deletion
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'You cannot delete yourself'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
