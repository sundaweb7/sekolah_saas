<?php
namespace App\Models;
class CommunicationThreadModel extends BaseModel
{
    protected $table = 'communication_threads';
    protected $returnType = 'object';
    protected $allowedFields = ['school_id', 'class_id', 'created_by', 'type', 'subject'];
    protected $useTimestamps = true;
}
