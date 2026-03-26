<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Config;

class PusherService
{
    /**
     * Switch the Pusher configuration to the tenant's credentials.
     */
    public static function useTenantConfig(Tenant $tenant)
    {
        if (!$tenant->pusher_app_key || !$tenant->pusher_app_id) {
            return false;
        }

        // 1. Update Config at Runtime
        Config::set('broadcasting.connections.pusher.key', $tenant->pusher_app_key);
        Config::set('broadcasting.connections.pusher.secret', $tenant->pusher_app_secret);
        Config::set('broadcasting.connections.pusher.app_id', $tenant->pusher_app_id);
        Config::set('broadcasting.connections.pusher.options.cluster', $tenant->pusher_app_cluster);

        // 2. Clear current broadcaster instance to force re-initialization
        Broadcast::purge('pusher');
        
        return true;
    }
}
