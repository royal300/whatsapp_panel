<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = [
        'tenant_id',
        'whatsapp_template_id',
        'name',
        'language',
        'category',
        'status',
        'content'
    ];

    protected $casts = [
        'content' => 'array'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
