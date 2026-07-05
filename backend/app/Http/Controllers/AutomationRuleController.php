<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\AutomationRule;
use Illuminate\Support\Facades\Auth;

class AutomationRuleController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        return response()->json(AutomationRule::with('template')->where('tenant_id', $tenantId)->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'trigger_keyword' => 'required|string',
            'trigger_type' => 'nullable|string',
            'action_type' => 'required|string',
            'template_id' => 'nullable|exists:templates,id'
        ]);

        $rule = AutomationRule::create([
            'tenant_id' => Auth::user()->tenant_id,
            'name' => $request->name,
            'trigger_keyword' => $request->trigger_keyword,
            'trigger_type' => $request->trigger_type ?? 'keyword',
            'action_type' => $request->action_type,
            'template_id' => $request->template_id,
            'is_active' => true
        ]);

        return response()->json($rule->load('template'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $rule = AutomationRule::with('template')->where('tenant_id', $tenantId)->findOrFail($id);
        return response()->json($rule);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $rule = AutomationRule::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string',
            'trigger_keyword' => 'nullable|string',
            'trigger_type' => 'nullable|string',
            'action_type' => 'nullable|string',
            'template_id' => 'nullable|exists:templates,id',
            'is_active' => 'nullable|boolean'
        ]);

        $rule->update($validated);

        return response()->json($rule->load('template'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $rule = AutomationRule::where('tenant_id', $tenantId)->findOrFail($id);
        $rule->delete();

        return response()->json(['message' => 'Rule deleted successfully']);
    }
}
