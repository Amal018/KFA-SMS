<?php
/**
 * Shared <head> + site header.
 * Each page sets $page before including this file:
 *   $page = ['id' => 'home', 'title' => '...', 'description' => '...', 'path' => 'index.php',
 *            'og_image' => 'assets/...jpg', 'jsonld' => '...optional extra JSON-LD...'];
 */
if (!defined('KALALAYA')) { http_response_code(403); exit; }

$pid      = $page['id'] ?? '';
$canon    = abs_url($page['path'] ?? '');
$ogImage  = abs_url($page['og_image'] ?? 'assets/images/hero/hero-girl-painting.jpg');
$noindex  = !empty($page['noindex']);

$nav = [
    ['home', 'Home', 'index.php'],
    ['about', 'About Us', 'about.php'],
    ['courses', 'Courses', 'courses.php', [
        ['Our Courses', 'courses.php'],
        ['All Course Details', 'course-details.php'],
        ['Kids (5–7 yrs)', 'course-details.php?category=kids'],
        ['Young Artists (8–12 yrs)', 'course-details.php?category=young-artists'],
        ['Teen Artists (13–18 yrs)', 'course-details.php?category=teen-artists'],
        ['Professional Courses', 'course-details.php?category=professional'],
        ['Short-Term Courses', 'course-details.php?category=short-term'],
    ]],
    ['achievements', 'Achievements', 'achievements.php'],
    ['events', 'Events', 'events.php'],
    ['gallery', 'Gallery', 'gallery.php', [
        ["Master’s Work", 'gallery.php#masters-work'],
        ["Students’ Work", 'gallery.php#students-work'],
    ]],
    ['contact', 'Contact', 'contact.php'],
];
?><!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8">
<?php if (!empty($page['use_base'])): ?><base href="<?= e(cfg('base_path', '/')) ?>">
<?php endif; ?>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.className+=" js";</script>
<title><?= e($page['title']) ?></title>
<meta name="description" content="<?= e($page['description']) ?>">
<?php if ($noindex): ?><meta name="robots" content="noindex, follow">
<?php endif; ?>
<link rel="canonical" href="<?= e($canon) ?>">
<meta name="theme-color" content="#FF006E">

<!-- Open Graph / Twitter -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= e(cfg('site_name')) ?>">
<meta property="og:title" content="<?= e($page['title']) ?>">
<meta property="og:description" content="<?= e($page['description']) ?>">
<meta property="og:url" content="<?= e($canon) ?>">
<meta property="og:image" content="<?= e($ogImage) ?>">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= e($page['title']) ?>">
<meta name="twitter:description" content="<?= e($page['description']) ?>">
<meta name="twitter:image" content="<?= e($ogImage) ?>">

<link rel="icon" type="image/png" href="assets/logo/favicon.png">
<link rel="apple-touch-icon" href="assets/logo/favicon.png">

<!-- Fonts: Roboto Serif (headings), Roboto (UI), Dancing Script (decorative quotes only) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Serif:opsz,wght@8..144,400..700&family=Roboto:wght@400;500;700&family=Dancing+Script:wght@500&display=swap">

<link rel="stylesheet" href="css/style.css?v=1.0">
<link rel="stylesheet" href="css/responsive.css?v=1.0">

<script type="application/ld+json"><?= org_jsonld() ?></script>
<?php if (!empty($page['jsonld'])): ?><script type="application/ld+json"><?= $page['jsonld'] ?></script>
<?php endif; ?>
</head>
<body class="page-<?= e($pid) ?>">
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header" id="top">
    <div class="topbar">
        <ul class="topbar__list container">
            <li>Established <?= e(cfg('established')) ?></li>
            <li>20+ Years of Art Education</li>
            <li><?= e(cfg('address.city')) ?></li>
        </ul>
    </div>

    <div class="navbar">
        <div class="container navbar__inner">
            <a class="brand" href="index.php" aria-label="<?= e(cfg('site_name')) ?> — Home">
                <img src="assets/logo/kalalaya-logo.png" alt="<?= e(cfg('site_name')) ?> logo" width="250" height="118">
            </a>

            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu">
                <span class="nav-toggle__open"><?= icon('menu') ?></span>
                <span class="nav-toggle__close"><?= icon('close') ?></span>
            </button>

            <nav class="primary-nav" id="primary-nav" aria-label="Main navigation">
                <ul class="nav-list">
                <?php foreach ($nav as $item):
                    [$id, $label, $href] = $item;
                    $sub = $item[3] ?? null;
                    $active = $id === $pid;
                    $cls = 'nav-link' . ($active ? ' is-active' : '');
                    $cur = $active ? ' aria-current="page"' : '';
                ?>
                    <?php if ($sub): ?>
                    <li class="nav-item has-dropdown">
                        <div class="nav-item__row">
                            <a class="<?= $cls ?>" href="<?= e($href) ?>"<?= $cur ?>><?= e($label) ?></a>
                            <button class="dropdown-toggle" type="button" aria-expanded="false" aria-controls="dd-<?= e($id) ?>" aria-label="Show <?= e($label) ?> submenu"><?= icon('chevron') ?></button>
                        </div>
                        <ul class="dropdown" id="dd-<?= e($id) ?>">
                            <?php foreach ($sub as [$sl, $sh]): ?>
                            <li><a href="<?= e($sh) ?>"><?= e($sl) ?></a></li>
                            <?php endforeach; ?>
                        </ul>
                    </li>
                    <?php else: ?>
                    <li class="nav-item"><a class="<?= $cls ?>" href="<?= e($href) ?>"<?= $cur ?>><?= e($label) ?></a></li>
                    <?php endif; ?>
                <?php endforeach; ?>
                </ul>
                <a class="btn btn--primary nav-mobile-cta" href="contact.php#enquiry">Enquire Now</a>
            </nav>

            <a class="btn btn--primary btn--sm header-cta" href="contact.php#enquiry">Enquire Now</a>
        </div>
    </div>
</header>
<div class="nav-backdrop" hidden></div>

<main id="main">
