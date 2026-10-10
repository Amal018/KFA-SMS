<?php
/**
 * Shared template for the local-search landing pages
 * (drawing-classes-coimbatore.php, painting-classes-coimbatore.php, art-classes-coimbatore.php).
 * Each page sets $L before including this file:
 *   eyebrow, h1, h1_accent, lead, img, img_alt, intro (paragraphs), sections [[h2, [paragraphs], [bullets]?]],
 *   courses (ids from includes/courses.php), faqs [[q, a]], related [[label, url]]
 */
if (!defined('KALALAYA')) { http_response_code(403); exit; }
$allCourses = require __DIR__ . '/courses.php';
$featured = array_values(array_filter($allCourses, fn($c) => in_array($c['id'], $L['courses'], true)));
$a = cfg('address');
?>

<section class="page-hero landing-hero">
    <div class="container page-hero__grid">
        <div class="page-hero__copy">
            <span class="eyebrow"><?= e($L['eyebrow']) ?></span>
            <h1 class="h-display"><?= e($L['h1']) ?> <span class="text-pink"><?= e($L['h1_accent']) ?></span></h1>
            <p class="lead"><?= e($L['lead']) ?></p>
            <ul class="landing-facts">
                <li><?= icon('pin') ?> <?= e($a['line2']) ?>, <?= e($a['city']) ?></li>
                <li><?= icon('calendar') ?> Since <?= e(cfg('established')) ?></li>
                <li><?= icon('users') ?> Age 5 to adults</li>
            </ul>
            <div class="btn-row">
                <button class="btn btn--primary" type="button" data-booking>Reserve a Seat <?= icon('arrow-right') ?></button>
                <a class="btn btn--outline" href="<?= e(cfg('maps_url')) ?>" target="_blank" rel="noopener"><?= icon('pin') ?> Get Directions</a>
            </div>
        </div>
        <div class="page-hero__media brush-media">
            <img src="<?= e($L['img']) ?>" alt="<?= e($L['img_alt']) ?>" width="1000" height="700" fetchpriority="high">
        </div>
    </div>
</section>

<section class="section section--white">
    <div class="container landing-body">
        <article class="landing-article">
            <?php foreach ($L['intro'] as $p): ?><p class="landing-intro"><?= $p ?></p><?php endforeach; ?>
            <?php foreach ($L['sections'] as $s): ?>
            <h2 class="h-sub"><?= e($s[0]) ?></h2>
            <?php foreach ($s[1] as $p): ?><p><?= $p ?></p><?php endforeach; ?>
            <?php if (!empty($s[2])): ?><ul class="tick-list"><?php foreach ($s[2] as $b): ?><li><?= icon('check') ?><span><?= $b ?></span></li><?php endforeach; ?></ul><?php endif; ?>
            <?php endforeach; ?>
        </article>

        <aside class="landing-aside">
            <div class="visit-card">
                <h2 class="h-card">Visit the studio</h2>
                <p><?= e($a['line1']) ?>, <?= e($a['line2']) ?>, <?= e($a['city']) ?> – <?= e($a['postcode']) ?></p>
                <p><?= icon('clock') ?> <?= e(cfg('hours_days')) ?>, <?= e(cfg('hours_time')) ?></p>
                <p><?= icon('phone') ?> <a href="tel:<?= e(cfg('phone_link')) ?>"><?= e(cfg('phone_display')) ?></a></p>
                <div class="map-embed visit-card__map"><iframe src="<?= e(maps_embed_src()) ?>" title="Map to Kalalaya Fine Arts, <?= e($a['line2']) ?>, Coimbatore" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
                <a class="btn btn--primary btn--sm" href="<?= e(cfg('maps_url')) ?>" target="_blank" rel="noopener">Open in Google Maps</a>
            </div>
            <div class="near-card">
                <h2 class="h-card">Nearby areas</h2>
                <p>Families come to us from across north Coimbatore, including:</p>
                <ul class="area-chips"><?php foreach (cfg('areas_served', []) as $ar): ?><li><?= e($ar) ?></li><?php endforeach; ?></ul>
            </div>
        </aside>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-head center reveal">
            <span class="eyebrow">Choose a batch</span>
            <h2 class="h-section">Courses &amp; Timings</h2>
        </div>
        <div class="landing-courses">
            <?php foreach ($featured as $c):
                $times = array_map(fn($s) => trim($s[1] . ' ' . $s[2]), $c['schedule']); ?>
            <article class="card landing-course reveal">
                <img src="assets/images/courses/<?= e($c['img']) ?>.jpg" alt="<?= e($c['alt']) ?>" width="380" height="290" loading="lazy">
                <div class="landing-course__body">
                    <span class="eyebrow"><?= e($c['label']) ?></span>
                    <h3 class="h-card"><?= e($c['name']) ?></h3>
                    <p><?= e($c['focus']) ?></p>
                    <p class="landing-course__time"><?= icon('clock') ?> <?= e(implode(' · ', $times)) ?></p>
                    <a class="arrow-link" href="course-details.php#<?= e($c['id']) ?>">Syllabus &amp; details <?= icon('arrow-right') ?></a>
                </div>
            </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section section--white">
    <div class="container landing-faq">
        <?= render_faq($L['faqs']) ?>
    </div>
</section>

<section class="section">
    <div class="container center">
        <span class="eyebrow">Keep exploring</span>
        <ul class="related-links">
            <?php foreach ($L['related'] as [$label, $url]): ?><li><a class="btn btn--outline btn--sm" href="<?= e($url) ?>"><?= e($label) ?></a></li><?php endforeach; ?>
        </ul>
    </div>
</section>
