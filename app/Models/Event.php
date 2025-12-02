<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'event_type',
        'start_datetime',
        'end_datetime',
        'location_id',
        'status',
        'visibility',
        'max_capacity',
        'min_age',
        'base_ticket_price',
        'created_by',
        'updated_by',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function staffAssignments()
    {
        return $this->hasMany(EventStaff::class);
    }

    public function staff()
    {
        return $this->belongsToMany(StaffProfile::class, 'event_staff');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Mutators
    |--------------------------------------------------------------------------
    */

    protected static function booted()
    {
        static::creating(function ($event) {
            if (!$event->slug) {
                $event->slug = Str::slug($event->title);
            }
        });
    }
    protected $casts = [
    'start_datetime' => 'datetime',
    'end_datetime' => 'datetime',
];

}
