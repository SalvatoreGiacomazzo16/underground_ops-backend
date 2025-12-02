<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class LocationFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->unique()->company() . ' Club';

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->city(),
            'province' => strtoupper($this->faker->randomLetter() . $this->faker->randomLetter()),
            'capacity_min' => 100,
            'capacity_max' => $this->faker->numberBetween(300, 2000),
            'latitude' => $this->faker->latitude(40.7, 41.3),
            'longitude' => $this->faker->longitude(14.0, 14.6),
            'contact_name' => $this->faker->name(),
            'contact_phone' => $this->faker->phoneNumber(),
            'is_active' => true,
            'notes' => null
        ];
    }
}