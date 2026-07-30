<?php

namespace App\Commands;

use App\Services\CommunicationAccessService;
use App\Services\NotificationService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class QueueEventReminders extends BaseCommand
{
    protected $group = 'Koola';
    protected $name = 'events:remind';
    protected $description = 'Membuat notifikasi pengingat untuk kegiatan sekolah yang akan datang.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();
        $events = $db->table('school_events')->where('reminder_sent_at', null)->where('deleted_at', null)
            ->where('starts_at >', date('Y-m-d H:i:s'))->where('starts_at <=', date('Y-m-d H:i:s', strtotime('+8 days')))
            ->orderBy('starts_at', 'ASC')->limit(1000)->get()->getResult();
        $queued = 0;
        $access = new CommunicationAccessService();
        $notification = new NotificationService();
        foreach ($events as $event) {
            $dueAt = strtotime($event->starts_at) - ((int) $event->reminder_minutes * 60);
            if ($dueAt > time()) continue;
            $recipients = $access->audienceUserIds((int) $event->school_id, $event->audience, $event->class_id ? (int) $event->class_id : null);
            $notification->queue((int) $event->school_id, $recipients, 'event_reminder', 'Pengingat kegiatan: ' . $event->title,
                'Dimulai ' . date('d-m-Y H:i', strtotime($event->starts_at)) . ($event->location ? ' di ' . $event->location : ''),
                ['event_id' => (int) $event->id, 'url' => '/communication']);
            $db->table('school_events')->where('id', $event->id)->update(['reminder_sent_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')]);
            $queued += count($recipients);
        }
        CLI::write("Queued {$queued} event reminders.", 'green');
    }
}
