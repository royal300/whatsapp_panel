<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('tenant.{tenant_id}', function ($user, $tenant_id) {
    return (int) $user->tenant_id === (int) $tenant_id;
});
