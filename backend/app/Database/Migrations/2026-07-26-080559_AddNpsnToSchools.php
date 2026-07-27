<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddNpsnToSchools extends Migration
{
    public function up()
    {
        $this->forge->addColumn('schools', [
            'npsn' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
                'null'       => true,
                'after'      => 'name'
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('schools', 'npsn');
    }
}
