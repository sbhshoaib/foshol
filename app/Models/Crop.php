<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Crop extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'type',
        'start_date',
        'color_shade',
        'emoji',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function phases()
    {
        return $this->hasMany(CropPhase::class)->orderBy('sequence');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class)->orderBy('date');
    }
}
