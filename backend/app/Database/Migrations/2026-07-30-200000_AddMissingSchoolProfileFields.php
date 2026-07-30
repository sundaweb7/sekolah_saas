<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddMissingSchoolProfileFields extends Migration
{
    public function up()
    {
        $fields = [
            'hero_tagline' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'ppdb_banner_text' => ['type' => 'TEXT', 'null' => true],
        ];
        foreach ($fields as $name => $definition) {
            if (!$this->db->fieldExists($name, 'school_profiles')) {
                $this->forge->addColumn('school_profiles', [$name => $definition]);
            }
        }
    }

    public function down()
    {
        // Non-destructive reconciliation migration.
    }
}
