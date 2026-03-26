<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'chat_id',
        'sender_type',
        'user_id',
        'message_body',
        'meta_message_id',
        'status'
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }
}
