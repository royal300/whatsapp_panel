<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\Subscription;
use Exception;

class BillingService
{
    /**
     * Check if a tenant has remaining credits.
     */
    public function canSend(Tenant $tenant): bool
    {
        $subscription = $tenant->subscriptions()->where('status', 'active')->first();

        if (!$subscription) {
            return false;
        }

        // Check if plan has a limit and if it's exceeded
        return $subscription->credits_used < $subscription->plan->message_limit;
    }

    /**
     * Increment the credit usage for a tenant.
     */
    public function incrementUsage(Tenant $tenant)
    {
        $subscription = $tenant->subscriptions()->where('status', 'active')->first();

        if ($subscription) {
            $subscription->increment('credits_used');
        }
    }

    /**
     * Get usage statistics for a tenant.
     */
    public function getUsageStats(Tenant $tenant): array
    {
        $subscription = $tenant->subscriptions()->with('plan')->where('status', 'active')->first();

        if (!$subscription) {
            return [
                'plan_name' => 'No Active Plan',
                'credits_used' => 0,
                'limit' => 0,
                'percentage' => 0
            ];
        }

        $limit = $subscription->plan->message_limit;
        $used = $subscription->credits_used;

        return [
            'plan_name' => $subscription->plan->name,
            'credits_used' => $used,
            'limit' => $limit,
            'percentage' => $limit > 0 ? round(($used / $limit) * 100, 2) : 100
        ];
    }
}
