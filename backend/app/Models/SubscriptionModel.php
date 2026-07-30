<?php

namespace App\Models;

class SubscriptionModel extends BaseModel
{
    protected $table            = 'subscriptions';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'plan_name', 'billing_cycle', 'start_date', 'end_date', 'status'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
