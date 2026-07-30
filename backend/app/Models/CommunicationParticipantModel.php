<?php
namespace App\Models;
class CommunicationParticipantModel extends BaseModel
{
    protected $table = 'communication_participants';
    protected $returnType = 'object';
    protected $allowedFields = ['school_id', 'thread_id', 'user_id', 'last_read_at', 'created_at'];
}
