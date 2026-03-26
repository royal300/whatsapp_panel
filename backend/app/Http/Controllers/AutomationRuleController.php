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
        return response()->json(AutomationRule::where('tenant_id', $tenantId)->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'trigger_keyword' => 'required|string',
            'action_type' => 'required|string',
            'template_id' => 'nullable|exists:templates,id'
        ]);

        $rule = AutomationRule::create([
            'tenant_id' => Auth::user()->tenant_id,
            'name' => $request->name,
            'trigger_keyword' => $request->trigger_keyword,
            'action_type' => $request->action_type,
            'template_id' => $request->template_id,
            'is_active' => true
        ]);

        return response()->json($rule, 201);
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
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
