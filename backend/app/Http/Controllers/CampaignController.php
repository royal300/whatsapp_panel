<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Campaign;
use App\Jobs\ProcessCampaignJob;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CampaignController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        return response()->json(Campaign::where('tenant_id', $tenantId)->with(['template', 'logs'])->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        if (is_string($request->audience)) {
            $request->merge(['audience' => json_decode($request->audience, true)]);
        }

        $tenantId = Auth::user()->tenant_id;
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                \Illuminate\Validation\Rule::unique('campaigns')->where(function ($query) use ($tenantId) {
                    return $query->where('tenant_id', $tenantId);
                })
            ],
            'template_id' => 'required|integer|exists:templates,id',
            'audience' => 'required|array',
            'scheduled_at' => 'nullable|date',
            'file' => 'nullable|file|max:20480' // max 20MB
        ]);

        $mediaUrl = null;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('campaign_media', 'public');
            $mediaUrl = asset('storage/' . $path);
        }

        $isScheduled = !empty($validated['scheduled_at']);

        $campaign = Campaign::create([
            'tenant_id' => Auth::user()->tenant_id,
            'name' => $validated['name'],
            'template_id' => $validated['template_id'],
            'audience' => $validated['audience'],
            'audience_count' => count($validated['audience']),
            'status' => $isScheduled ? 'scheduled' : 'draft',
            'scheduled_at' => $isScheduled ? \Illuminate\Support\Carbon::parse($validated['scheduled_at']) : null,
            'media_url' => $mediaUrl,
        ]);

        // Dispatch job
        if ($campaign->scheduled_at) {
            ProcessCampaignJob::dispatch($campaign)->delay($campaign->scheduled_at);
        } else {
            ProcessCampaignJob::dispatch($campaign);
        }

        return response()->json($campaign, 201);
    }

    /**
     * Fetch live analytics from Meta for a campaign's template.
     * Returns actual sent/delivered/read/clicked data per day.
     */
    public function analytics(Campaign $campaign)
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        if (!$tenant || !$tenant->meta_access_token) {
            return response()->json(['error' => 'Meta credentials not configured'], 400);
        }

        $campaign->load('logs', 'template');
        $template = $campaign->template;

        if (!$template) {
            return response()->json(['error' => 'Campaign has no associated template'], 404);
        }

        if (empty($template->whatsapp_template_id)) {
            return response()->json([
                'error'          => 'Template has no Meta ID. Please re-sync your templates.',
                'campaign'       => $campaign,
                'meta_analytics' => null,
                'local_logs'     => $campaign->logs,
            ], 200);
        }

        try {
            $whatsapp = new WhatsAppService($tenant);

            // Use a wide date range to ensure all data is captured
            $startDate = $campaign->created_at->subDay()->format('Y-m-d');
            $endDate   = now()->addDay()->format('Y-m-d');

            $metaData = $whatsapp->getTemplateAnalytics(
                $template->whatsapp_template_id,
                $startDate,
                $endDate
            );

            return response()->json([
                'campaign'        => $campaign,
                'meta_analytics'  => $metaData,
                'local_logs'      => $campaign->logs,
            ]);

        } catch (\Exception $e) {
            Log::error('Campaign analytics failed: ' . $e->getMessage());
            return response()->json([
                'error'           => 'Failed to fetch Meta analytics: ' . $e->getMessage(),
                'campaign'        => $campaign,
                'meta_analytics'  => null,
                'local_logs'      => $campaign->logs,
            ], 200);
        }
    }


    public function show(string $id) { /*...*/ }
    public function update(Request $request, string $id) { /*...*/ }
    public function destroy(string $id) { /*...*/ }
}
