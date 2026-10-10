<?php
if (!defined('KALALAYA')) { http_response_code(403); exit; }

$CONFIG = require __DIR__ . '/config.php';

/** Escape for HTML output */
function e($v): string { return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function cfg(string $key, $default = null) {
    global $CONFIG;
    $v = $CONFIG;
    foreach (explode('.', $key) as $k) {
        if (!is_array($v) || !array_key_exists($k, $v)) return $default;
        $v = $v[$k];
    }
    return $v;
}

function full_address(string $sep = ', '): string {
    $a = cfg('address');
    return implode($sep, [$a['line1'], $a['line2'], $a['city'] . ' – ' . $a['postcode'], $a['state'] . ', ' . $a['country']]);
}

function abs_url(string $path = ''): string { return rtrim(cfg('base_url'), '/') . '/' . ltrim($path, '/'); }

function maps_embed_src(): string {
    return 'https://maps.google.com/maps?q=' . rawurlencode(cfg('maps_embed_query')) . '&z=15&output=embed';
}

function start_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS'])]);
        session_start();
    }
}

/** Inline SVG icons (stroke style, 24×24). */
function icon(string $name, string $class = 'icon'): string {
    static $p = [
        'arrow-right' => '<path d="M5 12h14M13 6l6 6-6 6"/>',
        'arrow-left'  => '<path d="M19 12H5M11 6l-6 6 6 6"/>',
        'chevron'     => '<path d="m6 9 6 6 6-6"/>',
        'calendar'    => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
        'clock'       => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        'star'        => '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
        'users'       => '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 9.5-4.9"/><circle cx="17" cy="15" r="3"/><path d="M13 21a4 4 0 0 1 8 0"/>',
        'user'        => '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        'pin'         => '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
        'phone'       => '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/>',
        'mail'        => '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
        'trophy'      => '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
        'heart'       => '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
        'book'        => '<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>',
        'target'      => '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="m12 12 8-8M17 4h3v3"/>',
        'external'    => '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
        'menu'        => '<path d="M3 6h18M3 12h18M3 18h18"/>',
        'close'       => '<path d="M18 6 6 18M6 6l12 12"/>',
        'check'       => '<path d="M20 6 9 17l-5-5"/>',
        'palette'     => '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7h2a5.6 5.6 0 0 0 5.4-5.6C22 6 17.5 2 12 2z"/>',
    ];
    static $f = [
        'facebook'  => '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8.5c0-.3.2-.5.5-.5z"/>',
        'instagram' => '<path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-2.3.1-3.4 1.2-3.5 3.5-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 2.3 1.2 3.4 3.5 3.5 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c2.3-.1 3.4-1.2 3.5-3.5.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-2.3-1.2-3.4-3.5-3.5C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm5.1-3.2a1.2 1.2 0 1 1 0 2.3 1.2 1.2 0 0 1 0-2.3z"/>',
        'youtube'   => '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3z"/>',
        'whatsapp'  => '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/>',
    ];
    if (isset($f[$name])) return '<svg class="' . $class . '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' . $f[$name] . '</svg>';
    return '<svg class="' . $class . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . ($p[$name] ?? '') . '</svg>';
}

/** JSON-LD for the organisation (printed in every page head). */
function org_jsonld(): string {
    $a = cfg('address');
    $data = [
        '@context' => 'https://schema.org',
        '@type' => ['EducationalOrganization', 'LocalBusiness'],
        'name' => cfg('site_name'),
        'url' => abs_url(),
        'logo' => abs_url('assets/logo/kalalaya-logo.png'),
        'image' => abs_url('assets/images/hero/hero-girl-painting.jpg'),
        'description' => 'Drawing, painting and fine arts institute in Coimbatore offering courses for kids, teenagers and adults since 2002.',
        'foundingDate' => cfg('established'),
        'founder' => ['@type' => 'Person', 'name' => 'Anthony Raj'],
        'telephone' => cfg('phone_link'),
        'email' => cfg('email'),
        'address' => [
            '@type' => 'PostalAddress',
            'streetAddress' => $a['line1'] . ', ' . $a['line2'],
            'addressLocality' => $a['city'],
            'addressRegion' => $a['state'],
            'postalCode' => $a['postcode'],
            'addressCountry' => 'IN',
        ],
        'areaServed' => ['@type' => 'City', 'name' => 'Coimbatore'],
        'sameAs' => array_values(array_filter([cfg('social.facebook'), cfg('social.instagram'), cfg('social.youtube')], fn($u) => $u && !preg_match('#\.com/?$#', $u))),
    ];
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/** Breadcrumb JSON-LD */
function breadcrumb_jsonld(array $items): string {
    $list = [];
    foreach ($items as $i => [$name, $path]) {
        $list[] = ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $name, 'item' => abs_url($path)];
    }
    return json_encode(['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $list], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

/** UTF-8 safe length/substring that also work when the mbstring extension is missing. */
function u_len(string $s): int {
    if (function_exists('mb_strlen')) return mb_strlen($s, 'UTF-8');
    return preg_match_all('/./us', $s);
}
function u_sub(string $s, int $max): string {
    if (function_exists('mb_substr')) return mb_substr($s, 0, $max, 'UTF-8');
    return preg_match('/^.{0,' . $max . '}/us', $s, $m) ? $m[0] : substr($s, 0, $max);
}
