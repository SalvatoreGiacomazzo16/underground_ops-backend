<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventStaff extends Model
{
    use HasFactory;

    protected $table = 'event_staff';

    protected $fillable = [
        'event_id',
        'staff_profile_id',
        'role_in_event',
        'fee',
        'checkin_time',
        'checkout_time',
        'notes',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function staffProfile()
    {
        return $this->belongsTo(StaffProfile::class);
    }
}