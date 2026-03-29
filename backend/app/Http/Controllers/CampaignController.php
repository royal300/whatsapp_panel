<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Campaign;
use App\Jobs\ProcessCampaignJob;
use Illuminate\Support\Facades\Auth;

class CampaignController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        return response()->json(Campaign::where('tenant_id', $tenantId)->with(['template', 'logs'])->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'template_id' => 'required|integer|exists:templates,id',
            'audience' => 'required|array',
            'scheduled_at' => 'nullable|date'
        ]);

        $campaign = Campaign::create([
            'tenant_id' => Auth::user()->tenant_id,
            'name' => $validated['name'],
            'template_id' => $validated['template_id'],
            'audience' => $validated['audience'],
            'audience_count' => count($validated['audience']),
            'status' => 'draft',
            'scheduled_at' => $validated['scheduled_at'] ?? null,
        ]);

        // Dispatch job
        if ($campaign->scheduled_at) {
            ProcessCampaignJob::dispatch($campaign)->delay($campaign->scheduled_at);
        } else {
            ProcessCampaignJob::dispatch($campaign);
        }

        return response()->json($campaign, 201);
    }

    public function retry(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'numbers' => 'required|array',
            'numbers.*' => 'required|string'
        ]);

        ProcessCampaignJob::dispatch($campaign, $validated['numbers']);

        return response()->json(['message' => 'Retry job dispatched successfully']);
    }

    public function show(string $id) { /*...*/ }
    public function update(Request $request, string $id) { /*...*/ }
    public function destroy(string $id) { /*...*/ }
}
