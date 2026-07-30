<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddRolesToTeachersTable extends Migration
{
    public function up()
    {
        if ($this->db->fieldExists('roles', 'teachers')) {
            return;
        }
        $fields = [
            'roles' => [
                'type'       => 'TEXT',
                'null'       => true,
                'after'      => 'position',
                'comment'    => 'JSON array of teacher roles: guru_kelas, guru_mapel, wali_kelas',
            ],
        ];
        $this->forge->addColumn('teachers', $fields);
    }

    public function down()
    {
        // Non-destructive reconciliation migration.
    }
}
