<?php
/**
 * Blog — list (blog.php) and single post (blog.php?post=<slug>).
 * Posts are text files in blog-posts/ — see blog-posts/README.txt.
 */
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';

$posts = blog_posts();
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($_GET['post'] ?? ''));
$post = null;
if ($slug !== '') {
    foreach ($posts as $p) if ($p['slug'] === $slug) { $post = $p; break; }
    if (!$post) http_response_code(404);
}

if ($post) {
    $page = [
        'id' => 'blog',
        'title' => $post['title'] . (strlen($post['title']) < 48 ? ' | Kalalaya Fine Arts' : ''),
        'description' => $post['description'],
        'path' => 'blog.php?post=' . $post['slug'],
        'og_image' => $post['image'] ?: null,
        'footer' => 'compact',
        'crumbs' => [['Home', ''], ['Blog', 'blog.php'], [$post['title'], 'blog.php?post=' . $post['slug']]],
        'jsonld' => json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'BlogPosting',
            'headline' => $post['title'],
            'description' => $post['description'],
            'datePublished' => date('c', $post['time']),
            'image' => $post['image'] ? abs_url($post['image']) : abs_url('assets/images/hero/hero-girl-painting.jpg'),
            'author' => ['@type' => 'Organization', 'name' => cfg('site_name'), 'url' => abs_url()],
            'publisher' => ['@type' => 'Organization', 'name' => cfg('site_name'), 'logo' => ['@type' => 'ImageObject', 'url' => abs_url('assets/logo/kalalaya-logo.png')]],
            'mainEntityOfPage' => abs_url('blog.php?post=' . $post['slug']),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG),
    ];
} else {
    $page = [
        'id' => 'blog',
        'title' => $slug ? 'Post not found | Kalalaya Fine Arts Blog' : 'Art Blog — Drawing & Painting Tips from Coimbatore | Kalalaya Fine Arts',
        'description' => 'Guides for parents and learners in Coimbatore: choosing a drawing class, starting painting, the TN Government drawing exam and more.',
        'path' => 'blog.php',
        'noindex' => (bool)$slug,
        'footer' => 'compact',
        'crumbs' => [['Home', ''], ['Blog', 'blog.php']],
    ];
}
require __DIR__ . '/includes/header.php';
?>

<?php if ($post): ?>
<article class="post">
    <header class="page-hero post-hero">
        <div class="container post-hero__inner">
            <span class="eyebrow">Kalalaya Blog</span>
            <h1 class="h-display post-title"><?= e($post['title']) ?></h1>
            <p class="post-meta"><?= icon('calendar') ?> <time datetime="<?= date('Y-m-d', $post['time']) ?>"><?= date('j F Y', $post['time']) ?></time> <span aria-hidden="true">·</span> <?= $post['minutes'] ?> min read</p>
        </div>
    </header>
    <div class="section section--white">
        <div class="container post-layout">
            <div class="post-body">
                <?php if ($post['image']): ?><img class="post-cover" src="<?= e($post['image']) ?>" alt="" width="1000" height="600"><?php endif; ?>
                <?= blog_markdown($post['body']) ?>
                <div class="post-cta">
                    <h2 class="h-sub">Visit Kalalaya Fine Arts</h2>
                    <p>Drawing, painting and fine-arts classes for ages 5 to adults at <?= e(cfg('address.line1')) ?>, <?= e(cfg('address.line2')) ?>, Coimbatore — since <?= e(cfg('established')) ?>.</p>
                    <div class="btn-row">
                        <button class="btn btn--primary btn--sm" type="button" data-booking>Reserve a Seat <?= icon('arrow-right') ?></button>
                        <a class="btn btn--outline btn--sm" href="courses.php">See all courses</a>
                    </div>
                </div>
            </div>
            <aside class="post-aside">
                <h2 class="h-card">More from the blog</h2>
                <ul class="post-mini">
                    <?php foreach (array_slice(array_values(array_filter($posts, fn($p) => $p['slug'] !== $post['slug'])), 0, 4) as $p): ?>
                    <li><a href="blog.php?post=<?= e($p['slug']) ?>"><?= e($p['title']) ?></a><span><?= date('j M Y', $p['time']) ?></span></li>
                    <?php endforeach; ?>
                </ul>
                <h2 class="h-card" style="margin-top:26px">Classes in Coimbatore</h2>
                <ul class="post-mini">
                    <li><a href="drawing-classes-coimbatore.php">Drawing classes</a></li>
                    <li><a href="painting-classes-coimbatore.php">Painting classes</a></li>
                    <li><a href="art-classes-coimbatore.php">Art classes for kids &amp; adults</a></li>
                </ul>
            </aside>
        </div>
    </div>
</article>

<?php elseif ($slug): ?>
<section class="section section--white">
    <div class="container not-found">
        <?= icon('book') ?>
        <h1 class="h-section">Post not found</h1>
        <p>This article may have been moved or removed.</p>
        <a class="btn btn--primary" href="blog.php"><?= icon('arrow-left') ?> Back to the blog</a>
    </div>
</section>

<?php else: ?>
<section class="page-hero">
    <div class="container">
        <div class="page-hero__copy" style="max-width:640px">
            <span class="eyebrow">Kalalaya Blog</span>
            <h1 class="h-display">Art Tips &amp; <span class="text-pink">Guides</span></h1>
            <p class="lead">Practical advice for parents and learners in Coimbatore — from choosing a first drawing class to preparing for the Government drawing exam.</p>
        </div>
    </div>
</section>
<section class="section">
    <div class="container">
        <?php if ($posts): ?>
        <ul class="blog-grid">
            <?php foreach ($posts as $i => $p): ?>
            <li class="card blog-card reveal" style="--d:<?= $i % 6 ?>">
                <a href="blog.php?post=<?= e($p['slug']) ?>">
                    <?php if ($p['image']): ?><img src="<?= e($p['image']) ?>" alt="" width="600" height="360" loading="lazy"><?php endif; ?>
                    <div class="blog-card__body">
                        <p class="post-meta"><time datetime="<?= date('Y-m-d', $p['time']) ?>"><?= date('j M Y', $p['time']) ?></time> · <?= $p['minutes'] ?> min read</p>
                        <h2 class="h-card"><?= e($p['title']) ?></h2>
                        <p><?= e($p['description']) ?></p>
                        <span class="arrow-link">Read article <?= icon('arrow-right') ?></span>
                    </div>
                </a>
            </li>
            <?php endforeach; ?>
        </ul>
        <?php else: ?>
        <p class="gallery-empty">New articles are coming soon.</p>
        <?php endif; ?>
    </div>
</section>
<?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
