<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Location;
use App\Models\User;
use Illuminate\Support\Str;

class EventFactory extends Factory
{
    public function definition(): array
    {
        $title = $this->faker->sentence(3);

        return [
            'title' => $title,
            'slug' => Str::slug($title . '-' . $this->faker->unique()->numberBetween(1, 9999)),
            'description' => $this->faker->paragraph(),
            'event_type' => $this->faker->randomElement(['live', 'djset', 'party', 'festival']),
            'start_datetime' => $this->faker->dateTimeBetween('+1 days', '+2 months'),
            'end_datetime' => null,
            'location_id' => Location::inRandomOrder()->first()->id,
            'status' => 'published',
            'visibility' => 'public',
            'max_capacity' => $this->faker->numberBetween(200, 2000),
            'min_age' => $this->faker->randomElement([16, 18]),
            'base_ticket_price' => $this->faker->randomFloat(2, 5, 50),
            'created_by' => User::where('role_id', 1)->inRandomOrder()->first()->id,
            'updated_by' => null
        ];
    }
}