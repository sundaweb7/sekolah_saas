<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class HashExistingPasswordResetTokens extends Migration
{
    public function up()
    {
        foreach ($this->db->table('password_resets')->get()->getResult() as $row) {
            if (strlen((string) $row->token) !== 64 || !ctype_xdigit((string) $row->token)) {
                $this->db->table('password_resets')->where('id', $row->id)->update([
                    'token' => hash('sha256', (string) $row->token),
                ]);
            }
        }
    }

    public function down()
    {
    }
}
