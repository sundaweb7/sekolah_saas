<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddBasicPlanToFeatures extends Migration
{
    public function up()
    {
        $this->forge->addColumn('feature_settings', [
            'plan_basic' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
                'null'       => false,
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('feature_settings', 'plan_basic');
    }
}
