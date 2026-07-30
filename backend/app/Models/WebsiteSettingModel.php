<?php

namespace App\Models;

class WebsiteSettingModel extends BaseModel
{
    protected $table            = 'website_settings';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'favicon', 'logo', 'letterhead_logo', 'theme_color', 'theme_template', 'menu_data',
        'google_maps_iframe', 'footer_text', 'contact_info',
        'payment_bank_name', 'payment_account_number', 'payment_account_name', 'bank_accounts', 'show_accreditation',
        'hero_banner_image', 'slider_images', 'seo_title', 'seo_description',
        'fonnte_token'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
