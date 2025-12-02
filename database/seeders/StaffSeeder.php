<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StaffProfile;

class StaffSeeder extends Seeder
{
    public function run(): void
    {
        StaffProfile::factory()->count(15)->create();
    }
}