<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPlansToFeatures extends Migration
{
    public function up()
    {
        $this->forge->addColumn('feature_settings', [
            'plan_trial' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
                'null'       => false,
            ],
            'plan_standard' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
                'null'       => false,
            ],
            'plan_premium' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
                'null'       => false,
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('feature_settings', ['plan_trial', 'plan_standard', 'plan_premium']);
    }
}
