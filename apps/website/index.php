<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
start_session();   // token for the Digital Easel lead form (save-lead.php)
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
$page = [
    'id' => 'home',
    'title' => 'Drawing, Painting & Art Classes in Coimbatore | Kalalaya Fine Arts',
    'description' => 'Kalalaya Fine Arts, Coimbatore — drawing, painting and fine arts classes for kids, teenagers and adults since 2002. Explore courses and enquire today.',
    'path' => '',
    'footer' => 'simple',
    'scripts' => ['js/home.js', 'js/easel.js'],
];
$courses = require __DIR__ . '/includes/courses.php';
require __DIR__ . '/includes/header.php';
?>

<!-- HERO -->
<section class="hero hero--home">
    <div class="container hero__grid">
        <div class="hero__copy">
            <span class="eyebrow anim-rise" style="--d:0">Drawing &amp; Painting Classes in Coimbatore</span>
            <h1 class="h-display split-text">Where Imagination<br><span class="text-pink">Becomes Art</span></h1>
            <p class="lead anim-rise" style="--d:5">Learn Drawing, Painting and Fine Arts in a creative, encouraging environment where every learner is inspired to explore, create and grow.</p>
            <p class="muted anim-rise" style="--d:6">From children taking their first artistic steps to adults exploring their passion, our programs are designed for every stage of the artistic journey.</p>
            <div class="btn-row anim-rise" style="--d:7">
                <button class="btn btn--primary" type="button" data-booking>Reserve a Seat <?= icon('arrow-right') ?></button>
                <a class="btn btn--outline" href="courses.php">Explore Courses</a>
            </div>
            <ul class="hero-stats anim-rise" style="--d:8">
                <li><?= icon('calendar') ?> Established 2002</li>
                <li><?= icon('star') ?> 20+ Years Experience</li>
                <li><?= icon('pin') ?> Maniyakarampalayam, Coimbatore</li>
            </ul>
        </div>
        <div class="hero__media hero-stage anim-pop">
            <div class="hero-stage__blob" aria-hidden="true"></div>
            <img class="hero-stage__img" src="assets/images/hero/hero-girl-painting.jpg" width="794" height="594" alt="Young girl painting with a pink paint brush" fetchpriority="high">
            <!-- Floating art tools (parallax) -->
            <span class="float-tool float-tool--palette" data-depth="28" aria-hidden="true">
                <svg viewBox="0 0 64 64"><path d="M32 6C17 6 6 16.5 6 30c0 12 9.5 22 22 22 3 0 4.5-1.6 4.5-3.6 0-2.5-2.3-3.3-2.3-5.6 0-2.6 2.2-4 5-4H41c9.5 0 17-6 17-15C58 13.5 46.5 6 32 6z" fill="#fff" stroke="#1B2330" stroke-width="2"/><circle cx="20" cy="22" r="4.5" fill="#FF6B4A"/><circle cx="32" cy="16" r="4.5" fill="#FFB703"/><circle cx="44" cy="21" r="4.5" fill="#3A86FF"/><circle cx="17" cy="35" r="4.5" fill="#06D6A0"/></svg>
            </span>
            <span class="float-tool float-tool--brush" data-depth="-36" aria-hidden="true">
                <svg viewBox="0 0 64 64"><path d="M44 6l14 14-24 24-14-14z" fill="#FFB703" stroke="#1B2330" stroke-width="2" stroke-linejoin="round"/><path d="M20 30l14 14-6 6c-4 4-11 6-18 8 2-7 4-14 8-18z" fill="#FF6B4A" stroke="#1B2330" stroke-width="2" stroke-linejoin="round"/></svg>
            </span>
            <span class="float-tool float-tool--pencil" data-depth="20" aria-hidden="true">
                <svg viewBox="0 0 64 64"><path d="M46 6l12 12L22 54l-14 4 4-14z" fill="#3A86FF" stroke="#1B2330" stroke-width="2" stroke-linejoin="round"/><path d="M12 44l8 8M40 12l12 12" stroke="#1B2330" stroke-width="2"/><path d="M8 58l3-10 7 7z" fill="#1B2330"/></svg>
            </span>
            <span class="float-tool float-tool--drop" data-depth="-18" aria-hidden="true">
                <svg viewBox="0 0 64 64"><path d="M32 6s18 20 18 33a18 18 0 0 1-36 0C14 26 32 6 32 6z" fill="#06D6A0" stroke="#1B2330" stroke-width="2"/></svg>
            </span>
        </div>
    </div>
    <a class="scroll-cue" href="#easel" aria-label="Scroll to the drawing canvas"><span></span></a>
</section>

<!-- RUNNING MARQUEE -->
<div class="marquee" aria-hidden="true">
    <div class="marquee__track">
        <?php for ($i = 0; $i < 2; $i++): ?>
        <span>Pencil Drawing</span><span>Watercolour</span><span>Oil Painting</span><span>Acrylic</span><span>Tanjore Glass Painting</span><span>Mandala Art</span><span>Portraits</span><span>Charcoal</span><span>Fashion Sketching</span><span>Mural Work</span>
        <?php endfor; ?>
    </div>
</div>

<!-- DIGITAL EASEL — interactive drawing canvas (js/easel.js) -->
<section class="section easel-section" id="easel" aria-labelledby="easel-title">
    <div class="container">
        <div class="section-head center reveal">
            <span class="eyebrow">Try It Yourself</span>
            <h2 class="h-section" id="easel-title">The Kalalaya <span class="text-pink">Digital Easel</span></h2>
            <p>Pick a colour and a brush, then draw with your mouse, finger or stylus. Turn on Mandala mode for instant symmetry, or trace a guide shape like our youngest artists do.</p>
        </div>

        <div class="easel reveal" data-easel>
            <div class="easel__toolbar" role="toolbar" aria-label="Drawing tools">
                <div class="easel__group">
                    <span class="easel__label">Colours</span>
                    <div class="easel__swatches" role="radiogroup" aria-label="Colour">
                        <?php foreach ([['#1E1B3A', 'Ink'], ['#5236D9', 'Indigo'], ['#2F80ED', 'Sky blue'], ['#10B3A3', 'Teal'], ['#3BB273', 'Leaf green'], ['#F5C518', 'Sunflower'], ['#FFA41B', 'Marigold'], ['#FF6B4A', 'Coral'], ['#E5383B', 'Red'], ['#E84393', 'Rose'], ['#8E5B3A', 'Earth brown'], ['#FFFFFF', 'White']] as $i => [$hex, $name]): ?>
                        <button type="button" class="swatch" role="radio" aria-checked="<?= $i === 1 ? 'true' : 'false' ?>" data-color="<?= $hex ?>" style="--c:<?= $hex ?>" aria-label="<?= e($name) ?>" title="<?= e($name) ?>"></button>
                        <?php endforeach; ?>
                        <label class="swatch swatch--custom" title="Any colour"><input type="color" value="#5236D9" aria-label="Pick any colour" data-color-input><span aria-hidden="true">+</span></label>
                    </div>
                </div>

                <div class="easel__group">
                    <span class="easel__label">Brush</span>
                    <div class="easel__tools" role="radiogroup" aria-label="Brush">
                        <?php foreach ([['pencil', 'Pencil', '<path d="M4 20l1.5-5.5L16 4l4 4L9.5 18.5z"/><path d="M14 6l4 4"/>'], ['marker', 'Marker', '<path d="M9 15l-4 5h5l2-2"/><path d="M8 14l7-10 5 5-10 7z"/>'], ['water', 'Watercolour', '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'], ['crayon', 'Crayon', '<path d="M5 19l3-1 11-11-2-2L6 16z"/><path d="M14 6l3 3M4 20h4"/>'], ['spray', 'Spray', '<rect x="8" y="9" width="8" height="12" rx="2"/><path d="M10 9V6h4v3M12 3h.01M16 4h.01M18 2h.01M18 6h.01"/>'], ['eraser', 'Eraser', '<path d="M7 21h10M4 14l9-9 7 7-7 7H8z"/><path d="M9 9l7 7"/>']] as $i => [$id, $label, $svg]): ?>
                        <button type="button" class="tool" role="radio" aria-checked="<?= $i === 1 ? 'true' : 'false' ?>" data-brush="<?= $id ?>"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><?= $svg ?></svg><span><?= $label ?></span></button>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="easel__group easel__group--row">
                    <label class="easel__size"><span class="easel__label">Size <output data-size-out>12</output></span><input type="range" min="2" max="60" value="12" data-size></label>
                    <label class="easel__size"><span class="easel__label">Opacity <output data-alpha-out>100%</output></span><input type="range" min="10" max="100" value="100" data-alpha></label>
                </div>

                <div class="easel__group easel__group--row">
                    <button type="button" class="chip" aria-pressed="false" data-mandala><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg> Mandala mode</button>
                    <label class="chip chip--select"><span class="visually-hidden">Trace a guide shape</span>
                        <select data-guide>
                            <option value="">No guide</option>
                            <option value="flower">Trace: Flower</option>
                            <option value="fish">Trace: Fish</option>
                            <option value="house">Trace: House</option>
                            <option value="mandala">Trace: Mandala grid</option>
                        </select>
                    </label>
                </div>
            </div>

            <div class="easel__board">
                <div class="easel__paper">
                    <canvas class="easel__canvas" aria-label="Drawing canvas. Use a mouse, finger or stylus to draw." role="img"></canvas>
                    <svg class="easel__guide" viewBox="0 0 400 300" aria-hidden="true" data-guide-layer></svg>
                    <p class="easel__empty" data-empty>Start drawing here ✎</p>
                </div>
                <div class="easel__actions">
                    <button type="button" class="icon-btn" data-undo aria-label="Undo" title="Undo (Ctrl+Z)" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg></button>
                    <button type="button" class="icon-btn" data-redo aria-label="Redo" title="Redo (Ctrl+Y)" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/></svg></button>
                    <button type="button" class="icon-btn" data-clear aria-label="Clear canvas" title="Clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
                    <span class="easel__spacer"></span>
                    <button type="button" class="btn btn--outline btn--sm" data-download><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg> Save my art</button>
                    <button type="button" class="btn btn--primary btn--sm" data-booking>Learn to draw for real</button>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- SAVE-MY-ART LEAD FORM (opened by js/easel.js, posts to save-lead.php) -->
<div class="booking lead-dialog" id="lead-dialog" role="dialog" aria-modal="true" aria-labelledby="lead-title" hidden>
    <div class="booking__panel">
        <button class="booking__close" type="button" aria-label="Close" data-lead-close><?= icon('close') ?></button>
        <div class="lead-dialog__preview"><img alt="Preview of your drawing" data-lead-preview></div>
        <span class="eyebrow">Almost there!</span>
        <h2 class="h-sub" id="lead-title">Where should we send news about classes?</h2>
        <p class="lead-dialog__intro">Share your details to download your artwork. Our team will reach out with class timings and a chance to visit the studio.</p>
        <form class="lead-form" novalidate data-lead-form>
            <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
            <div class="hp-field" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
            <div class="lead-form__grid">
                <label class="field"><span>Your name</span><input type="text" name="name" maxlength="80" autocomplete="name" required><em class="field-error" data-err="name"></em></label>
                <label class="field"><span>Phone / WhatsApp</span><input type="tel" name="phone" maxlength="20" autocomplete="tel" inputmode="tel" required><em class="field-error" data-err="phone"></em></label>
                <label class="field"><span>Email <small>(optional)</small></span><input type="email" name="email" maxlength="120" autocomplete="email"><em class="field-error" data-err="email"></em></label>
                <label class="field"><span>Student’s name <small>(optional)</small></span><input type="text" name="student" maxlength="80" autocomplete="off"></label>
                <label class="field field--full"><span>Interested in</span>
                    <select name="course">
                        <?php foreach (cfg('course_options', []) as $opt): ?><option<?= $opt === 'Not sure yet' ? ' selected' : '' ?>><?= e($opt) ?></option><?php endforeach; ?>
                    </select>
                </label>
            </div>
            <label class="lead-form__consent"><input type="checkbox" name="consent" value="1" required> <span>Kalalaya Fine Arts may contact me by phone, WhatsApp or email about art classes.</span></label>
            <em class="field-error" data-err="consent"></em>
            <p class="booking__error" role="alert" data-lead-error></p>
            <button class="btn btn--primary" type="submit" data-lead-submit><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg> Download my artwork</button>
        </form>
    </div>
</div>

<!-- AGE-BASED COURSE FINDER -->
<section class="section age-finder" id="age-finder">
    <div class="container">
        <div class="section-head center reveal">
            <span class="eyebrow">Find the Right Class</span>
            <h2 class="h-section">Slide to Your Age Group</h2>
            <p>Every program follows a structured skill progression, so you always know what you’ll learn next.</p>
        </div>

        <div class="age-slider reveal" data-age-slider>
            <div class="age-slider__rail">
                <input type="range" class="age-slider__input" min="0" max="<?= count($courses) - 1 ?>" step="1" value="0" aria-label="Choose an age group" aria-valuetext="<?= e($courses[0]['slider']) ?>">
                <div class="age-slider__fill" aria-hidden="true"></div>
            </div>
            <ol class="age-slider__stops">
                <?php foreach ($courses as $i => $c): ?>
                <li><button type="button" data-stop="<?= $i ?>"<?= $i === 0 ? ' aria-current="true"' : '' ?>><?= e($c['slider']) ?></button></li>
                <?php endforeach; ?>
            </ol>

            <div class="age-panels">
                <?php foreach ($courses as $i => $c):
                    $times = array_map(fn($s) => trim($s[1] . ' ' . $s[2]), $c['schedule']); ?>
                <article class="age-panel<?= $i === 0 ? ' is-active' : '' ?>" data-panel="<?= $i ?>"<?= $i === 0 ? '' : ' hidden' ?> aria-live="polite">
                    <div class="age-panel__media">
                        <img src="assets/images/courses/<?= e($c['img']) ?>.jpg" width="380" height="290" alt="<?= e($c['alt']) ?>" loading="lazy">
                    </div>
                    <div class="age-panel__body">
                        <span class="eyebrow"><?= e($c['label']) ?></span>
                        <h3 class="h-sub"><?= e($c['name']) ?> — <?= e($c['heading']) ?></h3>
                        <dl class="age-panel__facts">
                            <div><dt><?= icon('palette') ?> Focus</dt><dd><?= e($c['focus']) ?></dd></div>
                            <div><dt><?= icon('target') ?> Key outcome</dt><dd><?= e($c['outcome']) ?></dd></div>
                            <div><dt><?= icon('clock') ?> Batch timings</dt><dd><?= e(implode(' · ', $times)) ?></dd></div>
                        </dl>
                        <div class="btn-row">
                            <button class="btn btn--primary btn--sm" type="button" data-booking="<?= e($c['id']) ?>">Reserve a Seat in This Batch</button>
                            <a class="btn btn--outline btn--sm" href="course-details.php#<?= e($c['id']) ?>">Full Syllabus <?= icon('arrow-right') ?></a>
                        </div>
                    </div>
                </article>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</section>

<!-- ABOUT -->
<section class="section home-about">
    <div class="container split">
        <div class="media-frame reveal">
            <img src="assets/images/about/brushes-table.jpg" width="668" height="424" alt="Watercolour paints and brushes on a table" loading="lazy">
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

<!-- WHY PARENTS CHOOSE KALALAYA -->
<section class="section section--white why">
    <div class="container">
        <div class="section-head center reveal">
            <span class="eyebrow">For Parents</span>
            <h2 class="h-section">Why Parents Choose Kalalaya</h2>
        </div>
        <ul class="why-grid">
            <li class="why-card reveal" style="--d:0"><span class="why-card__icon"><?= icon('book') ?></span><h3>Structured Progression</h3><p>Age-graded levels from first scribbles to the TN Govt. Technical Examination.</p></li>
            <li class="why-card reveal" style="--d:1"><span class="why-card__icon"><?= icon('palette') ?></span><h3>Fine Motor Skills</h3><p>Pencil control, colouring and brushwork build hand–eye coordination and focus.</p></li>
            <li class="why-card reveal" style="--d:2"><span class="why-card__icon"><?= icon('heart') ?></span><h3>Screen-Free Creativity</h3><p>Hands-on time with real materials, guided step by step in a calm studio.</p></li>
            <li class="why-card reveal" style="--d:3"><span class="why-card__icon"><?= icon('trophy') ?></span><h3>Experienced Guidance</h3><p>More than 20 years of teaching under founder Mr. Anthony Raj since 2002.</p></li>
        </ul>
    </div>
</section>

<?php
/* Newest artworks from the student-gallery/ folder for the drifting strip (photos first). */
$strip = [];
foreach (gallery_categories() as $c) foreach ($c['images'] as $img) $strip[] = $img + ['category' => $c['name'], 'slug' => $c['slug']];
usort($strip, fn($a, $b) => (int)str_ends_with($a['src'], '.svg') <=> (int)str_ends_with($b['src'], '.svg') ?: $b['time'] <=> $a['time']);
$strip = array_map(fn($i) => ['img' => $i['src'], 'title' => $i['title'], 'name' => $i['student'], 'category' => $i['category'], 'slug' => $i['slug']], array_slice($strip, 0, 24));
?>
<script>window.KALALAYA_GALLERY = <?= json_encode($strip, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?>;</script>
<!-- FLOATING STUDENT GALLERY (built by js/home.js from the student-gallery/ folder) -->
<section class="section float-gallery" aria-labelledby="fg-title">
    <div class="container">
        <div class="section-head section-head--split reveal">
            <div>
                <span class="eyebrow">Student Gallery</span>
                <h2 class="h-section" id="fg-title">Made by Our Students</h2>
            </div>
            <p>Hover over or tap any artwork to see who made it. Click to view it larger.</p>
        </div>
    </div>
    <div class="float-gallery__rows" data-float-gallery data-lightbox-group="float">
        <div class="float-row"><div class="float-row__track"></div></div>
        <div class="float-row float-row--reverse"><div class="float-row__track"></div></div>
    </div>
    <div class="container center" style="margin-top:28px">
        <a class="btn btn--outline" href="gallery.php#student-gallery">View Full Gallery <?= icon('arrow-right') ?></a>
    </div>
</section>

<!-- GALLERY + ACHIEVEMENTS -->
<section class="section" style="padding-top:0">
    <div class="container showcase">
        <div class="showcase-gallery reveal">
            <img src="assets/images/gallery/landscape-canvas.jpg" width="500" height="394" alt="A child painting colourful fruit on canvas" loading="lazy">
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
                <div><strong data-count="2002" data-from="1990">2002</strong><span>Established</span></div>
                <div><strong data-count="20" data-suffix="+">20+</strong><span>Years of Experience</span></div>
                <div><strong data-count="5" data-suffix=" +">5 +</strong><span>Age Group</span></div>
                <div><strong data-count="1000" data-suffix=" +">1000 +</strong><span>Students</span></div>
            </div>
        </div>
    </div>
</section>

<!-- LOCAL: classes near you (SEO) -->
<section class="section section--white near-you" aria-labelledby="near-title">
    <div class="container near-you__grid">
        <div class="reveal">
            <span class="eyebrow">Classes Near You</span>
            <h2 class="h-section" id="near-title">Drawing, Painting &amp; Art Classes in Coimbatore</h2>
            <p>Looking for a drawing class, painting class or art class near you? Kalalaya Fine Arts has taught in Coimbatore since <?= e(cfg('established')) ?>, from our studio on <?= e(cfg('address.line1')) ?>, <?= e(cfg('address.line2')) ?>. Families join us from <?= e(areas_sentence()) ?>.</p>
            <ul class="near-links">
                <li><a href="drawing-classes-coimbatore.php"><b>Drawing classes</b><span>Pencil, shading, portraits &amp; sketching</span><?= icon('arrow-right') ?></a></li>
                <li><a href="painting-classes-coimbatore.php"><b>Painting classes</b><span>Watercolour, oil, acrylic &amp; glass painting</span><?= icon('arrow-right') ?></a></li>
                <li><a href="art-classes-coimbatore.php"><b>Art classes for kids &amp; adults</b><span>Ages 5 to adults, weekday &amp; weekend batches</span><?= icon('arrow-right') ?></a></li>
            </ul>
        </div>
        <div class="reveal">
            <?= render_faq([
                ['Where is Kalalaya Fine Arts located?', 'We are at ' . cfg('address.line1') . ', ' . cfg('address.line2') . ', Coimbatore ' . cfg('address.postcode') . ', Tamil Nadu — open ' . cfg('hours_days') . ', ' . cfg('hours_time') . '.'],
                ['Which ages do you teach?', 'Children from age 5, school students up to 18, and adults. Each age group follows its own structured syllabus.'],
                ['Do you have weekend batches?', 'Yes. Students aged 8–18 can attend Saturday evening (5–6:30 pm) or Sunday morning (11 am–12:30 pm, or the special batch from 10:30 am). Kids batches run on weekday evenings.'],
                ['How do I enrol?', 'Tap “Reserve a Seat” to send your details on WhatsApp, call ' . cfg('phone_display') . ', or visit the studio.'],
            ], 'Quick answers') ?>
        </div>
    </div>
</section>

<?php $latest = array_slice(blog_posts(), 0, 3); if ($latest): ?>
<section class="section" aria-labelledby="blog-title">
    <div class="container">
        <div class="section-head section-head--split reveal">
            <div><span class="eyebrow">From the Blog</span><h2 class="h-section" id="blog-title">Art Tips for Parents &amp; Learners</h2></div>
            <p>Practical guides on choosing a class, starting painting and preparing for the Government drawing exam. <a class="arrow-link" href="blog.php">All articles <?= icon('arrow-right') ?></a></p>
        </div>
        <ul class="blog-grid">
            <?php foreach ($latest as $i => $p): ?>
            <li class="card blog-card reveal" style="--d:<?= $i ?>"><a href="blog.php?post=<?= e($p['slug']) ?>">
                <?php if ($p['image']): ?><img src="<?= e($p['image']) ?>" alt="" width="600" height="360" loading="lazy"><?php endif; ?>
                <div class="blog-card__body"><p class="post-meta"><?= $p['minutes'] ?> min read</p><h3 class="h-card"><?= e($p['title']) ?></h3><span class="arrow-link">Read article <?= icon('arrow-right') ?></span></div>
            </a></li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>
<?php endif; ?>

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
                <button class="btn btn--primary btn--sm" type="button" data-booking>Reserve a Seat <?= icon('arrow-right') ?></button>
                <a class="btn btn--outline btn--sm" href="contact.php">Contact Us</a>
            </div>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
