<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function createdEvents()
    {
        return $this->hasMany(\App\Models\Event::class, 'created_by');
    }

    public function updatedEvents()
    {
        return $this->hasMany(\App\Models\Event::class, 'updated_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Default behaviour (backend register = admin)
    |--------------------------------------------------------------------------
    */
    protected static function booted()
    {
        static::creating(function ($user) {
            if (!$user->role_id) {
                $user->role_id = 1; // Admin di default nel backend
            }
        });
    }

public function createdLocations()
{
    return $this->hasMany(\App\Models\Location::class, 'created_by');
}


    public function staffProfiles()
{
    return $this->hasMany(StaffProfile::class, 'user_id');
}
}