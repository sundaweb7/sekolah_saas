<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCustomDomainToSchools extends Migration
{
    public function up()
    {
        $fields = [
            'custom_domain_status' => [
                'type'       => 'ENUM',
                'constraint' => ['pending', 'processing', 'active', 'rejected'],
                'null'       => true,
                'after'      => 'custom_domain',
            ],
        ];
        $this->forge->addColumn('schools', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('schools', 'custom_domain_status');
    }
}
