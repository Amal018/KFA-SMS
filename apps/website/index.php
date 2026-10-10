<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'home',
    'title' => 'Kalalaya Fine Arts | Drawing & Painting Institute in Coimbatore',
    'description' => 'Kalalaya Fine Arts, Coimbatore — drawing, painting and fine arts classes for kids, teenagers and adults since 2002. Explore courses and enquire today.',
    'path' => '',
    'footer' => 'simple',
];
require __DIR__ . '/includes/header.php';
?>

<!-- HERO -->
<section class="hero">
    <div class="container hero__grid">
        <div class="hero__copy">
            <span class="eyebrow">Kalalaya Fine Arts • Coimbatore</span>
            <h1 class="h-display">Where Imagination<br><span class="text-pink">Becomes Art</span></h1>
            <p class="lead">Learn Drawing, Painting and Fine Arts in a creative, encouraging environment where every learner is inspired to explore, create and grow.</p>
            <p class="muted">From children taking their first artistic steps to adults exploring their passion, our programs are designed for every stage of the artistic journey.</p>
            <div class="btn-row">
                <a class="btn btn--primary" href="courses.php">Explore Courses <?= icon('arrow-right') ?></a>
                <a class="btn btn--outline" href="contact.php#enquiry">Enquire Now</a>
            </div>
            <ul class="hero-stats">
                <li><?= icon('calendar') ?> Established 2002</li>
                <li><?= icon('star') ?> 20+ Years Experience</li>
                <li><?= icon('users') ?> Age 5 to Adults</li>
            </ul>
        </div>
        <div class="hero__media brush-media">
            <img src="assets/images/hero/hero-girl-painting.jpg" width="794" height="594" alt="Young girl painting a colourful canvas on an easel in the Kalalaya studio" fetchpriority="high">
        </div>
    </div>
</section>

<!-- ABOUT -->
<section class="section home-about">
    <div class="container split">
        <div class="media-frame reveal">
            <img src="assets/images/about/brushes-table.jpg" width="668" height="424" alt="Paint brushes in glass jars beside a watercolour palette" loading="lazy">
        </div>
        <div class="reveal">
            <span class="eyebrow">About Kalalaya</span>
            <h2 class="h-section">A Place Where Creativity<br>Has No Limits</h2>
            <p>Established in 2002, Kalalaya Fine Arts is a leading drawing and painting institute in Coimbatore dedicated to nurturing creativity and artistic expression.</p>
            <p class="muted">With more than two decades of experience in art education, we provide structured training for children, teenagers and adults in a supportive environment.</p>
            <a class="btn btn--outline" href="about.php">Discover Our Story <?= icon('arrow-right') ?></a>
        </div>
    </div>
</section>

<!-- COURSES -->
<section class="section" style="padding-top:0">
    <div class="container">
        <div class="section-head section-head--split reveal">
            <div>
                <span class="eyebrow">Our Courses</span>
                <h2 class="h-section">Explore Our Courses</h2>
            </div>
            <p>From foundational drawing to advanced art forms, we offer programs for every age and interest.</p>
        </div>
        <div class="course-cards">
            <a class="card course-card reveal" href="course-details.php?category=kids">
                <img src="assets/images/courses/card-kids.jpg" width="422" height="188" alt="Young girl drawing at a table" loading="lazy">
                <div class="course-card__body"><div><h3>Kids Art Classes</h3><span class="course-card__age">Ages 5 – 7</span></div><span class="round-arrow"><?= icon('arrow-right') ?></span></div>
            </a>
            <a class="card course-card reveal" href="course-details.php?category=young-artists">
                <img src="assets/images/courses/card-drawing.jpg" width="400" height="188" alt="Boy sketching with coloured pencils" loading="lazy">
                <div class="course-card__body"><div><h3>Drawing &amp; Painting</h3><span class="course-card__age">Ages 8 – 12</span></div><span class="round-arrow"><?= icon('arrow-right') ?></span></div>
            </a>
            <a class="card course-card reveal" href="course-details.php?category=teen-artists">
                <img src="assets/images/courses/card-teen.jpg" width="428" height="188" alt="Teenage student sketching in class" loading="lazy">
                <div class="course-card__body"><div><h3>Teen Art Classes</h3><span class="course-card__age">Ages 13 – 18</span></div><span class="round-arrow"><?= icon('arrow-right') ?></span></div>
            </a>
            <a class="card course-card reveal" href="course-details.php?category=short-term">
                <img src="assets/images/courses/card-adult.jpg" width="388" height="188" alt="Adult learner painting at the studio" loading="lazy">
                <div class="course-card__body"><div><h3>Adult Art Classes</h3><span class="course-card__age">Ages 18+</span></div><span class="round-arrow"><?= icon('arrow-right') ?></span></div>
            </a>
        </div>
    </div>
</section>

<!-- GALLERY + ACHIEVEMENTS -->
<section class="section" style="padding-top:0">
    <div class="container showcase">
        <div class="showcase-gallery reveal">
            <img src="assets/images/gallery/landscape-canvas.jpg" width="500" height="394" alt="Student landscape painting of a river at sunset" loading="lazy">
            <div class="showcase-gallery__copy">
                <span class="eyebrow">Student Gallery</span>
                <h2 class="h-sub">Art That Inspires</h2>
                <p>Discover the creativity and talent of our students through their amazing artwork.</p>
                <a class="btn btn--outline" href="gallery.php">View Gallery <?= icon('arrow-right') ?></a>
            </div>
        </div>
        <div class="stat-panel reveal">
            <span class="eyebrow">Our Achievements</span>
            <div class="stat-grid">
                <div><strong>2002</strong><span>Established</span></div>
                <div><strong>20+</strong><span>Years of Experience</span></div>
                <div><strong>5 +</strong><span>Age Group</span></div>
                <div><strong>1000 +</strong><span>Students</span></div>
            </div>
        </div>
    </div>
</section>

<!-- CTA -->
<section class="cta-band">
    <img class="cta-band__brush cta-band__brush--l" src="assets/images/decor/brush-stroke.svg" alt="" aria-hidden="true" width="120" height="100" loading="lazy">
    <img class="cta-band__flourish" src="assets/images/decor/signature-flourish.svg" alt="" aria-hidden="true" width="120" height="70" loading="lazy">
    <div class="container cta-band__inner cta-band__inner--stack">
        <h2 class="h-section">Ready to Begin Your<br>Artistic Journey?</h2>
        <span class="cta-band__divider" aria-hidden="true"></span>
        <div>
            <p class="cta-band__text">Explore our courses or speak with Kalalaya Fine Arts to find the right program for you.</p>
            <div class="btn-row">
                <a class="btn btn--primary btn--sm" href="courses.php">Explore Courses <?= icon('arrow-right') ?></a>
                <a class="btn btn--outline btn--sm" href="contact.php">Contact Us</a>
            </div>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
