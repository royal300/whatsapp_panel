<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $fillable = [
        'tenant_id',
        'contact_id',
        'user_id',
        'status'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
