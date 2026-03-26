<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutomationRule extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'trigger_type',
        'trigger_keyword',
        'action_type',
        'template_id',
        'is_active'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }
}
