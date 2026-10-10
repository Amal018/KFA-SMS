<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'courses',
    'title' => 'Course Details & Batch Timings | Kalalaya Fine Arts Coimbatore',
    'description' => 'Batch timings, schedules and syllabus for Kalalaya Fine Arts courses: Kids, Young Artists, Teen Artists, Professional (TN Govt. Technical Exam) and Short-Term courses.',
    'path' => 'course-details.php',
    'footer' => 'compact',
    'og_image' => 'assets/images/hero/brushes-palette.jpg',
    'scripts' => ['js/course-details.js'],
    'jsonld' => breadcrumb_jsonld([['Home', ''], ['Courses', 'courses.php'], ['Course Details', 'course-details.php']]),
];
require __DIR__ . '/includes/header.php';

/* Course content — edit here. Schedule items: [icon, line1, line2]. */
$courses = [
    [
        'id' => 'kids', 'label' => 'Kids (Ages 5-7 Yrs)', 'heading' => 'Little Hands, Big Imagination',
        'intro' => 'Fun and engaging art classes to help young learners explore colours, shapes and creativity.',
        'schedule' => [['calendar', 'Wednesday to Friday', '(Any 2 Days)'], ['clock', 'Batch I', '5pm – 6pm'], ['clock', 'Batch II', '6pm – 7pm']],
        'img' => 'detail-kids', 'alt' => 'Young child painting a rainbow with watercolours',
        'title' => 'Colouring', 'subtitle' => 'Pencil Drawing & Colouring', 'topics' => [],
    ],
    [
        'id' => 'young-artists', 'label' => 'Students (8-12 Yrs)', 'heading' => 'Build Skills, Express Ideas',
        'intro' => 'A structured program to develop drawing skills, explore art techniques and build a strong foundation in fine arts.',
        'schedule' => [['calendar', 'Saturday', '5 pm – 6:30 pm'], ['clock', 'Sunday Regular Batch', '11 am – 12:30 pm'], ['clock', 'Sunday Special Batch', '10:30 am – 12:30 pm']],
        'img' => 'detail-drawing', 'alt' => 'Pencil still-life drawing of fruits and a vase',
        'title' => 'Drawing Fundamentals', 'subtitle' => '',
        'topics' => ['Fruits & Vegetables', 'Flowers', 'Designs', 'Symmetrical Drawing', '3 D Objects', 'Advanced Pencil Shading', 'Portrait Fundamentals', 'Human Anatomy Basics', 'Cartoons'],
    ],
    [
        'id' => 'teen-artists', 'label' => 'Students (13-18 Yrs)', 'heading' => 'Explore. Experiment. Evolve.',
        'intro' => 'For young artists ready to take their creativity further with advanced techniques and diverse art forms.',
        'schedule' => [['calendar', 'Saturday', '5 pm – 6:30 pm'], ['clock', 'Sunday Regular Batch', '11 am – 12:30 pm'], ['clock', 'Sunday Special Batch', '10:30 am – 12:30 pm']],
        'img' => 'detail-painting', 'alt' => 'Colourful landscape painting of mountains and a lake at sunset',
        'title' => 'Painting', 'subtitle' => '',
        'topics' => ['Water Colour', 'Oil Painting', 'Acrylic Painting', 'Subject', 'Portrait', 'Human Figure', 'Still Life (Light and Shade)', 'Landscape', 'Perspective', 'Free Hand Drawing', 'Animals & Birds', 'Mandala Art', 'Illusion', 'Charcoal'],
    ],
    [
        'id' => 'professional', 'label' => 'Professional Courses', 'heading' => 'Learn for a Brighter Future',
        'intro' => 'Specialized programs for students aspiring to build a career in the field of art and design.',
        'schedule' => [['calendar', '1 Year', ''], ['clock', 'Wednesday to Friday', '(Any 2 Days)'], ['clock', '2 Hours per day', '']],
        'img' => 'detail-professional', 'alt' => 'Fashion figure sketch on a drawing board',
        'title' => 'TamilNadu Govt. Technical Examination', 'subtitle' => '(Drawing & Painting)',
        'topics' => ['Freehand Outline & Model Drawing', 'Painting', 'Water Colour (or)', 'Oil Painting', 'Design', 'Textile Design(or)', 'Interior Design', 'Geometrical Drawing', 'Fashion Sketching', 'Illustration'],
    ],
    [
        'id' => 'short-term', 'label' => 'Short Term Courses', 'heading' => 'Create, Learn, Take Home',
        'intro' => 'Weekend and short-term courses to explore your favourite art forms and techniques.',
        // PLACEHOLDER: the mockup reads "Months (48 Hours)" — confirm the number of months.
        'schedule' => [['calendar', 'Months (48 Hours)', ''], ['clock', 'Wednesday to Friday', '(Any 2 Days)']],
        'img' => 'detail-glass', 'alt' => 'Round glass painting of colourful flowers',
        'title' => 'Glass Painting', 'subtitle' => '',
        'topics' => ['Tanjore Glass Reverse Painting', 'Mural Work', 'Portrait', 'Still Life', 'Life Drawing', 'Mandala Art'],
    ],
];
?>

<section class="hero">
    <div class="container hero__grid">
        <div class="hero__copy">
            <span class="eyebrow">Kalalaya Fine Arts - Courses</span>
            <h1 class="h-display">Our <span class="text-pink">Courses</span></h1>
            <p>Discover a range of art courses designed for every age and skill level. From foundational skills to advanced techniques, our programs nurture creativity and build confidence.</p>
        </div>
        <div class="hero__media brush-media">
            <img src="assets/images/hero/brushes-palette.jpg" width="752" height="364" alt="Paint brushes in a jar beside pots of colourful paint" fetchpriority="high">
        </div>
    </div>
</section>

<section style="padding: 4px 0 32px">
    <div class="container">
        <?php foreach ($courses as $c): ?>
        <article class="course-block reveal" id="<?= e($c['id']) ?>" aria-labelledby="h-<?= e($c['id']) ?>">
            <div>
                <span class="eyebrow"><?= e($c['label']) ?></span>
                <h2 class="h-section" id="h-<?= e($c['id']) ?>"><?= e($c['heading']) ?></h2>
                <p class="course-block__intro"><?= e($c['intro']) ?></p>
                <ul class="schedule" aria-label="Schedule">
                    <?php foreach ($c['schedule'] as [$ic, $l1, $l2]): ?>
                    <li><?= icon($ic) ?><span><b><?= e($l1) ?></b><?= $l2 ? e($l2) : '' ?></span></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <div class="course-panel">
                <img src="assets/images/courses/<?= e($c['img']) ?>.jpg" alt="<?= e($c['alt']) ?>" width="380" height="290" loading="lazy">
                <div class="course-panel__body">
                    <h3><?= e($c['title']) ?><?php if ($c['subtitle']): ?><small><?= e($c['subtitle']) ?></small><?php endif; ?></h3>
                    <?php if ($c['topics']): ?>
                    <ul class="topic-list">
                        <?php foreach ($c['topics'] as $t): ?><li><?= e($t) ?></li><?php endforeach; ?>
                    </ul>
                    <?php endif; ?>
                </div>
            </div>
        </article>
        <?php endforeach; ?>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
