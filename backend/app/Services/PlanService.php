<?php

namespace App\Services;

use App\Models\SubscriptionModel;
use App\Models\SchoolModel;

class PlanService
{
    public const CATALOG = [
        'basic' => ['students' => 9999, 'storage' => '1 GB', 'monthly' => 25000, 'yearly' => 300000],
        'standard' => ['students' => 100, 'storage' => '5 GB', 'monthly' => 50000, 'yearly' => 600000],
        'premium' => ['students' => 300, 'storage' => 'Unlimited', 'monthly' => 100000, 'yearly' => 1000000],
    ];

    public function activePlan(int $schoolId): string
    {
        $subscription = (new SubscriptionModel())
            ->where('school_id', $schoolId)->where('status', 'active')
            ->where('end_date >=', date('Y-m-d'))->orderBy('end_date', 'DESC')->first();
        if ($subscription) return strtolower($subscription->plan_name);
        $school = (new SchoolModel())->find($schoolId);
        return $school && strtotime((string) $school->created_at . ' +7 days') >= time() ? 'trial' : 'expired';
    }

    public function studentLimit(int $schoolId): int
    {
        $plan = $this->activePlan($schoolId);
        return $plan === 'trial' ? self::CATALOG['premium']['students'] : (self::CATALOG[$plan]['students'] ?? 0);
    }
}
