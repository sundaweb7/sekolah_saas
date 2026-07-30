<?php
namespace App\Models;
class StudentRequestModel extends BaseModel
{
    protected $table = 'student_requests';
    protected $returnType = 'object';
    protected $allowedFields = ['school_id', 'student_id', 'requested_by', 'handled_by', 'type', 'request_date', 'reason', 'pickup_name', 'pickup_relationship', 'pickup_phone', 'status', 'admin_note', 'handled_at'];
    protected $useTimestamps = true;
}
