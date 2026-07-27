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

        // Generate random name for safety
        $newName = $file->getRandomName();

        // Move to public path or custom writeable path
        $publicPath = ROOTPATH . 'public/' . $folder;
        $file->move($publicPath, $newName);

        return $folder . '/' . $newName;
    }
}
