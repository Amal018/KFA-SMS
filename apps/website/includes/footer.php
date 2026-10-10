<?php
/**
 * Shared footer. The mockups use four footer layouts, so each page picks one:
 *   $page['footer'] = 'simple'  (Home)        logo · inline links · contact
 *                   = 'pink'    (About Us)    solid pink band with white logo + Enquire Now
 *                   = 'full'    (Courses, Achievements) logo · Quick Links · Courses · Contact · map
 *                   = 'compact' (all other pages)       logo · Quick Links · Contact · map
 * All share the same links, contact details and social icons from config.php.
 */
if (!defined('KALALAYA')) { http_response_code(403); exit; }
$fv = $page['footer'] ?? 'compact';

$quick = [['Home', 'index.php'], ['About Us', 'about.php'], ['Courses', 'courses.php'], ['Achievements', 'achievements.php'], ['Events', 'events.php'], ['Gallery', 'gallery.php'], ['Contact', 'contact.php']];
$courseLinks = [['Kids', 'kids'], ['Young Artists', 'young-artists'], ['Teen Artists', 'teen-artists'], ['Professional Courses', 'professional'], ['Short-Term Courses', 'short-term']];
$socialOrder = $fv === 'simple' ? ['facebook', 'instagram', 'youtube'] : ['facebook', 'instagram', 'whatsapp', 'youtube'];
$socialLabels = ['facebook' => 'Facebook', 'instagram' => 'Instagram', 'youtube' => 'YouTube', 'whatsapp' => 'WhatsApp'];
$logoFile = $fv === 'pink' ? 'assets/logo/kalalaya-logo-white.png' : 'assets/logo/kalalaya-logo.png';
$copyright = '&copy; ' . date('Y') . ' ' . e(cfg('site_name')) . '. All Rights Reserved.';

$renderSocial = function () use ($socialOrder, $socialLabels) {
    $h = '<ul class="social">';
    foreach ($socialOrder as $k) {
        $u = cfg("social.$k"); if (!$u) continue;
        $h .= '<li><a href="' . e($u) . '" target="_blank" rel="noopener" aria-label="' . e(cfg('site_name')) . ' on ' . $socialLabels[$k] . '">' . icon($k) . '</a></li>';
    }
    return $h . '</ul>';
};
$renderContact = function () {
    return '<ul class="contact-list">'
        . '<li>' . icon('pin') . '<span>' . e(cfg('address.city')) . ', ' . e(cfg('address.state')) . '</span></li>'
        . '<li>' . icon('phone') . '<a href="tel:' . e(cfg('phone_link')) . '">' . e(cfg('phone_display')) . '</a></li>'
        . '<li>' . icon('mail') . '<a href="mailto:' . e(cfg('email')) . '">' . e(cfg('email')) . '</a></li></ul>';
};
$renderLinks = function (array $items, bool $courses = false) {
    $h = '<ul class="footer-links">';
    foreach ($items as [$l, $u]) $h .= '<li><a href="' . ($courses ? 'course-details.php?category=' . $u : $u) . '">' . e($l) . '</a></li>';
    return $h . '</ul>';
};
?>
</main>

<footer class="site-footer site-footer--<?= e($fv) ?>">
<?php if ($fv === 'compact'): ?>
    <img class="site-footer__brush site-footer__brush--l" src="assets/images/decor/brush-stroke.svg" alt="" aria-hidden="true" width="160" height="120" loading="lazy">
    <img class="site-footer__brush site-footer__brush--r" src="assets/images/decor/brush-stroke.svg" alt="" aria-hidden="true" width="160" height="120" loading="lazy">
<?php endif; ?>

<?php if ($fv === 'simple'): ?>
    <div class="container footer-grid footer-grid--simple">
        <a href="index.php" class="footer-brand__logo" aria-label="<?= e(cfg('site_name')) ?> — Home">
            <img src="assets/logo/kalalaya-logo.png" alt="<?= e(cfg('site_name')) ?> logo" width="250" height="118" loading="lazy">
        </a>
        <nav aria-label="Footer"><ul class="footer-inline">
            <?php foreach ($quick as [$l, $u]): ?><li><a href="<?= $u ?>"><?= e($l) ?></a></li><?php endforeach; ?>
        </ul></nav>
        <div class="footer-contact"><?= $renderContact() ?><?= $renderSocial() ?></div>
    </div>
    <div class="container footer-bottom"><p><?= $copyright ?></p></div>

<?php elseif ($fv === 'pink'): ?>
    <div class="footer-pink">
        <div class="container footer-grid footer-grid--pink">
            <div class="footer-brand">
                <a href="index.php" class="footer-brand__logo" aria-label="<?= e(cfg('site_name')) ?> — Home">
                    <img src="<?= $logoFile ?>" alt="<?= e(cfg('site_name')) ?> logo" width="266" height="174" loading="lazy">
                </a>
                <p><?= e(cfg('tagline')) ?></p>
            </div>
            <div class="footer-col"><h2 class="footer-title">Quick Links</h2><?= $renderLinks($quick) ?></div>
            <div class="footer-col"><h2 class="footer-title">Courses</h2><?= $renderLinks($courseLinks, true) ?></div>
            <div class="footer-col footer-contact"><h2 class="footer-title">Contact</h2><?= $renderContact() ?><?= $renderSocial() ?></div>
            <div class="footer-pink__cta"><a class="btn btn--white" href="contact.php#enquiry">Enquire Now</a></div>
        </div>
    </div>
    <div class="container footer-bottom"><p><?= $copyright ?></p></div>

<?php else: /* full + compact */ ?>
    <div class="container footer-grid footer-grid--<?= e($fv) ?>">
        <div class="footer-brand">
            <a href="index.php" class="footer-brand__logo" aria-label="<?= e(cfg('site_name')) ?> — Home">
                <img src="assets/logo/kalalaya-logo.png" alt="<?= e(cfg('site_name')) ?> logo" width="250" height="118" loading="lazy">
            </a>
            <?php if ($fv === 'full'): ?><p><?= e(cfg('tagline')) ?></p><?php else: ?><p class="footer-copy"><?= $copyright ?></p><?php endif; ?>
        </div>
        <div class="footer-col"><h2 class="footer-title">Quick Links</h2><?= $renderLinks($quick) ?></div>
        <?php if ($fv === 'full'): ?>
        <div class="footer-col"><h2 class="footer-title">Courses</h2><?= $renderLinks($courseLinks, true) ?></div>
        <?php endif; ?>
        <div class="footer-col footer-contact"><h2 class="footer-title">Contact</h2><?= $renderContact() ?><?= $renderSocial() ?></div>
        <a class="footer-map" href="<?= e(cfg('maps_url')) ?>" target="_blank" rel="noopener" aria-label="Open Kalalaya Fine Arts location in Google Maps">
            <img src="assets/images/contact/map-footer.jpg" alt="Map showing Kalalaya Fine Arts in Coimbatore" width="444" height="176" loading="lazy">
        </a>
    </div>
    <?php if ($fv === 'full'): ?><div class="container footer-bottom footer-bottom--plain"><p><?= $copyright ?></p></div><?php else: ?><div class="footer-spacer"></div><?php endif; ?>
<?php endif; ?>
</footer>

<a class="whatsapp-float" href="<?= e(cfg('social.whatsapp')) ?>" target="_blank" rel="noopener" aria-label="Chat with Kalalaya Fine Arts on WhatsApp"><?= icon('whatsapp') ?></a>

<!-- Lightbox (shared by gallery, student gallery and achievements) -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>
    <button class="lightbox__close" type="button" aria-label="Close image"><?= icon('close') ?></button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image"><?= icon('arrow-left') ?></button>
    <figure class="lightbox__figure">
        <img class="lightbox__img" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="">
        <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next image"><?= icon('arrow-right') ?></button>
</div>

<script src="js/main.js?v=1.1" defer></script>
<?php foreach ($page['scripts'] ?? [] as $s): ?>
<script src="<?= e($s) ?>?v=1.1" defer></script>
<?php endforeach; ?>
</body>
</html>
