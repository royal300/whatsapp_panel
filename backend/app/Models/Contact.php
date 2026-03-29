<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'phone_number',
        'profile_picture',
        'status'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function tags()
    {
        return $this->belongsToMany(ContactTag::class);
    }
}
