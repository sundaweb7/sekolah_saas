<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');
$routes->get('api/v1/health', 'HealthController::index');
$routes->options('(:any)', function() {
    $response = response();
    $response->setStatusCode(204);
    return $response;
});

/*
 * REST API Routes Structure
 */
$routes->group('api/v1', ['filter' => 'tenant'], function (RouteCollection $routes) {
    
    // Auth routes (public / tenant-scoped)
    $routes->post('auth/login', 'AuthController::login', ['filter' => 'throttle:5,60']);
    $routes->post('auth/logout', 'AuthController::logout');
    $routes->post('auth/refresh', 'AuthController::refresh');
    $routes->post('auth/register-tenant', 'AuthController::registerTenant', ['filter' => 'throttle:3,300']);
    $routes->post('auth/forgot-password', 'AuthController::forgotPassword', ['filter' => 'throttle:5,300']);
    $routes->post('auth/reset-password', 'AuthController::resetPassword', ['filter' => 'throttle:5,300']);
    $routes->post('auth/impersonation/exchange', 'AuthController::exchangeImpersonation', ['filter' => 'throttle:10,60']);
    
    // Tripay webhook callback endpoint
    $routes->post('payment/tripay-callback', 'PaymentCallbackController::handleTripayCallback', ['filter' => 'throttle:120,60']);
    
    // Authenticated profile routes
    $routes->group('auth', ['filter' => 'jwt_role:superadmin,admin,teacher,parent'], function (RouteCollection $routes) {
        $routes->get('profile', 'AuthController::profile');
        $routes->post('change-password', 'AuthController::changePassword');
    });

    // Shared communication center for school admins, teachers, and parents.
    $routes->group('communication', ['filter' => 'jwt_role:admin,teacher,parent'], function (RouteCollection $routes) {
        $feature = ['filter' => 'feature:communication'];
        $routes->get('contacts', 'CommunicationController::contacts', $feature);
        $routes->get('threads', 'CommunicationController::threads', $feature);
        $routes->post('threads', 'CommunicationController::createThread', $feature);
        $routes->post('broadcasts', 'CommunicationController::broadcast', $feature);
        $routes->get('threads/(:num)/messages', 'CommunicationController::messages/$1', $feature);
        $routes->post('threads/(:num)/messages', 'CommunicationController::sendMessage/$1', $feature);
        $routes->post('threads/(:num)/read', 'CommunicationController::markRead/$1', $feature);
        $routes->get('notifications', 'CommunicationController::notificationList', $feature);
        $routes->post('notifications/(:num)/read', 'CommunicationController::notificationRead/$1', $feature);
        $routes->post('notifications/read-all', 'CommunicationController::notificationReadAll', $feature);
        $routes->get('requests', 'CommunicationController::requests', $feature);
        $routes->post('requests', 'CommunicationController::createRequest', $feature);
        $routes->post('requests/(:num)/status', 'CommunicationController::updateRequest/$1', $feature);
        $routes->get('events', 'CommunicationController::events', $feature);
        $routes->post('events', 'CommunicationController::createEvent', $feature);
        $routes->post('events/(:num)', 'CommunicationController::updateEvent/$1', $feature);
        $routes->delete('events/(:num)', 'CommunicationController::deleteEvent/$1', $feature);
    });

    // Authenticated SuperAdmin Routes
    $routes->group('superadmin', ['filter' => 'jwt_role:superadmin'], function (RouteCollection $routes) {
        $routes->get('stats', 'SuperAdmin\SuperAdminController::stats');
        $routes->get('schools', 'SuperAdmin\SuperAdminController::schools');
        $routes->post('schools/status/(:num)', 'SuperAdmin\SuperAdminController::updateSchoolStatus/$1');
        $routes->post('schools/update/(:num)', 'SuperAdmin\SuperAdminController::updateSchool/$1');
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
        $routes->get('domain-requests/document/(:num)', 'SuperAdmin\SuperAdminController::downloadDomainDocument/$1');
    });
    
    // Public Tenant Info
    $routes->get('tenant/profile', 'TenantPublicController::profile');
    $routes->get('tenant/content/(:any)', 'TenantPublicController::getContent/$1');
    $routes->get('tenant/news/detail/(:any)', 'TenantPublicController::getNewsDetail/$1');
    $routes->get('tenant/page/detail/(:any)', 'TenantPublicController::getPageDetail/$1');
    
    // PPDB Public endpoints
    $routes->get('ppdb/settings', 'PpdbPublicController::getSettings');
    $routes->post('ppdb/register', 'PpdbPublicController::register', ['filter' => 'throttle:10,300']);
    $routes->get('ppdb/status/(:any)', 'PpdbPublicController::getStatus/$1');

    // SaaS Billing Public Webhook
    $routes->post('billing/webhook', 'Admin\BillingController::callback', ['filter' => 'throttle:120,60']);
    
    // Authenticated Teacher Routes
    $routes->group('teacher', ['filter' => 'jwt_role:teacher'], function (RouteCollection $routes) {
        $routes->get('dashboard/stats', 'Teacher\DashboardController::getStats');
        $routes->get('reports/daily', 'Admin\ReportController::getDaily', ['filter' => 'feature:perkembangan_siswa']);
        $routes->post('reports/daily', 'Admin\ReportController::createDaily', ['filter' => 'feature:perkembangan_siswa']);
        $routes->post('reports/daily/update/(:num)', 'Admin\ReportController::updateDaily/$1', ['filter' => 'feature:perkembangan_siswa']);
        $routes->delete('reports/daily/(:num)', 'Admin\ReportController::deleteDaily/$1', ['filter' => 'feature:perkembangan_siswa']);
        $routes->get('reports/semester', 'Admin\ReportController::getSemester', ['filter' => 'feature:perkembangan_siswa']);
        $routes->post('reports/semester', 'Admin\ReportController::createSemester', ['filter' => 'feature:perkembangan_siswa']);
        $routes->post('reports/semester/update/(:num)', 'Admin\ReportController::updateSemester/$1', ['filter' => 'feature:perkembangan_siswa']);
        $routes->delete('reports/semester/(:num)', 'Admin\ReportController::deleteSemester/$1', ['filter' => 'feature:perkembangan_siswa']);

        // Teacher Attendance & Announcements
        $routes->get('attendance', 'Teacher\AttendanceAnnouncementController::getAttendance');
        $routes->post('attendance', 'Teacher\AttendanceAnnouncementController::saveAttendance');
        $routes->post('attendance/check-in', 'Teacher\AttendanceAnnouncementController::checkInTeacher');
        $routes->get('attendance/status', 'Teacher\AttendanceAnnouncementController::getTeacherAttendanceStatus');
        $routes->get('attendance/my-history', 'Teacher\AttendanceAnnouncementController::getMyHistory');
        $routes->get('attendance/recap', 'Teacher\AttendanceAnnouncementController::getAttendanceRecap');
        // PIN Dinamis
        $routes->get('attendance/pin', 'Teacher\AttendanceAnnouncementController::getPin');
        $routes->post('attendance/pin/refresh', 'Teacher\AttendanceAnnouncementController::refreshPin');
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
        $routes->get('students/stats', 'Admin\StudentController::stats');
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
        $routes->post('academic-years/save', 'Admin\AcademicYearController::save');
        $routes->delete('academic-years/delete/(:num)', 'Admin\AcademicYearController::delete/$1');
        $routes->resource('academic-years', ['controller' => 'Admin\AcademicYearController']);

        $routes->post('semesters/save', 'Admin\SemesterController::save');
        $routes->delete('semesters/delete/(:num)', 'Admin\SemesterController::delete/$1');
        $routes->resource('semesters', ['controller' => 'Admin\SemesterController']);
        $routes->resource('invoices', ['controller' => 'Admin\InvoiceController']);

        // Extracurriculars endpoints
        $routes->get('extracurriculars/members', 'Admin\ExtracurricularController::listMembers');
        $routes->post('extracurriculars/members/enroll', 'Admin\ExtracurricularController::enroll');
        $routes->post('extracurriculars/members/approve', 'Admin\ExtracurricularController::approveMember');
        $routes->post('extracurriculars/members/grade', 'Admin\ExtracurricularController::updateGrade');
        $routes->get('extracurriculars/payments', 'Admin\ExtracurricularController::listPayments');
        $routes->post('extracurriculars/payments/pay', 'Admin\ExtracurricularController::processPayment');
        $routes->get('extracurriculars/presences', 'Admin\ExtracurricularController::listPresences');
        $routes->post('extracurriculars/presences/save', 'Admin\ExtracurricularController::savePresence');
        $routes->resource('extracurriculars', ['controller' => 'Admin\ExtracurricularController']);
        $routes->post('extracurriculars/update/(:num)', 'Admin\ExtracurricularController::update/$1');

        // KBM Lesson Scheduling endpoints
        $routes->get('kbm-schedules/class/(:num)/day/(:any)', 'Admin\KbmScheduleController::getByClassAndDay/$1/$2');
        $routes->resource('kbm-schedules', ['controller' => 'Admin\KbmScheduleController']);
        $routes->post('kbm-schedules/update/(:num)', 'Admin\KbmScheduleController::update/$1');
        $routes->delete('kbm-schedules/delete/(:num)', 'Admin\KbmScheduleController::delete/$1');

        // Attendance Analytics & Notification
        $routes->get('attendance/analytics', 'Admin\AttendanceAdminController::analytics');
        $routes->get('attendance/export', 'Admin\AttendanceAdminController::export');
        $routes->post('attendance/notify-absent', 'Admin\AttendanceAdminController::notifyAbsent');

        // Website Builder endpoints
        $routes->get('website/settings', 'Admin\WebsiteBuilderController::getSettings', ['filter' => 'feature:company_profile']);
        $routes->post('website/settings', 'Admin\WebsiteBuilderController::saveSettings', ['filter' => 'feature:company_profile']);
        $routes->post('website/profile', 'Admin\WebsiteBuilderController::saveProfile', ['filter' => 'feature:company_profile']);
        
        // Content Manager (News/Gallery/Events)
        $routes->get('website/contents', 'Admin\WebsiteBuilderController::getContents', ['filter' => 'feature:company_profile']);
        $routes->post('website/contents', 'Admin\WebsiteBuilderController::createContent', ['filter' => 'feature:company_profile']);
        $routes->post('website/contents/update/(:num)', 'Admin\WebsiteBuilderController::updateContent/$1', ['filter' => 'feature:company_profile']);
        $routes->delete('website/contents/delete/(:num)', 'Admin\WebsiteBuilderController::deleteContent/$1', ['filter' => 'feature:company_profile']);

        // Custom Pages Manager
        $routes->get('website/pages', 'Admin\WebsiteBuilderController::getPages', ['filter' => 'feature:company_profile']);
        $routes->post('website/pages', 'Admin\WebsiteBuilderController::createPage', ['filter' => 'feature:company_profile']);
        $routes->post('website/pages/update/(:num)', 'Admin\WebsiteBuilderController::updatePage/$1', ['filter' => 'feature:company_profile']);
        $routes->delete('website/pages/delete/(:num)', 'Admin\WebsiteBuilderController::deletePage/$1', ['filter' => 'feature:company_profile']);

        // News Categories Manager
        $routes->get('website/categories', 'Admin\WebsiteBuilderController::getCategories', ['filter' => 'feature:company_profile']);
        $routes->post('website/categories', 'Admin\WebsiteBuilderController::createCategory', ['filter' => 'feature:company_profile']);
        $routes->post('website/categories/update/(:num)', 'Admin\WebsiteBuilderController::updateCategory/$1', ['filter' => 'feature:company_profile']);
        $routes->delete('website/categories/delete/(:num)', 'Admin\WebsiteBuilderController::deleteCategory/$1', ['filter' => 'feature:company_profile']);

        // Tenant custom domain endpoints
        $routes->get('website/domain-request', 'Admin\WebsiteBuilderController::getDomainRequest', ['filter' => 'feature:company_profile']);
        $routes->post('website/domain-request', 'Admin\WebsiteBuilderController::submitDomainRequest', ['filter' => 'feature:company_profile']);

        // Accreditation (Google Drive links)
        $routes->get('acreditation', 'Admin\AccreditationController::index');
        $routes->post('acreditation/save', 'Admin\AccreditationController::save');
        $routes->delete('acreditation/delete/(:num)', 'Admin\AccreditationController::delete/$1');

        // E-Surat issuance records
        $routes->get('letters', 'Admin\SchoolLetterController::index');
        $routes->post('letters', 'Admin\SchoolLetterController::create');

        // PPDB Admin endpoints
        $routes->get('ppdb/settings', 'Admin\PpdbAdminController::getSettings', ['filter' => 'feature:ppdb']);
        $routes->post('ppdb/settings', 'Admin\PpdbAdminController::saveSettings', ['filter' => 'feature:ppdb']);
        $routes->get('ppdb/registrations', 'Admin\PpdbAdminController::getRegistrations', ['filter' => 'feature:ppdb']);
        $routes->post('ppdb/registrations/verify/(:num)', 'Admin\PpdbAdminController::verifyRegistration/$1', ['filter' => 'feature:ppdb']);
        $routes->post('ppdb/registrations/confirm-payment/(:num)', 'Admin\PpdbAdminController::confirmPayment/$1', ['filter' => 'feature:ppdb']);
        $routes->get('ppdb/registrations/document/(:num)/(:segment)', 'Admin\PpdbAdminController::downloadDocument/$1/$2', ['filter' => 'feature:ppdb']);

        // Dashboard Stats endpoint
        $routes->get('dashboard/stats', 'Admin\DashboardController::stats');

        // SaaS Billing Admin endpoints
        $routes->get('billing/status', 'Admin\BillingController::status');
        $routes->post('billing/checkout', 'Admin\BillingController::checkout');

        // SPP Admin endpoints
        $routes->get('spp', 'Admin\SppAdminController::index', ['filter' => 'feature:spp_siswa']);
        $routes->post('spp/generate', 'Admin\SppAdminController::generate', ['filter' => 'feature:spp_siswa']);
        $routes->post('spp/confirm/(:num)', 'Admin\SppAdminController::confirmPayment/$1', ['filter' => 'feature:spp_siswa']);
        $routes->delete('spp/delete/(:num)', 'Admin\SppAdminController::delete/$1', ['filter' => 'feature:spp_siswa']);

        // Reports endpoints (Laporan Harian, Semester, Absensi, Jurnal)
        $routes->get('reports/daily', 'Admin\ReportController::getDaily', ['filter' => 'feature:perkembangan_siswa']);
        $routes->post('reports/daily', 'Admin\ReportController::createDaily', ['filter' => 'feature:perkembangan_siswa']);
        $routes->post('reports/daily/update/(:num)', 'Admin\ReportController::updateDaily/$1', ['filter' => 'feature:perkembangan_siswa']);
        $routes->delete('reports/daily/(:num)', 'Admin\ReportController::deleteDaily/$1', ['filter' => 'feature:perkembangan_siswa']);
        $routes->get('reports/semester', 'Admin\ReportController::getSemester', ['filter' => 'feature:perkembangan_siswa']);
        $routes->post('reports/semester', 'Admin\ReportController::createSemester', ['filter' => 'feature:perkembangan_siswa']);
        $routes->post('reports/semester/update/(:num)', 'Admin\ReportController::updateSemester/$1', ['filter' => 'feature:perkembangan_siswa']);
        $routes->delete('reports/semester/(:num)', 'Admin\ReportController::deleteSemester/$1', ['filter' => 'feature:perkembangan_siswa']);
        $routes->get('reports/teacher-attendance', 'Admin\ReportController::getTeacherAttendanceReport', ['filter' => 'feature:absensi_guru']);
        $routes->get('reports/student-attendance', 'Admin\ReportController::getStudentAttendanceReport', ['filter' => 'feature:absensi_siswa_jurnal']);
        $routes->get('reports/class-journals', 'Admin\ReportController::getClassJournalsReport', ['filter' => 'feature:absensi_siswa_jurnal']);
    });
    
    // Authenticated Parent Routes
    $routes->group('parent', ['filter' => 'jwt_role:parent'], function (RouteCollection $routes) {
        $routes->get('dashboard', 'Parent\ParentController::dashboard');
        $routes->post('spp/pay/(:num)', 'Parent\ParentController::paySpp/$1', ['filter' => 'feature:spp_siswa']);
        
        $routes->get('reports/daily', 'Admin\ReportController::getDaily', ['filter' => 'feature:perkembangan_siswa']);
        $routes->get('reports/semester', 'Admin\ReportController::getSemester', ['filter' => 'feature:perkembangan_siswa']);
    });

    // Public Kiosk — No JWT required, PIN-validated check-in
    $routes->post('kiosk/checkin', 'Teacher\AttendanceAnnouncementController::kioskCheckin', ['filter' => 'throttle:60,60']);
    $routes->post('kiosk/validate-pin', 'Teacher\AttendanceAnnouncementController::validatePinPublic', ['filter' => 'throttle:30,60']);
});
