<?php
/**
 * =====================================================================
 *  KALALAYA FINE ARTS — SITE CONFIGURATION
 *  Edit the values below. Every page, the footer, the structured data
 *  and the enquiry form read from this one file.
 *  This file is PHP, so nothing here is ever sent to the browser
 *  unless a page deliberately prints it (SMTP passwords never are).
 * =====================================================================
 */
if (!defined('KALALAYA')) { http_response_code(403); exit; }

return [

    /* ---------- Website ---------- */
    'site_name'   => 'Kalalaya Fine Arts',
    'tagline'     => 'Nurturing creativity through drawing, painting and fine arts since 2002.',
    // Your live domain, WITHOUT a trailing slash. Used for canonical URLs,
    // Open Graph tags, sitemap and structured data.  >>> REPLACE <<<
    'base_url'    => 'https://www.kalalayafinearts.com',
    // Folder the site lives in, relative to the domain root. Use '/' when the
    // files are directly in public_html, or e.g. '/kalalaya/' for a sub-folder.
    'base_path'   => '/',
    'established' => '2002',

    /* ---------- Contact details ---------- */
    'phone_display' => '+91 98424 34219',
    'phone_link'    => '+919842434219',          // digits only, with country code
    'whatsapp'      => '919842434219',           // used for wa.me link (no +)
    'email'         => 'kalalayafinearts@gmail.com',

    // NOTE: The About Us mockup and the Contact mockup show DIFFERENT
    // addresses. The About Us address is used here. Please confirm.
    'address' => [
        'line1'    => '511/1, Rabindranath Tagore Road',
        'line2'    => 'Maniyakarampalayam',
        'city'     => 'Coimbatore',
        'state'    => 'Tamil Nadu',
        'postcode' => '641006',
        'country'  => 'India',
    ],
    'hours_days' => 'Monday – Saturday',
    'hours_time' => '9:00 AM – 7:00 PM',        // as shown on the Contact mockup — please confirm

    /* ---------- Maps ---------- */
    // "Get Directions" / "View on Google Maps" buttons
    'maps_url'   => 'https://www.google.com/maps/search/?api=1&query=Kalalaya+Fine+Arts+Coimbatore',
    // Query used for the embedded map on Contact & About (no API key needed)
    'maps_embed_query' => 'Kalalaya Fine Arts, Rabindranath Tagore Road, Maniyakarampalayam, Coimbatore 641006',

    /* ---------- Social links ----------
       PLACEHOLDERS — replace with the official page URLs.
       Leave a value as '' to hide that icon everywhere. */
    'social' => [
        'facebook'  => 'https://www.facebook.com/',      // >>> REPLACE <<<
        'instagram' => 'https://www.instagram.com/',     // >>> REPLACE <<<
        'youtube'   => 'https://www.youtube.com/',       // >>> REPLACE <<<
        'whatsapp'  => 'https://wa.me/919842434219',
    ],

    /* ---------- Enquiry form (submit-enquiry.php) ---------- */
    'enquiry' => [
        // Where enquiries are delivered
        'recipient'      => 'kalalayafinearts@gmail.com',
        // The "From" address. On DirectAdmin this should be an address ON
        // YOUR OWN DOMAIN (e.g. no-reply@yourdomain.com) or mail may be rejected.
        'from_email'     => 'no-reply@kalalayafinearts.com',   // >>> REPLACE <<<
        'from_name'      => 'Kalalaya Website',
        'subject_prefix' => '[Website Enquiry]',
        'min_seconds'    => 3,    // reject forms submitted faster than this (bots)
        'cooldown'       => 60,   // seconds between submissions per visitor

        // Optional SMTP. Leave 'enabled' => false to use PHP mail().
        // Credentials stay on the server; they are never output to visitors.
        'smtp' => [
            'enabled'  => false,
            'host'     => 'mail.yourdomain.com',
            'port'     => 587,            // 587 = STARTTLS, 465 = SSL
            'secure'   => 'tls',          // 'tls' or 'ssl'
            'username' => 'no-reply@yourdomain.com',
            'password' => '',
        ],
    ],

    // Course options shown in the enquiry form dropdown
    'course_options' => [
        'Kids (Ages 5–7)',
        'Young Artists (Ages 8–12)',
        'Teen Artists (Ages 13–18)',
        'Professional Courses',
        'Short-Term Courses',
        'Adult Art Classes',
        'Not sure yet',
    ],
];
