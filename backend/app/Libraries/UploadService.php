<?php

namespace App\Libraries;

use CodeIgniter\HTTP\Files\UploadedFile;
use Exception;

class UploadService
{
    protected array $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    protected int $maxSize = 2048; // 2MB in KB

    /**
     * Upload an uploaded file object safely
     */
    public function uploadImage(UploadedFile $file, string $folder = 'uploads'): string
    {
        if (!$file->isValid()) {
            throw new Exception($file->getErrorString() . ' (' . $file->getError() . ')');
        }

        // Validate size
        if ($file->getSizeByUnit('kb') > $this->maxSize) {
            throw new Exception('File size exceeds the limit of ' . ($this->maxSize / 1024) . ' MB.');
        }

        // Validate MIME type
        if (!in_array($file->getMimeType(), $this->allowedMimeTypes)) {
            throw new Exception('Invalid file format. Only JPG, PNG, and WEBP are allowed.');
        }

        if (@getimagesize($file->getTempName()) === false) {
            throw new Exception('Uploaded file is not a valid image.');
        }

        // Generate random name for safety
        $newName = $file->getRandomName();

        // Move to public path or custom writeable path
        $publicPath = ROOTPATH . 'public/' . $folder;
        if (!is_dir($publicPath) && !mkdir($publicPath, 0750, true) && !is_dir($publicPath)) {
            throw new Exception('Upload directory is not available.');
        }
        $file->move($publicPath, $newName);

        return $folder . '/' . $newName;
    }

    public function uploadDocument(UploadedFile $file, string $folder = 'uploads/documents'): string
    {
        if (!$file->isValid()) {
            throw new Exception('Invalid document upload.');
        }

        if ($file->getSizeByUnit('kb') > 5120) {
            throw new Exception('Document size exceeds the limit of 5 MB.');
        }

        $allowed = [
            'application/pdf',
            'application/zip',
            'application/x-zip-compressed',
            'image/jpeg',
            'image/png',
        ];
        if (!in_array($file->getMimeType(), $allowed, true)) {
            throw new Exception('Only PDF, ZIP, JPG, and PNG documents are allowed.');
        }

        $publicPath = ROOTPATH . 'public/' . $folder;
        if (!is_dir($publicPath) && !mkdir($publicPath, 0750, true) && !is_dir($publicPath)) {
            throw new Exception('Upload directory is not available.');
        }

        $newName = $file->getRandomName();
        $file->move($publicPath, $newName);
        return $folder . '/' . $newName;
    }

    public function uploadPrivateDocument(UploadedFile $file, string $folder): string
    {
        if (!$file->isValid() || $file->getSizeByUnit('kb') > 5120) {
            throw new Exception('Invalid document or file exceeds 5 MB.');
        }
        $allowed = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!in_array($file->getMimeType(), $allowed, true)) {
            throw new Exception('Only PDF, JPG, and PNG documents are allowed.');
        }

        $safeFolder = trim(preg_replace('/[^a-zA-Z0-9_\/-]/', '', $folder), '/');
        $path = WRITEPATH . 'uploads/' . $safeFolder;
        if (!is_dir($path) && !mkdir($path, 0750, true) && !is_dir($path)) {
            throw new Exception('Private upload directory is not available.');
        }
        $name = $file->getRandomName();
        $file->move($path, $name);
        return $safeFolder . '/' . $name;
    }
}
