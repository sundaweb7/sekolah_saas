<?php

namespace App\Controllers;

use App\Models\SchoolModel;
use App\Models\WebsiteSettingModel;
use App\Models\SchoolProfileModel;
use App\Models\SchoolContentModel;
use App\Models\TeacherModel;
use CodeIgniter\HTTP\ResponseInterface;

class TenantPublicController extends BaseResourceController
{
    /**
     * GET /api/v1/tenant/profile
     * Resolves the entire public website data for the active school subdomain.
     */
    public function profile(): ResponseInterface
    {
        if (!defined('CURRENT_SCHOOL_ID')) {
            return $this->respondError('School context not resolved.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $schoolId = CURRENT_SCHOOL_ID;

        // API Caching: Check if resolved tenant profile is cached
        $cacheKey = "tenant_profile_{$schoolId}";
        if ($cachedData = cache($cacheKey)) {
            return $this->respondSuccess($cachedData, 'Public school website data resolved from cache');
        }

        // 1. Fetch School Info
        $schoolModel = new SchoolModel();
        $school = $schoolModel->find($schoolId);

        if (!$school || $school->status !== 'active') {
            return $this->respondError('School not active or not found.', ResponseInterface::HTTP_NOT_FOUND);
        }

        // 2. Fetch Website Settings
        $webSettingsModel = new WebsiteSettingModel();
        $settings = $webSettingsModel->where('school_id', $schoolId)->first();
        if ($settings) {
            if (isset($settings->contact_info) && is_string($settings->contact_info)) {
                $settings->contact_info = json_decode($settings->contact_info);
            }
            if (isset($settings->menu_data) && is_string($settings->menu_data)) {
                $settings->menu_data = json_decode($settings->menu_data);
            }
            if (isset($settings->slider_images) && is_string($settings->slider_images)) {
                $settings->slider_images = json_decode($settings->slider_images);
            }
        }

        // 3. Fetch School Profile (History, Visi Misi)
        $profileModel = new SchoolProfileModel();
        $profile = $profileModel->where('school_id', $schoolId)->first();

        // 4. Fetch dynamic content
        $contentModel = new SchoolContentModel();
        
        $db = \Config\Database::connect();
        $news = $db->table('school_contents')
                   ->select('school_contents.*, news_categories.name as category_name, news_categories.slug as category_slug')
                   ->join('news_categories', 'news_categories.id = school_contents.category_id', 'left')
                   ->where('school_contents.school_id', $schoolId)
                   ->where('school_contents.type', 'news')
                   ->where('school_contents.status', 'published')
                   ->where('school_contents.deleted_at IS NULL')
                   ->orderBy('school_contents.created_at', 'DESC')
                   ->get()->getResult();

        $categoryModel = new \App\Models\NewsCategoryModel();
        $categories = $categoryModel->where('school_id', $schoolId)->orderBy('name', 'ASC')->findAll();

        $events = $contentModel->where('school_id', $schoolId)
                               ->where('type', 'event')
                               ->where('status', 'published')
                               ->orderBy('event_date', 'ASC')
                               ->limit(6)
                               ->findAll();

        $announcements = $contentModel->where('school_id', $schoolId)
                                     ->where('type', 'announcement')
                                     ->where('status', 'published')
                                     ->orderBy('created_at', 'DESC')
                                     ->limit(6)
                                     ->findAll();

        $gallery = $contentModel->where('school_id', $schoolId)
                                ->where('type', 'gallery')
                                ->orderBy('created_at', 'DESC')
                                ->limit(12)
                                ->findAll();

        // 5. Fetch Teachers
        $teacherModel = new TeacherModel();
        $teachers = $teacherModel->where('school_id', $schoolId)->findAll();

        $responseData = [
            'school'        => $school,
            'settings'      => $settings,
            'profile'       => $profile,
            'news'          => $news,
            'categories'    => $categories,
            'events'        => $events,
            'announcements' => $announcements,
            'gallery'       => $gallery,
            'teachers'      => $teachers
        ];

        // Save to cache for 10 minutes (600 seconds)
        cache()->save($cacheKey, $responseData, 600);

        return $this->respondSuccess($responseData, 'Public school website data resolved successfully');
    }

    /**
     * GET /api/v1/tenant/content/{id}
     */
    public function getContent(string $id): ResponseInterface
    {
        $contentModel = new SchoolContentModel();
        $content = $contentModel->find($id);
        
        if (!$content) {
            return $this->respondError('Content not found', ResponseInterface::HTTP_NOT_FOUND);
        }
        
        return $this->respondSuccess($content, 'Content loaded successfully');
    }

    /**
     * GET /api/v1/tenant/news/detail/{slug}
     */
    public function getNewsDetail(string $slug): ResponseInterface
    {
        $db = \Config\Database::connect();
        $builder = $db->table('school_contents')
            ->select('school_contents.*, news_categories.name as category_name, news_categories.slug as category_slug')
            ->join('news_categories', 'news_categories.id = school_contents.category_id', 'left')
            ->where('school_contents.type', 'news')
            ->where('school_contents.status', 'published')
            ->where('school_contents.deleted_at IS NULL');

        if (is_numeric($slug)) {
            $builder->where('school_contents.id', (int)$slug);
        } else {
            $builder->where('school_contents.slug', $slug);
        }

        $news = $builder->get()->getRow();

        if (!$news) {
            return $this->respondError('News article not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        return $this->respondSuccess($news, 'News detail loaded successfully');
    }
}
