<?php

namespace App\Models;

use CodeIgniter\Model;

class FeatureSettingModel extends Model
{
    protected $table            = 'feature_settings';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = [
        'feature_key',
        'feature_name',
        'level_tk',
        'level_sd',
        'level_smp',
        'level_sma',
        'level_mts_ma',
        'level_smk',
        'level_pesantren',
        'plan_trial',
        'plan_basic',
        'plan_standard',
        'plan_premium'
    ];
}
