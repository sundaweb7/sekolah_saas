<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPesantrenLevel extends Migration
{
    public function up()
    {
        // 1. Modify schools table level column
        $db = \Config\Database::connect();
        $db->query("ALTER TABLE schools MODIFY COLUMN level ENUM('TK', 'SD', 'SMP', 'SMA', 'MTS_MA', 'SMK', 'PESANTREN') NOT NULL DEFAULT 'TK'");

        // 2. Add level_pesantren to feature_settings table
        $this->forge->addColumn('feature_settings', [
            'level_pesantren' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
                'null'       => false,
            ]
        ]);
    }

    public function down()
    {
        // Remove level_pesantren column
        $this->forge->dropColumn('feature_settings', 'level_pesantren');

        // Revert level column on schools
        $db = \Config\Database::connect();
        $db->query("ALTER TABLE schools MODIFY COLUMN level ENUM('TK', 'SD', 'SMP', 'SMA', 'MTS_MA', 'SMK') NOT NULL DEFAULT 'TK'");
    }
}
