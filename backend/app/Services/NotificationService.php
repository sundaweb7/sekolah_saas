<?php

namespace App\Services;

use App\Models\NotificationModel;

class NotificationService
{
    public function queue(int $schoolId, array $userIds, string $type, string $title, string $body, array $data = [], ?string $deliverAfter = null): void
    {
        $model = new NotificationModel();
        foreach (array_values(array_unique(array_map('intval', $userIds))) as $userId) {
            if (!$userId) continue;
            $model->insert([
                'school_id' => $schoolId, 'user_id' => $userId, 'type' => $type,
                'title' => mb_substr(trim($title), 0, 180), 'body' => trim($body),
                'data_json' => $data ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
                'deliver_after' => $deliverAfter ?: date('Y-m-d H:i:s'),
            ]);
        }
    }
}
