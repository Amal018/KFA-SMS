<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'gallery',
    'title' => 'Kalalaya Fine Arts Gallery | Student & Master Artwork',
    'description' => 'Explore artworks by Kalalaya Fine Arts founder Mr. Anthony Raj and the talented students of our drawing and painting classes in Coimbatore.',
    'path' => 'gallery.php',
    'footer' => 'compact',
    'og_image' => 'assets/images/gallery/master-landscape.jpg',
    'scripts' => ['js/gallery.js', 'js/art-wall.js'],
    'crumbs' => [['Home', ''], ['Gallery', 'gallery.php']],
];
require __DIR__ . '/includes/header.php';

/* Master's work — edit/add items here: [image, title, medium, year, alt]
   PLACEHOLDER images: replace with photos of Mr. Anthony Raj's real paintings (same file names), then remove the <span class="sample-tag"> below. */
$masters = [
    ['master-landscape', 'Serene Landscape', 'Acrylic on Canvas', '2023', 'Acrylic landscape of a river winding through trees at sunset'],
    ['master-portrait', 'Graceful Portrait', 'Oil on Canvas', '2022', 'Oil portrait of a woman in traditional jewellery'],
    ['master-still-life', 'Still Life with Flowers', 'Oil on Canvas', '2021', 'Oil still life of flowers in a blue vase with fruit'],
    ['master-horse', 'Majestic Horse', 'Charcoal on Paper', '2020', 'Charcoal drawing of a horse’s head'],
];
?>

<section class="hero">
    <div class="container hero__grid">
        <div class="hero__copy">
            <span class="eyebrow">Kalalaya Fine Arts • Gallery</span>
            <h1 class="h-display">Our Art <span class="text-pink">Gallery</span></h1>
            <p class="muted">Explore a collection of inspiring artworks created by our master and talented students. Each piece reflects creativity, learning and the unique artistic journey at Kalalaya.</p>
        </div>
        <div class="hero__media brush-media">
            <img src="assets/images/gallery/hero-brushes.jpg" width="652" height="362" alt="A table covered with paints, brushes and art supplies" fetchpriority="high">
        </div>
    </div>
    <nav class="container gallery-tabs" aria-label="Gallery sections" style="margin-top:32px">
        <a class="btn btn--primary btn--sm" href="#masters-work">Master’s Work</a>
        <a class="btn btn--outline btn--sm" href="#student-gallery" style="background:#fff">Student Gallery</a>
        <a class="btn btn--outline btn--sm" href="#students-work" style="background:#fff">Students Work</a>
    </nav>
</section>

<section class="section" id="masters-work">
    <div class="container">
        <div class="section-head reveal">
            <span class="eyebrow">Master’s Work</span>
            <h2 class="h-section">Art by Our Master</h2>
            <p class="muted" style="margin-top:10px">A glimpse into the creative world of our founder, Mr Anthony Raj.</p>
        </div>
        <ul class="master-grid" data-lightbox-group="masters">
            <?php foreach ($masters as [$img, $title, $medium, $year, $alt]): ?>
            <li class="reveal">
                <figure class="art-card">
                    <button class="art-card__img" type="button" data-lightbox="assets/images/gallery/<?= $img ?>.jpg" data-caption="<?= e($title) ?>" data-sub="<?= e("$medium · $year") ?>" aria-label="View larger: <?= e($title) ?>"><img src="assets/images/gallery/<?= $img ?>.jpg" width="420" height="394" alt="<?= e($alt) ?>" loading="lazy"><span class="sample-tag">Sample</span></button>
                    <figcaption><h3><?= e($title) ?></h3><p><?= e($medium) ?><span>|</span><?= e($year) ?></p></figcaption>
                </figure>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>

<div class="container"><hr class="divider"></div>

<?php
/* STUDENT GALLERY — built from the student-gallery/ folder (see student-gallery/README.txt).
   Each sub-folder is a category; every image inside it appears here automatically. */
$galleryCats = gallery_categories();
$galleryTotal = array_sum(array_map(fn($c) => count($c['images']), $galleryCats));
?>
<section class="section" id="student-gallery">
    <div class="container">
        <div class="section-head reveal">
            <span class="eyebrow">Student Gallery</span>
            <h2 class="h-section">Every Medium, Every Age</h2>
            <p class="muted" style="margin-top:10px;max-width:520px">Choose a category, then hover over or tap a piece to see who made it. Click to view it larger.</p>
        </div>
        <?php if ($galleryTotal): ?>
        <div class="art-filters" role="group" aria-label="Filter artworks by category" data-gallery-filters>
            <button type="button" data-cat="all" aria-pressed="true">All <span class="art-filters__n"><?= $galleryTotal ?></span></button>
            <?php foreach ($galleryCats as $c): ?>
            <button type="button" data-cat="<?= e($c['slug']) ?>" aria-pressed="false"><?= e($c['name']) ?> <span class="art-filters__n"><?= count($c['images']) ?></span></button>
            <?php endforeach; ?>
        </div>
        <ul class="art-wall" data-gallery data-lightbox-group="wall" aria-live="polite">
            <?php foreach ($galleryCats as $c): foreach ($c['images'] as $img):
                $label = $img['title'] . ($img['student'] ? ' by ' . $img['student'] : ''); ?>
            <li class="art-wall__item" data-cat="<?= e($c['slug']) ?>">
                <button type="button" class="art-wall__btn" data-lightbox="<?= e($img['src']) ?>" data-caption="<?= e($img['title'] . ($img['student'] ? ' — ' . $img['student'] : '')) ?>" data-sub="<?= e($c['name']) ?>" aria-label="View larger: <?= e($label) ?>">
                    <img src="<?= e($img['src']) ?>" alt="<?= e($label) ?>" loading="lazy"<?= $img['w'] ? ' width="' . $img['w'] . '" height="' . $img['h'] . '"' : '' ?>>
                    <span class="art-wall__tip"><b><?= e($img['title']) ?></b><?= e(($img['student'] ? $img['student'] . ' · ' : '') . $c['name']) ?></span>
                </button>
            </li>
            <?php endforeach; endforeach; ?>
        </ul>
        <div class="center" style="margin-top:26px"><button type="button" class="btn btn--outline" data-gallery-more hidden>Show more artwork</button></div>
        <?php else: ?>
        <p class="gallery-empty">Student artwork will be added soon.</p>
        <?php endif; ?>
    </div>
</section>

<div class="container"><hr class="divider"></div>

<section class="section" id="students-work">
    <div class="container">
        <div class="section-head reveal">
            <span class="eyebrow">Students Work</span>
            <h2 class="h-section">Our Talented Students</h2>
            <p class="muted" style="margin-top:10px;max-width:440px">Discover the creativity and hard work of our amazing students across various age groups and courses.</p>
        </div>

        <!-- Cards are generated by js/gallery.js from the talented-students/ folder (see its README.txt) -->
        <?= talented_students_script() ?>
        <ul class="student-grid" id="student-grid" aria-live="polite"></ul>
        <noscript><p class="gallery-empty">Please enable JavaScript to browse the student gallery.</p></noscript>
        <nav class="pagination" id="student-pagination" aria-label="Student gallery pages"></nav>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
