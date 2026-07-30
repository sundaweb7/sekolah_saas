<?php
namespace App\Models;
class SchoolEventModel extends BaseModel
{
    protected $table = 'school_events';
    protected $returnType = 'object';
    protected $useSoftDeletes = true;
    protected $allowedFields = ['school_id', 'class_id', 'created_by', 'title', 'description', 'location', 'audience', 'starts_at', 'ends_at', 'reminder_minutes', 'reminder_sent_at'];
    protected $useTimestamps = true;
    protected $deletedField = 'deleted_at';
}
