<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'stage_name',
        'phone',
        'bio',
        'skills',
        'is_external',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'skills' => 'array',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_staff');
    }

    public function eventAssignments()
    {
        return $this->hasMany(EventStaff::class);
    }
}