<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;

class LocationsSeeder extends Seeder
{
    public function run(): void
    {
        // Crea 10 locations fittizie
        Location::factory()->count(10)->create();
    }
}