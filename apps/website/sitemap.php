<?php
/**
 * Dynamic sitemap — served as /sitemap.xml (see .htaccess).
 * Lists every page, landing page, blog post and student page automatically.
 */
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
header('Content-Type: application/xml; charset=utf-8');

$urls = [
    ['', 1.0, 'weekly'],
    ['courses.php', 0.9, 'monthly'],
    ['drawing-classes-coimbatore.php', 0.9, 'monthly'],
    ['painting-classes-coimbatore.php', 0.9, 'monthly'],
    ['art-classes-coimbatore.php', 0.9, 'monthly'],
    ['course-details.php', 0.8, 'monthly'],
    ['about.php', 0.8, 'yearly'],
    ['contact.php', 0.8, 'yearly'],
    ['gallery.php', 0.8, 'weekly'],
    ['blog.php', 0.7, 'weekly'],
    ['achievements.php', 0.6, 'monthly'],
    ['events.php', 0.6, 'weekly'],
];
$last = [];
foreach (blog_posts() as $p) { $urls[] = ['blog.php?post=' . $p['slug'], 0.7, 'yearly']; $last['blog.php?post=' . $p['slug']] = $p['time']; }
foreach (talented_students() as $s) $urls[] = ['student-gallery.php?student=' . $s['id'], 0.4, 'monthly'];

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as [$path, $prio, $freq]) {
    $file = __DIR__ . '/' . (strtok($path, '?') ?: 'index.php');
    $mod = $last[$path] ?? (is_file($file) ? filemtime($file) : time());
    printf("  <url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%.1f</priority></url>\n",
        htmlspecialchars(abs_url($path), ENT_XML1), date('Y-m-d', $mod), $freq, $prio);
}
echo "</urlset>\n";
