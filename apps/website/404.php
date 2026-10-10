<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
http_response_code(404);
$page = [
    'id' => '404',
    'title' => 'Page Not Found | Kalalaya Fine Arts',
    'description' => 'The page you were looking for could not be found.',
    'path' => '404.php',
    'noindex' => true,
    'footer' => 'compact',
    'crumbs' => [['Home', ''], ['Page not found', '']],
    'use_base' => true, // so assets load correctly from any missing URL depth
];
require __DIR__ . '/includes/header.php';
?>
<section class="section section--white">
    <div class="container not-found">
        <?= icon('palette') ?>
        <h1 class="h-section">This page isn’t on the canvas</h1>
        <p>The address may be mistyped or the page may have moved. Try one of these instead.</p>
        <div class="btn-row" style="justify-content:center">
            <a class="btn btn--primary" href="index.php">Go to Home</a>
            <a class="btn btn--outline" href="courses.php">View Courses</a>
        </div>
    </div>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
