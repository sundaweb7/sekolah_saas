<?php
namespace App\Models;
class CommunicationMessageModel extends BaseModel
{
    protected $table = 'communication_messages';
    protected $returnType = 'object';
    protected $allowedFields = ['school_id', 'thread_id', 'sender_user_id', 'body', 'created_at'];
}
