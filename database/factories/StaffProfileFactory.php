<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

class StaffProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => null,
            'stage_name' => $this->faker->unique()->name(),
            'phone' => $this->faker->phoneNumber(),
            'bio' => $this->faker->sentence(),
            'skills' => ['dj', 'fonico', 'security'],
            'is_external' => $this->faker->boolean(60),
            'is_active' => true,
            'notes' => null,
        ];
    }
}