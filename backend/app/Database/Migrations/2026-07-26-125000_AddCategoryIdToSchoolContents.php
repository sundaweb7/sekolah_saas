<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCategoryIdToSchoolContents extends Migration
{
    public function up()
    {
        $this->forge->addColumn('school_contents', [
            'category_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'school_id',
            ],
        ]);
        // Add foreign key constraint safely without dropping table
        if ($this->db->DBDriver !== 'SQLite3') {
            $this->db->query("ALTER TABLE school_contents ADD CONSTRAINT fk_school_contents_category_id FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL ON UPDATE CASCADE");
        }
    }

    public function down()
    {
        if ($this->db->DBDriver !== 'SQLite3') {
            $this->db->query("ALTER TABLE school_contents DROP FOREIGN KEY fk_school_contents_category_id");
        }
        $this->forge->dropColumn('school_contents', 'category_id');
    }
}
