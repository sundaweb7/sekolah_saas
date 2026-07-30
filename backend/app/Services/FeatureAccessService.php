<?php

namespace App\Services;

use App\Models\FeatureSettingModel;
use App\Models\SchoolModel;
use App\Models\SubscriptionModel;

class FeatureAccessService
{
    public function forSchool(?int $schoolId): array
    {
        if (!$schoolId) return [];
        $school = (new SchoolModel())->find($schoolId);
        if (!$school) return [];

        $subscription = (new SubscriptionModel())
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->where('end_date >=', date('Y-m-d'))
            ->orderBy('end_date', 'DESC')
            ->first();
        if (!$subscription && strtotime((string) $school->created_at . ' +7 days') < time()) {
            return [];
        }
        $plan = $subscription ? strtolower($subscription->plan_name) : 'trial';
        $levelColumn = 'level_' . strtolower($school->level ?: 'tk');
        $planColumn = 'plan_' . $plan;

        $allowed = [];
        foreach ((new FeatureSettingModel())->findAll() as $feature) {
            if ((int) ($feature[$levelColumn] ?? 0) === 1 && (int) ($feature[$planColumn] ?? 0) === 1) {
                $allowed[] = $feature['feature_key'];
            }
        }
        return $allowed;
    }
}
