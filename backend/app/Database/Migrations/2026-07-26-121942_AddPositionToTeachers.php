<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPositionToTeachers extends Migration
{
    public function up()
    {
        $this->forge->addColumn('teachers', [
            'position' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
                'default'    => null,
                'after'      => 'full_name',
                'comment'    => 'Jabatan/bidang studi guru, contoh: Wali Kelas A, Guru Matematika',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('teachers', 'position');
    }
}
