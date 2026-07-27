<?php
define('FCPATH', __DIR__ . '/public/');
define('CURRENT_SCHOOL_ID', 2);
require __DIR__ . '/app/Config/Paths.php';
$paths = new Config\Paths();

// Set environment
$_SERVER['CI_ENVIRONMENT'] = 'development';

// Load helpers and bootstrap
require $paths->systemDirectory . '/Boot.php';
// Boot CI in CLI mode so it doesn't exit immediately
\CodeIgniter\Boot::bootCli($paths);

$teacherModel = new \App\Models\TeacherModel();
$builder = $teacherModel->select('teachers.*, users.email')
                       ->join('users', 'users.id = teachers.user_id', 'left');

try {
    $teachers = $builder->findAll();
    print_r($teachers);
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
