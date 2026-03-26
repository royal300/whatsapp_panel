<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'template_id',
        'audience',
        'status',
        'error_message',
        'audience_count',
        'scheduled_at'
    ];

    protected $casts = [
        'audience' => 'array',
        'scheduled_at' => 'datetime'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    public function logs()
    {
        return $this->hasMany(CampaignLog::class);
    }
}
