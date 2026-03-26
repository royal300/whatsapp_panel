<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'domain',
        'meta_waba_id',
        'meta_phone_number_id',
        'meta_access_token',
        'meta_app_id',
        'meta_app_secret',
        'pusher_app_id',
        'pusher_app_key',
        'pusher_app_secret',
        'pusher_app_cluster'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
