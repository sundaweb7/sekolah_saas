<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ExpireSubscriptions extends BaseCommand
{
    protected $group = 'Billing';
    protected $name = 'subscriptions:expire';
    protected $description = 'Mark subscriptions past their end date as expired.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();
        $db->table('subscriptions')
            ->where('status', 'active')
            ->where('end_date <', date('Y-m-d'))
            ->update(['status' => 'expired', 'updated_at' => date('Y-m-d H:i:s')]);

        CLI::write('Expired subscriptions: ' . $db->affectedRows(), 'green');
    }
}
