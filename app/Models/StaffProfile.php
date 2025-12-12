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
        'role',       // 🆕 NUOVO CAMPO
        'phone',
        'bio',
        'skills',
        'is_active',
        'notes'
    ];

    protected $casts = [
        'skills'    => 'array',
        'is_active' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    // Lasciamo user() nel caso serva in futuro.
    // Ma l'interfaccia non lo usa più per la creazione staff.
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_staff')
            ->withPivot('role_in_event', 'fee', 'checkin_time', 'checkout_time', 'notes')
            ->withTimestamps();
    }

    public function eventAssignments()
    {
        return $this->hasMany(EventStaff::class);
    }
}
