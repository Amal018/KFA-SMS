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

/* Menu. Sub-items: [label, link, short hint]; a one-item array ['Heading'] starts a group. */
$courseMenu = [['All Courses', 'courses.php', 'Every programme at a glance'], ['Timings & Syllabus', 'course-details.php', 'Batches, days and topics'], ['By age group']];
foreach (require __DIR__ . '/courses.php' as $c) $courseMenu[] = [$c['name'], 'course-details.php#' . $c['id'], $c['slider']];
$nav = [
    ['home', 'Home', 'index.php'],
    ['about', 'About Us', 'about.php'],
    ['courses', 'Courses', 'courses.php', $courseMenu],
    ['achievements', 'Achievements', 'achievements.php'],
    ['events', 'Events', 'events.php'],
    ['gallery', 'Gallery', 'gallery.php', [
        ["Master’s Work", 'gallery.php#masters-work', 'Paintings by our founder'],
        ['Student Artwork', 'gallery.php#student-gallery', 'Browse by category'],
        ['Talented Students', 'gallery.php#students-work', 'Meet our young artists'],
    ]],
    ['contact', 'Contact', 'contact.php'],
];
$crumbs = array_values($page['crumbs'] ?? []);
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
<meta name="theme-color" content="#5236D9">

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

<!-- Fonts: Fraunces (headings), Plus Jakarta Sans (UI), Caveat (hand-written accents) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Caveat:wght@500;700&display=swap">

<link rel="stylesheet" href="css/style.css?v=1.0">
<link rel="stylesheet" href="css/responsive.css?v=1.0">
<link rel="stylesheet" href="css/motion.css?v=3.0">
<link rel="stylesheet" href="css/theme.css?v=3.5">

<script type="application/ld+json"><?= org_jsonld() ?></script>
<?php if (!empty($page['jsonld'])): ?><script type="application/ld+json"><?= $page['jsonld'] ?></script>
<?php endif; ?>
<?php $ldCrumbs = array_values(array_filter($crumbs, fn($c) => $c[1] !== '' || $c[0] === 'Home'));
if (count($ldCrumbs) > 1): ?><script type="application/ld+json"><?= breadcrumb_jsonld($ldCrumbs) ?></script>
<?php endif; ?>
</head>
<body class="page-<?= e($pid) ?>">
<a class="skip-link" href="#main">Skip to content</a>
<div class="scroll-progress" aria-hidden="true"></div>

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
                            <?php foreach ($sub as $s): if (count($s) === 1): ?>
                            <li class="dropdown__heading" aria-hidden="true"><?= e($s[0]) ?></li>
                            <?php else: ?>
                            <li><a href="<?= e($s[1]) ?>"><span class="dropdown__label"><?= e($s[0]) ?></span><?php if (!empty($s[2])): ?><span class="dropdown__hint"><?= e($s[2]) ?></span><?php endif; ?></a></li>
                            <?php endif; endforeach; ?>
                        </ul>
                    </li>
                    <?php else: ?>
                    <li class="nav-item"><a class="<?= $cls ?>" href="<?= e($href) ?>"<?= $cur ?>><?= e($label) ?></a></li>
                    <?php endif; ?>
                <?php endforeach; ?>
                </ul>
                <a class="btn btn--primary nav-mobile-cta" href="contact.php#enquiry" data-booking>Reserve a Seat</a>
            </nav>

            <a class="btn btn--primary btn--sm header-cta" href="contact.php#enquiry" data-booking>Reserve a Seat</a>
        </div>
    </div>
</header>
<div class="nav-backdrop" hidden></div>

<main id="main">
<?php if (count($crumbs) > 1): ?>
<nav class="crumbs" aria-label="Breadcrumb">
    <ol class="container">
        <?php foreach ($crumbs as $i => [$label, $href]): $last = $i === count($crumbs) - 1; ?>
        <li><?php if ($last): ?><span aria-current="page"><?= e($label) ?></span><?php else: ?><a href="<?= e($href === '' ? 'index.php' : $href) ?>"><?php if ($i === 0): ?><?= icon('home') ?><?php endif; ?><?= e($label) ?></a><?php endif; ?></li>
        <?php endforeach; ?>
    </ol>
</nav>
<?php endif; ?>
