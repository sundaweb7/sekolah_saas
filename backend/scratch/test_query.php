<?php

// Define environment and path bootstrap
define('FCPATH', __DIR__ . '/../public/');
require __DIR__ . '/../vendor/codeigniter4/framework/system/bootstrap.php';

// Define tenant context manually for testing
define('CURRENT_SCHOOL_ID', 2);

$studentModel = new \App\Models\StudentModel();

// Query using same builder logic
$status = 'aktif';
$students = $studentModel->where('status', $status)->findAll();

echo "STUDENTS COUNT WITH STATUS 'aktif': " . count($students) . "\n";
foreach ($students as $s) {
    echo "ID: {$s->id}, Name: {$s->full_name}, Status: {$s->status}, SchoolID: {$s->school_id}\n";
}
