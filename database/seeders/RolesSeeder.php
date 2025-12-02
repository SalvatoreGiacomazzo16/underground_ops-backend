<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['id' => 1, 'name' => 'Admin',    'slug' => 'admin'],
            ['id' => 2, 'name' => 'Manager',  'slug' => 'manager'],
            ['id' => 3, 'name' => 'Client',   'slug' => 'client'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['id' => $role['id']], $role);
        }
    }
}