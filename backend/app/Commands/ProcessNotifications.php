<?php

namespace App\Commands;

use App\Services\NotificationDispatcher;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ProcessNotifications extends BaseCommand
{
    protected $group = 'Koola';
    protected $name = 'notifications:process';
    protected $description = 'Mengirim antrean notifikasi email dan WhatsApp yang sudah jatuh tempo.';

    public function run(array $params)
    {
        $limit = isset($params[0]) ? (int) $params[0] : 100;
        $result = (new NotificationDispatcher())->dispatchPending($limit);
        CLI::write(sprintf('Processed %d; email %d; WhatsApp %d; failed %d.', $result['processed'], $result['email_sent'], $result['whatsapp_sent'], $result['failed']), 'green');
    }
}
