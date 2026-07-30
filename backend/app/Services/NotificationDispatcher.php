<?php

namespace App\Services;

use App\Libraries\FonnteService;
use Config\Services;

class NotificationDispatcher
{
    public function dispatchPending(int $limit = 100): array
    {
        $db = \Config\Database::connect();
        $items = $db->table('notifications n')
            ->select('n.*, u.email, u.phone, u.full_name')
            ->join('users u', 'u.id = n.user_id')
            ->where('n.deliver_after <=', date('Y-m-d H:i:s'))
            ->groupStart()->whereIn('n.email_status', ['pending', 'failed'])->orWhereIn('n.whatsapp_status', ['pending', 'failed'])->groupEnd()
            ->orderBy('n.id', 'ASC')
            ->limit(min(500, max(1, $limit)))
            ->get()->getResult();

        $result = ['processed' => 0, 'email_sent' => 0, 'whatsapp_sent' => 0, 'failed' => 0];

        foreach ($items as $item) {
            $changes = [];

            // --- Email ---
            if (in_array($item->email_status, ['pending', 'failed'], true) && (int) $item->email_attempts < 3) {
                $changes['email_attempts'] = (int) $item->email_attempts + 1;
                if (!$item->email || !filter_var($item->email, FILTER_VALIDATE_EMAIL) || !env('email.fromEmail')) {
                    $changes['email_status'] = 'skipped';
                } else {
                    try {
                        $email = Services::email();
                        $email->setFrom((string) env('email.fromEmail'), (string) env('email.fromName', 'Koola'));
                        $email->setTo($item->email)->setSubject($item->title)->setMessage($item->body);
                        $sent = $email->send(false);
                        $email->clear(true);
                        $changes['email_status'] = $sent ? 'sent' : 'failed';
                        $sent ? $result['email_sent']++ : $result['failed']++;
                    } catch (\Throwable $e) {
                        $changes['email_status'] = 'failed';
                        $result['failed']++;
                        log_message('error', 'Notification email delivery failed for notification {id}', ['id' => $item->id]);
                    }
                }
            }

            // --- WhatsApp via per-tenant Fonnte ---
            if (in_array($item->whatsapp_status, ['pending', 'failed'], true) && (int) $item->whatsapp_attempts < 3) {
                $changes['whatsapp_attempts'] = (int) $item->whatsapp_attempts + 1;
                if (!$item->phone) {
                    $changes['whatsapp_status'] = 'skipped';
                } else {
                    // Use school-specific Fonnte token if notification has school_id
                    $fonnte = $item->school_id
                        ? FonnteService::forSchool((int) $item->school_id)
                        : new FonnteService();

                    $response = $fonnte->sendMessage($item->phone, "*{$item->title}*\n\n{$item->body}");
                    $changes['whatsapp_status'] = ($response['status'] ?? false) ? 'sent' : 'failed';
                    ($response['status'] ?? false) ? $result['whatsapp_sent']++ : $result['failed']++;
                }
            }

            if ($changes) {
                $changes['updated_at'] = date('Y-m-d H:i:s');
                $db->table('notifications')->where('id', $item->id)->update($changes);
                $result['processed']++;
            }
        }

        return $result;
    }
}
