<?php
/**
 * ONE reusable page for every student:  student-gallery.php?student=<id>
 * Content is rendered by js/student-gallery.js from the talented-students/ folder.
 */
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$sid = preg_replace('/[^a-z0-9\-]/', '', strtolower($_GET['student'] ?? ''));
$student = null;
foreach (talented_students() as $s) if ($s['id'] === $sid) { $student = $s; break; }
if (!$student) http_response_code(404);
$page = [
    'id' => 'gallery',
    'title' => $student ? $student['name'] . ' — Student Gallery | Kalalaya Fine Arts' : 'Student not found | Kalalaya Fine Arts',
    'description' => $student
        ? 'Artwork by ' . $student['name'] . ' (' . $student['course'] . ') at Kalalaya Fine Arts, Coimbatore.'
        : 'Artwork created by a Kalalaya Fine Arts student during their art journey in Coimbatore.',
    'path' => 'student-gallery.php' . ($sid ? '?student=' . $sid : ''),
    'og_image' => $student ? $student['profile'] : null,
    'noindex' => !$student,
    'crumbs' => array_filter([['Home', ''], ['Gallery', 'gallery.php'], ['Talented Students', 'gallery.php#students-work'],
        $student ? [$student['name'], 'student-gallery.php?student=' . $sid] : ['Student not found', '']]),
    'scripts' => ['js/student-gallery.js'],
    'footer' => 'compact',
];
require __DIR__ . '/includes/header.php';
?>

<?= talented_students_script() ?>
<div id="student-app" data-student="<?= e($sid) ?>">
    <section class="profile-hero">
        <div class="container">
            <a class="back-link" href="gallery.php#students-work"><?= icon('arrow-left') ?> Back to Students Gallery</a>
            <div class="profile">
                <div class="profile__photo"><img id="sp-photo" src="assets/images/placeholder.svg" width="400" height="348" alt=""></div>
                <div>
                    <span class="eyebrow">Student Profile</span>
                    <h1 class="h-display" id="sp-name">Loading…</h1>
                    <p class="meta" id="sp-meta"></p>
                    <p class="profile__desc" id="sp-desc"></p>
                </div>
                <p class="profile__quote script" id="sp-quote" aria-hidden="true"></p>
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <div class="section-head">
                <span class="eyebrow">Student’s Work</span>
                <h2 class="h-section" id="sp-work-title">Artwork</h2>
                <p class="muted" id="sp-work-desc" style="margin-top:10px"></p>
            </div>
            <ul class="artwork-grid" id="artwork-grid" aria-live="polite"></ul>
            <nav class="pagination" id="artwork-pagination" aria-label="Artwork pages"></nav>
        </div>
    </section>
</div>

<section class="section section--white" id="student-not-found" hidden>
    <div class="container not-found">
        <?= icon('palette') ?>
        <h1 class="h-section">Student not found</h1>
        <p>We couldn’t find a student gallery at this address. The link may be mistyped or the gallery may have been moved.</p>
        <a class="btn btn--primary" href="gallery.php#students-work"><?= icon('arrow-left') ?> Back to Students Gallery</a>
    </div>
</section>

<noscript><div class="container not-found"><p>Please enable JavaScript to view this student’s gallery.</p></div></noscript>

<?php require __DIR__ . '/includes/footer.php'; ?>
