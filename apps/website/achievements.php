<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'achievements',
    'title' => 'Achievements | Kalalaya Fine Arts',
    'description' => 'Founder Mr. Anthony Raj’s five World Record achievements, recognitions and the accomplishments of Kalalaya Fine Arts students in Coimbatore.',
    'path' => 'achievements.php',
    'footer' => 'full',
    'og_image' => 'assets/images/achievements/hero-certificate.jpg',
    'scripts' => ['js/achievements.js'],
    'jsonld' => breadcrumb_jsonld([['Home', ''], ['Achievements', 'achievements.php']]),
];
require __DIR__ . '/includes/header.php';

/* SAMPLE certificates — the images in assets/images/achievements/certificate-*.jpg
   are taken from the design mockup and are NOT real certificates. Each one is
   overlaid with a "Sample" tag. Replace them with real scans (same file names),
   update the captions below, then delete the  <span class="sample-tag">  lines. */
$certs = [
    ['certificate-01.jpg', 'World Record Certificate (sample placeholder)'],
    ['certificate-02.jpg', 'Recognition Certificate (sample placeholder)'],
    ['certificate-03.jpg', 'Achievement Certificate (sample placeholder)'],
];
$milestones = [
    ['certificate-04.jpg', 'Certificate (sample placeholder)'],
    ['certificate-05.jpg', 'Certificate (sample placeholder)'],
    ['certificate-06.jpg', 'Certificate (sample placeholder)'],
    ['certificate-07.jpg', 'Certificate (sample placeholder)'],
    ['milestone-sketch.jpg', 'Portrait sketch'],
    ['milestone-boy.jpg', 'Student with certificate'],
];
?>

<section class="hero">
    <div class="container hero__grid">
        <div class="hero__copy">
            <span class="eyebrow">Our Achievements</span>
            <h1 class="h-display">A Legacy of<br>Artistic Excellence</h1>
            <span class="accent-rule" aria-hidden="true"></span>
            <p>A journey shaped by creativity, dedication and remarkable milestones in the world of art and art education.</p>
        </div>
        <div class="hero__media brush-media">
            <img src="assets/images/achievements/hero-certificate.jpg" width="832" height="420" alt="Framed certificate beside a jar of paint brushes" fetchpriority="high">
        </div>
    </div>
</section>

<section class="section section--white section--tight">
    <div class="container section-head center reveal" style="margin-bottom:0">
        <span class="eyebrow">Our Journey</span>
        <h2 class="h-section">Celebrating Creativity, Dedication &amp; Excellence</h2>
        <p>At Kalalaya Fine Arts, achievements are a reflection of passion, perseverance and the encouragement to explore artistic possibilities beyond the classroom.</p>
    </div>
</section>

<section class="section section--pink section--tight" id="founder-achievements">
    <div class="container split">
        <div class="reveal">
            <h2 class="h-section">Founder<br>Achievements</h2>
            <p class="muted" style="margin-top:14px;max-width:440px">Our founder, Mr. Anthony Raj, has achieved recognition for remarkable artistic initiatives and world-record attempts, reflecting a long-standing commitment to creativity and excellence.</p>
            <span class="badge"><?= icon('trophy') ?> 5 World Record Achievements</span><br>
            <button class="btn btn--primary btn--sm" type="button" id="view-certificate">View Certificate <?= icon('arrow-right') ?></button>
        </div>
        <div class="cert-carousel reveal" data-lightbox-group="certs">
            <button class="cert-nav" type="button" data-cert-prev aria-label="Previous certificate"><?= icon('arrow-left') ?></button>
            <button class="cert-main" type="button" id="cert-main" aria-label="Enlarge certificate">
                <img id="cert-main-img" src="assets/images/achievements/<?= $certs[0][0] ?>" alt="<?= e($certs[0][1]) ?>" width="741" height="633">
                <span class="sample-tag">Sample</span>
            </button>
            <div class="cert-side">
                <?php foreach ($certs as $i => [$f, $cap]): ?>
                <button type="button" data-cert-index="<?= $i ?>" data-lightbox="assets/images/achievements/<?= $f ?>" data-caption="<?= e($cap) ?>" class="<?= $i === 0 ? 'is-current' : '' ?>" aria-label="Show <?= e($cap) ?>"><img src="assets/images/achievements/<?= $f ?>" alt="" width="342" height="267" loading="lazy"><span class="sample-tag">Sample</span></button>
                <?php endforeach; ?>
            </div>
            <button class="cert-nav" type="button" data-cert-next aria-label="Next certificate"><?= icon('arrow-right') ?></button>
        </div>
    </div>
</section>

<section class="big-stat">
    <div class="container reveal">
        <span class="big-stat__num">5</span>
        <h2>World Record Achievements</h2>
        <p>A remarkable testament to creativity, dedication and artistic excellence.</p>
    </div>
</section>

<section class="section section--pink section--tight">
    <div class="container milestones">
        <div class="reveal">
            <span class="eyebrow">Recognition</span>
            <h2 class="h-section">Milestones Worth<br>Celebrating</h2>
        </div>
        <ul class="thumb-grid reveal" data-lightbox-group="milestones">
            <?php foreach ($milestones as [$f, $cap]): ?>
            <li><button class="thumb" type="button" data-lightbox="assets/images/achievements/<?= $f ?>" data-caption="<?= e($cap) ?>" aria-label="View larger: <?= e($cap) ?>"><img src="assets/images/achievements/<?= $f ?>" alt="<?= e($cap) ?>" width="429" height="210" loading="lazy"><?php if (str_starts_with($f, 'certificate')): ?><span class="sample-tag">Sample</span><?php endif; ?></button></li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>

<section class="section section--pink section--tight" style="border-top:1px solid #fff" id="student-achievers">
    <div class="container achievers">
        <div class="reveal">
            <span class="eyebrow">Student Achievers</span>
            <h2 class="h-section">Proud of Every<br>Young Artist</h2>
            <p>Our students have participated in drawing and painting competitions and events beyond the classroom, earning certificates, medals and recognition for their creativity and dedication.</p>
            <a class="btn btn--primary btn--sm" href="gallery.php#students-work">View Student Achievements <?= icon('arrow-right') ?></a>
        </div>
        <ul class="collage reveal" data-lightbox-group="achievers">
            <?php foreach ([['achiever-girl', 'Student holding a certificate and medal'], ['achiever-sunset', 'Student painting of a tree at sunset'], ['achiever-medal', 'Medal awarded to a student'], ['achiever-sketch', 'Student pencil portrait'], ['achiever-boy', 'Young student with his award-winning painting']] as [$f, $alt]): ?>
            <li style="display:contents"><button class="thumb" type="button" data-lightbox="assets/images/achievements/<?= $f ?>.jpg" data-caption="<?= e($alt) ?>" aria-label="View larger: <?= e($alt) ?>"><img src="assets/images/achievements/<?= $f ?>.jpg" alt="<?= e($alt) ?>" width="350" height="332" loading="lazy"></button></li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>

<section class="quote-banner">
    <img src="assets/images/about/hero-brushes-wide.jpg" alt="" width="1108" height="468" loading="lazy">
    <p>Every Achievement Begins With<br>a Passion to Create.</p>
</section>

<section class="cta-pink">
    <div class="container cta-pink__inner">
        <div>
            <h2>Begin Your Own Creative Journey</h2>
            <p>Discover the courses and learning opportunities available at Kalalaya Fine Arts.</p>
        </div>
        <div class="btn-row">
            <a class="btn btn--white btn--sm" href="courses.php">Explore Courses</a>
            <a class="btn btn--ghost-white btn--sm" href="contact.php">Contact Us</a>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
