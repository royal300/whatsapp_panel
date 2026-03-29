<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactTag extends Model
{
    protected $fillable = ['tenant_id', 'name'];

    public function contacts()
    {
        return $this->belongsToMany(Contact::class);
    }
}
