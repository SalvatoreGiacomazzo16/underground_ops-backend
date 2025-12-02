<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UsersTestSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@ops.test'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'role_id' => 1
            ]
        );

        User::updateOrCreate(
            ['email' => 'manager@ops.test'],
            [
                'name' => 'Event Manager',
                'password' => bcrypt('password'),
                'role_id' => 2
            ]
        );

        User::updateOrCreate(
            ['email' => 'client@ops.test'],
            [
                'name' => 'Client User',
                'password' => bcrypt('password'),
                'role_id' => 3
            ]
        );
    }
}