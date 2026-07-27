<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPhoneToSchools extends Migration
{
    public function up()
    {
        $this->forge->addColumn('schools', [
            'phone' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
                'null'       => true,
                'after'      => 'custom_domain'
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('schools', 'phone');
    }
}
