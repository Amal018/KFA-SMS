<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'courses',
    'title' => 'Drawing & Painting Courses in Coimbatore | Kalalaya Fine Arts',
    'description' => 'Art courses for kids (5–7), young artists (8–12), teens (13–18), professional Tamil Nadu Govt. Technical Examination training and short-term courses in Coimbatore.',
    'path' => 'courses.php',
    'footer' => 'full',
    'og_image' => 'assets/images/courses/cat-kids.jpg',
    'crumbs' => [['Home', ''], ['Courses', 'courses.php']],
];
require __DIR__ . '/includes/header.php';

$cats = [
    ['kids', 'Kids', 'Ages 5–7', 'Colouring and pencil drawing &amp; colouring.', 'Explore Kids Courses', 'cat-kids', 'Two young girls colouring with markers and crayons'],
    ['young-artists', 'Young Artists', 'Ages 8–12', 'Drawing Fundamentals, Designs, 3D Objects, Shading, Portraits, Cartoons.', 'Explore Courses', 'cat-young', 'Young girl drawing with coloured pencils'],
    ['teen-artists', 'Teen Artists', 'Ages 13–18', 'Watercolour, Oil Painting, Acrylic Painting, Portrait, Landscape, Charcoal, Mandala, Perspective.', 'Explore Courses', 'cat-teen', 'Student sketching on white paper'],
    ['professional', 'Professional Courses', '', 'Tamil Nadu Government Technical Examination, Fashion Sketching, Illustration.', 'View Courses', 'cat-professional', 'Artist drawing a detailed pencil portrait'],
    ['short-term', 'Short-Term Courses', '', 'Glass Painting, Tanjore Glass Reverse Painting, Mural Work, Portrait, Still Life, Mandala Art.', 'Explore Courses', 'cat-short-term', 'Hand painting colourful flowers'],
];
?>

<section class="page-hero">
    <div class="container container--wide page-hero__grid">
        <div class="page-hero__copy">
            <h1 class="h-display">Our Courses</h1>
            <p class="page-hero__sub">A Creative Journey for Every Age</p>
            <p>Whether your child is discovering art for the first time, a teenager wants to develop advanced skills, or an adult wants to explore a creative passion, there is a place for you at Kalalaya.</p>
        </div>
        <div class="page-hero__media brush-media">
            <img src="assets/images/hero/hero-girl-painting.jpg" width="794" height="594" alt="Young girl painting with a pink paint brush" fetchpriority="high">
        </div>
    </div>
</section>

<section class="section">
    <div class="container container--wide">
        <div class="section-head center reveal">
            <span class="eyebrow">Course Categories</span>
            <h2 class="h-section">Choose Your Creative Path</h2>
            <p>Explore our range of courses designed for kids, teenagers and adults, from foundational techniques to professional and specialized art forms.</p>
        </div>
        <div class="category-cards">
            <?php foreach ($cats as [$slug, $title, $age, $text, $cta, $img, $alt]): ?>
            <article class="card category-card reveal">
                <img src="assets/images/courses/<?= $img ?>.jpg" width="344" height="234" alt="<?= e($alt) ?>" loading="lazy">
                <div class="category-card__body">
                    <h3><?= e($title) ?></h3>
                    <?php if ($age): ?><p class="age"><?= e($age) ?></p><?php else: ?><div style="height:10px"></div><?php endif; ?>
                    <p><?= $text ?></p>
                    <a class="arrow-link" href="course-details.php?category=<?= $slug ?>"><?= e($cta) ?> <?= icon('arrow-right') ?><span class="visually-hidden"> — <?= e($title) ?></span></a>
                </div>
            </article>
            <?php endforeach; ?>
        </div>

        <div class="practice-banner mt-lg reveal" style="margin-top:44px">
            <span class="practice-banner__icon"><?= icon('target') ?></span>
            <div>
                <h2 class="h-sub">Learning Through Practice</h2>
                <p>Our courses focus on building strong fundamentals, nurturing creativity and developing confidence through regular practice and expert guidance.</p>
            </div>
            <a class="btn btn--primary" href="contact.php#enquiry">Enquire Now <?= icon('arrow-right') ?></a>
        </div>
    </div>
</section>

<section class="section adults" style="padding-top:0">
    <div class="container container--wide split">
        <div class="media-frame reveal">
            <img src="assets/images/courses/adult-homemaker.jpg" width="686" height="336" alt="Woman painting on an easel in a studio" loading="lazy">
        </div>
        <div class="reveal">
            <span class="eyebrow">For Adults &amp; Homemakers</span>
            <h2 class="h-section">It’s Never Too Late to Start Creating</h2>
            <p>Art has no age limit. Our short-term courses provide adults, homemakers, hobby artists and beginners with a welcoming space to learn, experiment and enjoy the creative process.</p>
            <a class="btn btn--primary btn--sm" href="course-details.php?category=short-term">Explore Short-Term Courses <?= icon('arrow-right') ?></a>
        </div>
    </div>
</section>

<section class="cta-pink">
    <div class="container container--wide cta-pink__inner">
        <div>
            <h2>Ready to Begin Your Creative Journey?</h2>
            <p>Whether you're looking for a creative beginning for your child or a new artistic passion for yourself, Kalalaya Fine Arts welcomes you.</p>
        </div>
        <div class="btn-row">
            <a class="btn btn--white btn--sm" href="course-details.php">Explore Courses</a>
            <a class="btn btn--ghost-white btn--sm" href="contact.php">Contact Us</a>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
