<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use App\Models\UserModel;

class SuperAdminSeeder extends Seeder
{
    public function run()
    {
        $userModel = new UserModel();

        // Check if superadmin already exists
        $exists = $userModel->where('role', 'superadmin')->first();

        if (!$exists) {
            $userModel->insert([
                'school_id'     => null,
                'email'         => 'superadmin@paudku.id',
                'password_hash' => 'superadmin123', // auto-hashed by model hook hashPassword
                'role'          => 'superadmin',
                'full_name'     => 'Super Admin Pusat',
                'status'        => 'active'
            ]);
            echo "SuperAdmin created successfully: superadmin@paudku.id / superadmin123\n";
        } else {
            echo "SuperAdmin already exists.\n";
        }
    }
}
