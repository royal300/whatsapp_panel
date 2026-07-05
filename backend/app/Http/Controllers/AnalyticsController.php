<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Campaign;
use App\Models\CampaignLog;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        // 1. Calculate overall stats for the tenant
        // We'll look at the last 30 days
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        $campaigns = Campaign::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->get();
            
        $campaignIds = $campaigns->pluck('id');

        $totalSent = CampaignLog::whereIn('campaign_id', $campaignIds)->count();
        $totalDelivered = CampaignLog::whereIn('campaign_id', $campaignIds)->where('status', 'delivered')->count();
        $totalRead = CampaignLog::whereIn('campaign_id', $campaignIds)->where('status', 'read')->count();
        $totalFailed = CampaignLog::whereIn('campaign_id', $campaignIds)->where('status', 'failed')->count();

        // If a message is read, it was also delivered, so we count read as delivered as well for accuracy if needed.
        // Assuming logs update their status to the highest state (read > delivered > sent).
        $actualDelivered = $totalDelivered + $totalRead;

        $deliveryRate = $totalSent > 0 ? round(($actualDelivered / $totalSent) * 100, 1) : 0;
        $readRate = $totalSent > 0 ? round(($totalRead / $totalSent) * 100, 1) : 0;
        $engagementRate = $actualDelivered > 0 ? round(($totalRead / $actualDelivered) * 100, 1) : 0;
        $failureRate = $totalSent > 0 ? round(($totalFailed / $totalSent) * 100, 1) : 0;

        // 2. Chart Data (Message Delivery Rates over 4 weeks)
        $chartData = [];
        for ($i = 4; $i >= 1; $i--) {
            $startOfWeek = Carbon::now()->subWeeks($i);
            $endOfWeek = Carbon::now()->subWeeks($i - 1);
            
            $weekSent = CampaignLog::whereIn('campaign_id', $campaignIds)
                ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
                ->count();
                
            $weekDelivered = CampaignLog::whereIn('campaign_id', $campaignIds)
                ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
                ->whereIn('status', ['delivered', 'read'])
                ->count();

            $chartData[] = [
                'name' => "WEEK " . (5 - $i),
                'sent' => $weekSent,
                'delivered' => $weekDelivered
            ];
        }

        // 3. Meta API Usage Limit
        $tenant = $request->user()->tenant;
        $messagingLimit = 1000; // default fallback
        $messagesUsed = 0;

        if ($tenant && $tenant->meta_access_token) {
            try {
                $waService = new WhatsAppService($tenant);
                $messagingLimit = $waService->getMessagingLimit();
            } catch (\Exception $e) {
                \Log::error("Failed to init WA Service for analytics: " . $e->getMessage());
            }
        }

        // Messages used in the current rolling month
        $startOfMonth = Carbon::now()->startOfMonth();
        $messagesUsed = CampaignLog::whereHas('campaign', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->where('created_at', '>=', $startOfMonth)->count();

        // If limit is 'Unlimited', we'll handle it on frontend, but send as string
        return response()->json([
            'stats' => [
                'totalSent' => $totalSent,
                'totalDelivered' => $actualDelivered,
                'totalRead' => $totalRead,
                'totalFailed' => $totalFailed,
                'deliveryRate' => $deliveryRate,
                'readRate' => $readRate,
                'engagementRate' => $engagementRate,
                'failureRate' => $failureRate
            ],
            'chartData' => $chartData,
            'usage' => [
                'limit' => $messagingLimit,
                'used' => $messagesUsed,
                'plan' => 'Premium' // Stubbed for now, can be dynamic based on SaaS logic
            ]
        ]);
    }
}
