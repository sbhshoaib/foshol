<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CropPhase extends Model
{
    protected $fillable = [
        'crop_id',
        'name',
        'sequence',
        'days_count',
        'start_date',
        'end_date',
        'is_active',
    ];

    public function crop()
    {
        return $this->belongsTo(Crop::class);
    }
}
