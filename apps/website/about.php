<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'about',
    'title' => 'About Kalalaya Fine Arts | Art Education in Coimbatore',
    'description' => 'Founded in 2002 by Mr. Anthony Raj, D.F.A., TTC., Kalalaya Fine Arts has nurtured young and adult artists in Coimbatore for over two decades.',
    'path' => 'about.php',
    'footer' => 'pink',
    'og_image' => 'assets/images/about/studio.jpg',
    'jsonld' => breadcrumb_jsonld([['Home', ''], ['About Us', 'about.php']]),
];
require __DIR__ . '/includes/header.php';
$a = cfg('address');
?>

<section class="page-hero">
    <div class="hero-wide-media" aria-hidden="true">
        <img src="assets/images/about/hero-brushes-wide.jpg" width="1108" height="468" alt="">
    </div>
    <div class="container" style="position:relative">
        <div class="page-hero__copy" style="max-width:520px">
            <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="index.php">Home</a></li><li aria-current="page">About Us</li></ol></nav>
            <h1 class="h-display">About Kalalaya<br>Fine Arts</h1>
            <span class="accent-rule" aria-hidden="true"></span>
            <p class="lead">Nurturing Creativity. Inspiring Confidence.<br>Building a Better Tomorrow Through Art.</p>
        </div>
    </div>
</section>

<!-- STORY -->
<section class="section section--white story" id="our-story">
    <div class="container split">
        <div class="media-frame reveal">
            <img src="assets/images/about/studio.jpg" width="698" height="484" alt="The bright Kalalaya Fine Arts studio with easels and student paintings" loading="lazy">
        </div>
        <div class="reveal">
            <span class="eyebrow">Our Story</span>
            <h2 class="h-section">Founded in 2002, Kalalaya Fine Arts has been a beacon of artistic excellence for over two decades.</h2>
            <p>Kalalaya Fine Arts is a leading drawing and painting institute in Coimbatore dedicated to nurturing creativity and artistic expression in students of all ages.</p>
            <p>With more than two decades of experience in art education, we provide structured training for children, teenagers and adults in a supportive and inspiring environment.</p>
            <p>From fundamental drawing techniques to painting, portraiture, professional courses and specialized art forms, our programs are designed to help every student discover their abilities, develop their skills and enjoy the journey of creating art.</p>
            <a class="btn btn--primary btn--sm" href="#founder">Discover Our Story <?= icon('arrow-right') ?></a>
        </div>
    </div>
</section>

<!-- FOUNDER -->
<section class="section section--tight founder" id="founder">
    <div class="container founder__grid">
        <img class="reveal" src="assets/images/about/founder.jpg" width="482" height="380" alt="Mr. Anthony Raj, founder of Kalalaya Fine Arts, at his desk" loading="lazy">
        <div class="reveal">
            <span class="eyebrow">Meet Our Founder</span>
            <h2 class="h-section">Mr. Anthony Raj, D.F.A., TTC.</h2>
            <p>Kalalaya Fine Arts was founded by Mr. Anthony Raj, D.F.A., TTC., an experienced art educator with more than 25 years of involvement in the field of art and creative education.</p>
            <p>He is a passionate artist, professional photographer and graphic designer who has played a vital role in encouraging students to focus on their individuality and creativity.</p>
            <p>His dedication to the art community has resulted in remarkable achievements, including five World Records for unique art attempts such as the largest bean mosaic and the largest national flag made of finger prints, as recognized by Asia Book of Records and Elite Records.</p>
        </div>
    </div>
</section>

<!-- WHY CHOOSE -->
<section class="section section--white">
    <div class="container">
        <div class="section-head center reveal">
            <span class="eyebrow">Why Choose Kalalaya</span>
            <h2 class="h-section">More Than Learning to Draw</h2>
            <p>We create an environment where students learn techniques, discover their creativity and develop confidence through art.</p>
        </div>
        <div class="feature-cards">
            <article class="feature-card reveal"><div class="feature-card__top"><?= icon('trophy') ?><b>01</b></div><h3>20+ Years of Experience</h3><p>Established in 2002 with a long-standing commitment to art education.</p></article>
            <article class="feature-card reveal"><div class="feature-card__top"><?= icon('users') ?><b>02</b></div><h3>From Age 5 to Adults</h3><p>Creative learning opportunities for children, teenagers and adults.</p></article>
            <article class="feature-card reveal"><div class="feature-card__top"><?= icon('user') ?><b>03</b></div><h3>Personal Guidance</h3><p>Learning that encourages individuality, practice and artistic growth.</p></article>
            <article class="feature-card reveal"><div class="feature-card__top"><?= icon('book') ?><b>04</b></div><h3>Wide Range of Courses</h3><p>From foundational drawing to painting, professional and specialized courses.</p></article>
            <article class="feature-card reveal"><div class="feature-card__top"><?= icon('heart') ?><b>05</b></div><h3>A Happy Creative Space</h3><p>A comfortable and inspiring environment where students can experiment and express themselves.</p></article>
        </div>
    </div>
</section>

<!-- VISIT -->
<section class="section section--tight visit">
    <div class="container visit__grid">
        <div class="reveal">
            <h2 class="h-sub">Visit Kalalaya Fine Arts</h2>
            <div class="visit__row">
                <ul class="info-list">
                    <li><?= icon('pin') ?><span><?= e($a['line1']) ?>,<br><?= e($a['line2']) ?>,<br><?= e($a['city']) ?>, <?= e($a['state']) ?> – <?= e($a['postcode']) ?></span></li>
                    <li><?= icon('mail') ?><a href="mailto:<?= e(cfg('email')) ?>"><?= e(cfg('email')) ?></a></li>
                    <li><?= icon('phone') ?><a href="tel:<?= e(cfg('phone_link')) ?>"><?= e(cfg('phone_display')) ?></a></li>
                </ul>
                <a class="btn btn--primary btn--sm" href="<?= e(cfg('maps_url')) ?>" target="_blank" rel="noopener">Get Directions <?= icon('arrow-right') ?></a>
            </div>
        </div>
        <div class="map-embed reveal">
            <iframe src="<?= e(maps_embed_src()) ?>" title="Map: Kalalaya Fine Arts, Coimbatore" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
