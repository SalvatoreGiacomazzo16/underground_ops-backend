<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'address',
        'city',
        'province',
        'capacity_min',
        'capacity_max',
        'latitude',
        'longitude',
        'contact_name',
        'contact_phone',
        'is_active',
        'notes',
        'created_by'
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Mutators
    |--------------------------------------------------------------------------
    */

    protected static function booted()
    {
        static::creating(function ($location) {
            if (!$location->slug) {
                $location->slug = Str::slug($location->name);
            }
        });
    }
    public function creator()
{
    return $this->belongsTo(User::class, 'created_by');
}
}