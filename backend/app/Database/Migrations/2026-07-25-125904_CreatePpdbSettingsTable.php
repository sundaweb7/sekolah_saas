<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePpdbSettingsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'constraint'     => 20,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'school_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'registration_fee' => [
                'type'       => 'DECIMAL',
                'constraint' => '12,2',
                'default'    => 0.00,
            ],
            'is_open' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
            ],
            'start_date' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'end_date' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'payment_instructions' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'required_documents' => [
                'type' => 'JSON',
                'null' => true, // array of strings (e.g. ['akta_kelahiran', 'kartu_keluarga'])
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'RESTRICT', 'CASCADE');
        $this->forge->createTable('ppdb_settings');
    }

    public function down()
    {
        $this->forge->dropTable('ppdb_settings');
    }
}
