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
    'crumbs' => [['Home', ''], ['Courses', 'courses.php'], ['Timings & Syllabus', 'course-details.php']],
];
require __DIR__ . '/includes/header.php';

/* Course content lives in includes/courses.php (shared with the home page slider). */
$courses = require __DIR__ . '/includes/courses.php';
?>

<section class="hero">
    <div class="container hero__grid">
        <div class="hero__copy">
            <span class="eyebrow">Kalalaya Fine Arts - Courses</span>
            <h1 class="h-display">Our <span class="text-pink">Courses</span></h1>
            <p>Discover a range of art courses designed for every age and skill level. From foundational skills to advanced techniques, our programs nurture creativity and build confidence.</p>
        </div>
        <div class="hero__media brush-media">
            <img src="assets/images/hero/brushes-palette.jpg" width="752" height="364" alt="Paint brushes resting on a colourful wooden palette" fetchpriority="high">
        </div>
    </div>
</section>

<nav class="course-tabs" aria-label="Jump to a course" data-spy>
    <ul class="container">
        <?php foreach ($courses as $c): ?>
        <li><a href="#<?= e($c['id']) ?>"><?= e($c['name']) ?></a></li>
        <?php endforeach; ?>
    </ul>
</nav>

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
