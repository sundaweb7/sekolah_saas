<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSchoolProfilesTable extends Migration
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
            'hero_tagline' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'history' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'vision' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'mission' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'principal_name' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
                'null'       => true,
            ],
            'principal_photo' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
            'principal_welcome_message' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'ppdb_banner_text' => ['type' => 'TEXT', 'null' => true],
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
        $this->forge->createTable('school_profiles');
    }

    public function down()
    {
        $this->forge->dropTable('school_profiles');
    }
}
