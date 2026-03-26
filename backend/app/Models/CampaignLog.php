<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CampaignLog extends Model
{
    protected $fillable = [
        'campaign_id',
        'contact_id',
        'number',
        'message_id',
        'status',
        'error_message'
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}
