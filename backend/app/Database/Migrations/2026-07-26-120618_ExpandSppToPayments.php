<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ExpandSppToPayments extends Migration
{
    public function up()
    {
        $this->forge->addColumn('spp_invoices', [
            'payment_type' => [
                'type'       => 'ENUM',
                'constraint' => ['monthly', 'annual', 'one_time'],
                'default'    => 'monthly',
                'null'       => false,
            ],
            'description' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('spp_invoices', ['payment_type', 'description']);
    }
}
