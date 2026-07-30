<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AlterSchoolContentsType extends Migration
{
    public function up()
    {
        // Modify the ENUM to include 'page'
        $this->forge->modifyColumn('school_contents', [
            'type' => ['type' => 'ENUM', 'constraint' => ['news', 'announcement', 'event', 'gallery', 'page']],
        ]);
    }

    public function down()
    {
        // Revert to original ENUM
        $this->forge->modifyColumn('school_contents', [
            'type' => ['type' => 'ENUM', 'constraint' => ['news', 'announcement', 'event', 'gallery']],
        ]);
    }
}
