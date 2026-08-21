<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'user_id',
        'crop_id',
        'crop_phase_id',
        'title',
        'date',
        'is_completed',
        'type',
        'is_schedule',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function crop()
    {
        return $this->belongsTo(Crop::class);
    }
}
