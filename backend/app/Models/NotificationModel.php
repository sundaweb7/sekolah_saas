<?php
namespace App\Models;
class NotificationModel extends BaseModel
{
    protected $table = 'notifications';
    protected $returnType = 'object';
    protected $allowedFields = ['school_id', 'user_id', 'type', 'title', 'body', 'data_json', 'deliver_after', 'email_status', 'whatsapp_status', 'email_attempts', 'whatsapp_attempts', 'read_at'];
    protected $useTimestamps = true;
}
