<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');
$routes->options('(:any)', function() {
    $response = response();
    $response->setStatusCode(200);
    $response->setHeader('Access-Control-Allow-Origin', '*');
    $response->setHeader('Access-Control-Allow-Headers', '*');
    $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    return $response;
});

/*
 * REST API Routes Structure
 */
$routes->group('api/v1', ['filter' => 'tenant'], function (RouteCollection $routes) {
    
    // Auth routes (public / tenant-scoped)
    $routes->post('auth/login', 'AuthController::login');
    $routes->post('auth/logout', 'AuthController::logout');
    $routes->post('auth/refresh', 'AuthController::refresh');
    $routes->post('auth/register-tenant', 'AuthController::registerTenant');
    $routes->post('auth/forgot-password', 'AuthController::forgotPassword');
    $routes->post('auth/reset-password', 'AuthController::resetPassword');
    
    // Tripay webhook callback endpoint
    $routes->post('payment/tripay-callback', 'PaymentCallbackController::handleTripayCallback');
    
    // Authenticated profile routes
    $routes->group('auth', ['filter' => 'jwt_role:superadmin,admin,teacher,parent'], function (RouteCollection $routes) {
        $routes->get('profile', 'AuthController::profile');
        $routes->post('change-password', 'AuthController::changePassword');
    });

    // Authenticated SuperAdmin Routes
    $routes->group('superadmin', ['filter' => 'jwt_role:superadmin'], function (RouteCollection $routes) {
        $routes->get('stats', 'SuperAdmin\SuperAdminController::stats');
        $routes->get('schools', 'SuperAdmin\SuperAdminController::schools');
        $routes->post('schools/status/(:num)', 'SuperAdmin\SuperAdminController::updateSchoolStatus/$1');
        $routes->get('invoices', 'SuperAdmin\SuperAdminController::invoices');
        $routes->post('cache/clear', 'SuperAdmin\SuperAdminController::clearCache');
        $routes->post('impersonate/(:num)', 'SuperAdmin\SuperAdminController::impersonate/$1');
        $routes->get('schools/detail/(:num)', 'SuperAdmin\SuperAdminController::schoolDetail/$1');
        $routes->get('features', 'SuperAdmin\SuperAdminController::getFeatures');
        $routes->post('features/update', 'SuperAdmin\SuperAdminController::updateFeature');
        $routes->post('features/create', 'SuperAdmin\SuperAdminController::createFeature');
        $routes->delete('features/delete/(:num)', 'SuperAdmin\SuperAdminController::deleteFeature/$1');

        // SuperAdmin Domain Requests management
        $routes->get('domain-requests', 'SuperAdmin\SuperAdminController::getDomainRequests');
        $routes->post('domain-requests/process/(:num)', 'SuperAdmin\SuperAdminController::processDomainRequest/$1');
        $routes->post('domain-requests/approve/(:num)', 'SuperAdmin\SuperAdminController::approveDomainRequest/$1');
        $routes->post('domain-requests/reject/(:num)', 'SuperAdmin\SuperAdminController::rejectDomainRequest/$1');
    });
    
    // Public Tenant Info
    $routes->get('tenant/profile', 'TenantPublicController::profile');
    $routes->get('tenant/content/(:any)', 'TenantPublicController::getContent/$1');
    $routes->get('tenant/news/detail/(:any)', 'TenantPublicController::getNewsDetail/$1');
    
    // PPDB Public endpoints
    $routes->get('ppdb/settings', 'PpdbPublicController::getSettings');
    $routes->post('ppdb/register', 'PpdbPublicController::register');
    $routes->get('ppdb/status/(:any)', 'PpdbPublicController::getStatus/$1');

    // SaaS Billing Public Webhook
    $routes->post('billing/webhook', 'Admin\BillingController::callback');
    
    // Authenticated Teacher Routes
    $routes->group('teacher', ['filter' => 'jwt_role:teacher'], function (RouteCollection $routes) {
        $routes->get('dashboard/stats', 'Teacher\DashboardController::getStats');
        $routes->get('reports/daily', 'Admin\ReportController::getDaily');
        $routes->post('reports/daily', 'Admin\ReportController::createDaily');
        $routes->post('reports/daily/update/(:num)', 'Admin\ReportController::updateDaily/$1');
        $routes->delete('reports/daily/(:num)', 'Admin\ReportController::deleteDaily/$1');
        $routes->get('reports/semester', 'Admin\ReportController::getSemester');
        $routes->post('reports/semester', 'Admin\ReportController::createSemester');
        $routes->post('reports/semester/update/(:num)', 'Admin\ReportController::updateSemester/$1');
        $routes->delete('reports/semester/(:num)', 'Admin\ReportController::deleteSemester/$1');

        // Teacher Attendance & Announcements
        $routes->get('attendance', 'Teacher\AttendanceAnnouncementController::getAttendance');
        $routes->post('attendance', 'Teacher\AttendanceAnnouncementController::saveAttendance');
        $routes->post('attendance/check-in', 'Teacher\AttendanceAnnouncementController::checkInTeacher');
        $routes->get('attendance/status', 'Teacher\AttendanceAnnouncementController::getTeacherAttendanceStatus');
        $routes->post('journals', 'Teacher\AttendanceAnnouncementController::saveJournal');
        $routes->get('journals', 'Teacher\AttendanceAnnouncementController::getJournals');
        $routes->get('announcements', 'Teacher\AttendanceAnnouncementController::getAnnouncements');
        $routes->post('announcements', 'Teacher\AttendanceAnnouncementController::saveAnnouncement');
        $routes->delete('announcements/(:num)', 'Teacher\AttendanceAnnouncementController::deleteAnnouncement/$1');
    });
    
    // Authenticated Admin Routes
    $routes->group('admin', ['filter' => 'jwt_role:admin'], function (RouteCollection $routes) {
        // Students Excel endpoints
        $routes->get('students/export', 'Admin\StudentController::export');
        $routes->post('students/import', 'Admin\StudentController::import');

        $routes->resource('students', ['controller' => 'Admin\StudentController']);
        $routes->post('students/update/(:num)', 'Admin\StudentController::update/$1');
        $routes->resource('teachers', ['controller' => 'Admin\TeacherController']);
        $routes->post('teachers/update/(:num)', 'Admin\TeacherController::update/$1');
        $routes->post('teachers/impersonate/(:num)', 'Admin\TeacherController::impersonate/$1');
        $routes->post('students/impersonate-parent/(:num)', 'Admin\StudentController::impersonateParent/$1');
        $routes->resource('classes', ['controller' => 'Admin\ClassController']);
        $routes->post('classes/update/(:num)', 'Admin\ClassController::update/$1');
        $routes->resource('users', ['controller' => 'Admin\UserController']);
        $routes->post('users/update/(:num)', 'Admin\UserController::update/$1');
        $routes->resource('academic-years', ['controller' => 'Admin\AcademicYearController']);
        $routes->resource('semesters', ['controller' => 'Admin\SemesterController']);
        $routes->resource('invoices', ['controller' => 'Admin\InvoiceController']);

        // Website Builder endpoints
        $routes->get('website/settings', 'Admin\WebsiteBuilderController::getSettings');
        $routes->post('website/settings', 'Admin\WebsiteBuilderController::saveSettings');
        $routes->post('website/profile', 'Admin\WebsiteBuilderController::saveProfile');
        
        // Content Manager (News/Gallery/Events)
        $routes->get('website/contents', 'Admin\WebsiteBuilderController::getContents');
        $routes->post('website/contents', 'Admin\WebsiteBuilderController::createContent');
        $routes->post('website/contents/update/(:num)', 'Admin\WebsiteBuilderController::updateContent/$1');
        $routes->delete('website/contents/delete/(:num)', 'Admin\WebsiteBuilderController::deleteContent/$1');

        // News Categories Manager
        $routes->get('website/categories', 'Admin\WebsiteBuilderController::getCategories');
        $routes->post('website/categories', 'Admin\WebsiteBuilderController::createCategory');
        $routes->post('website/categories/update/(:num)', 'Admin\WebsiteBuilderController::updateCategory/$1');
        $routes->delete('website/categories/delete/(:num)', 'Admin\WebsiteBuilderController::deleteCategory/$1');

        // Tenant custom domain endpoints
        $routes->get('website/domain-request', 'Admin\WebsiteBuilderController::getDomainRequest');
        $routes->post('website/domain-request', 'Admin\WebsiteBuilderController::submitDomainRequest');

        // PPDB Admin endpoints
        $routes->get('ppdb/settings', 'Admin\PpdbAdminController::getSettings');
        $routes->post('ppdb/settings', 'Admin\PpdbAdminController::saveSettings');
        $routes->get('ppdb/registrations', 'Admin\PpdbAdminController::getRegistrations');
        $routes->post('ppdb/registrations/verify/(:num)', 'Admin\PpdbAdminController::verifyRegistration/$1');
        $routes->post('ppdb/registrations/confirm-payment/(:num)', 'Admin\PpdbAdminController::confirmPayment/$1');

        // Dashboard Stats endpoint
        $routes->get('dashboard/stats', 'Admin\DashboardController::stats');

        // SaaS Billing Admin endpoints
        $routes->get('billing/status', 'Admin\BillingController::status');
        $routes->post('billing/checkout', 'Admin\BillingController::checkout');

        // SPP Admin endpoints
        $routes->get('spp', 'Admin\SppAdminController::index');
        $routes->post('spp/generate', 'Admin\SppAdminController::generate');
        $routes->post('spp/confirm/(:num)', 'Admin\SppAdminController::confirmPayment/$1');
        $routes->delete('spp/delete/(:num)', 'Admin\SppAdminController::delete/$1');

        // Reports endpoints (Laporan Harian, Semester, Absensi, Jurnal)
        $routes->get('reports/daily', 'Admin\ReportController::getDaily');
        $routes->post('reports/daily', 'Admin\ReportController::createDaily');
        $routes->post('reports/daily/update/(:num)', 'Admin\ReportController::updateDaily/$1');
        $routes->delete('reports/daily/(:num)', 'Admin\ReportController::deleteDaily/$1');
        $routes->get('reports/semester', 'Admin\ReportController::getSemester');
        $routes->post('reports/semester', 'Admin\ReportController::createSemester');
        $routes->post('reports/semester/update/(:num)', 'Admin\ReportController::updateSemester/$1');
        $routes->delete('reports/semester/(:num)', 'Admin\ReportController::deleteSemester/$1');
        $routes->get('reports/teacher-attendance', 'Admin\ReportController::getTeacherAttendanceReport');
        $routes->get('reports/student-attendance', 'Admin\ReportController::getStudentAttendanceReport');
        $routes->get('reports/class-journals', 'Admin\ReportController::getClassJournalsReport');
    });
    
    // Authenticated Parent Routes
    $routes->group('parent', ['filter' => 'jwt_role:parent'], function (RouteCollection $routes) {
        $routes->get('dashboard', 'Parent\ParentController::dashboard');
        $routes->post('spp/pay/(:num)', 'Parent\ParentController::paySpp/$1');
        
        $routes->get('reports/daily', 'Admin\ReportController::getDaily');
        $routes->get('reports/semester', 'Admin\ReportController::getSemester');
    });
});
