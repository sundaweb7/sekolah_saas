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
        'school_id', 'favicon', 'logo', 'theme_color', 'theme_template', 'menu_data', 
        'google_maps_iframe', 'footer_text', 'contact_info', 
        'hero_banner_image', 'slider_images', 'seo_title', 'seo_description'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
