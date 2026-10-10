<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
start_session();

// One-time token protects the form against cross-site submissions
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
$_SESSION['form_started'] = time();

// Result of a non-JavaScript submission (set by submit-enquiry.php)
$flash = $_SESSION['enquiry_flash'] ?? null;
unset($_SESSION['enquiry_flash']);
$old = $flash['old'] ?? [];
$errors = $flash['errors'] ?? [];
$sent = ($flash['status'] ?? '') === 'success';

$page = [
    'id' => 'contact',
    'title' => 'Contact Kalalaya Fine Arts | Coimbatore',
    'description' => 'Call +91 98424 34219, email kalalayafinearts@gmail.com or send an enquiry to Kalalaya Fine Arts, Coimbatore. Visit our studio Monday to Saturday.',
    'path' => 'contact.php',
    'footer' => 'compact',
    'og_image' => 'assets/images/contact/hero-brushes.jpg',
    'scripts' => ['js/contact.js'],
    'crumbs' => [['Home', ''], ['Contact', 'contact.php']],
];
require __DIR__ . '/includes/header.php';
$a = cfg('address');

function field_err(array $errors, string $k): string {
    return isset($errors[$k]) ? '<span class="field-error" id="err-' . $k . '">' . e($errors[$k]) . '</span>' : '<span class="field-error" id="err-' . $k . '"></span>';
}
function old(array $old, string $k): string { return e($old[$k] ?? ''); }
?>

<section class="hero">
    <div class="container hero__grid">
        <div class="hero__copy">
            <span class="eyebrow">Kalalaya Fine Arts - Contact</span>
            <h1 class="h-display">Get In <span class="text-pink">Touch</span></h1>
            <p class="muted">We’d love to hear from you! Whether you have a question about our courses, need more information or want to visit our studio, feel free to reach out.</p>
            <ul class="contact-quick">
                <li><?= icon('pin') ?><div><strong><?= e($a['city']) ?></strong><span><?= e($a['state']) ?></span></div></li>
                <li><?= icon('phone') ?><div><strong><a href="tel:<?= e(cfg('phone_link')) ?>"><?= e(cfg('phone_display')) ?></a></strong><span>Call us</span></div></li>
                <li><?= icon('mail') ?><div><strong><a href="mailto:<?= e(cfg('email')) ?>"><?= e(cfg('email')) ?></a></strong><span>Email us</span></div></li>
            </ul>
        </div>
        <div class="hero__media brush-media">
            <img src="assets/images/contact/hero-brushes.jpg" width="674" height="440" alt="Paint brushes standing in glass jars" fetchpriority="high">
        </div>
    </div>
</section>

<section class="section">
    <div class="container contact-main">
        <div class="reveal">
            <span class="eyebrow">Visit Our Studio</span>
            <h2 class="h-section">Our Location</h2>
            <p class="muted">Kalalaya Fine Arts is located in Coimbatore, Tamil Nadu. You are always welcome to visit our studio and see our creative space.</p>
            <ul class="loc-list">
                <li><?= icon('pin') ?><div><h3>Address</h3><p>Kalalaya Fine Arts<br><?= e($a['line1']) ?>, <?= e($a['line2']) ?><br><?= e($a['city']) ?> – <?= e($a['postcode']) ?><br><?= e($a['state']) ?>, <?= e($a['country']) ?></p></div></li>
                <li><?= icon('clock') ?><div><h3>Opening Hours</h3><p><?= e(cfg('hours_days')) ?><br><?= e(cfg('hours_time')) ?></p></div></li>
            </ul>
            <a class="btn btn--primary" href="<?= e(cfg('maps_url')) ?>" target="_blank" rel="noopener"><?= icon('pin') ?> Get Directions <?= icon('arrow-right') ?></a>
        </div>

        <div class="form-card reveal" id="enquiry">
            <div id="form-wrap" <?= $sent ? 'hidden' : '' ?>>
                <span class="eyebrow">Send Us a Message</span>
                <h2 class="h-section">Enquiry Form</h2>
                <p class="muted" style="margin:10px 0 24px">Fill in the details below and we’ll get back to you as soon as possible.</p>

                <div class="form-status form-status--error" id="form-error" role="alert" <?= !empty($flash['message']) && !$sent ? '' : 'hidden' ?>>
                    <?= icon('close') ?><span><?= e(!$sent ? ($flash['message'] ?? '') : '') ?></span>
                </div>

                <form id="enquiry-form" action="submit-enquiry.php" method="POST" novalidate>
                    <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
                    <!-- Honeypot: humans never see or fill this -->
                    <div class="hp-field" aria-hidden="true">
                        <label for="website">Leave this field empty</label>
                        <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
                    </div>

                    <div class="form-grid">
                        <div class="field<?= isset($errors['name']) ? ' has-error' : '' ?>">
                            <label for="name">Name *</label>
                            <input type="text" id="name" name="name" placeholder="Your name" required minlength="2" maxlength="80" autocomplete="name" value="<?= old($old, 'name') ?>" aria-describedby="err-name">
                            <?= field_err($errors, 'name') ?>
                        </div>
                        <div class="field<?= isset($errors['phone']) ? ' has-error' : '' ?>">
                            <label for="phone">Phone *</label>
                            <input type="tel" id="phone" name="phone" placeholder="Your phone number" required maxlength="20" autocomplete="tel" inputmode="tel" value="<?= old($old, 'phone') ?>" aria-describedby="err-phone">
                            <?= field_err($errors, 'phone') ?>
                        </div>
                        <div class="field<?= isset($errors['email']) ? ' has-error' : '' ?>">
                            <label for="email">Email *</label>
                            <input type="email" id="email" name="email" placeholder="Your email address" required maxlength="120" autocomplete="email" value="<?= old($old, 'email') ?>" aria-describedby="err-email">
                            <?= field_err($errors, 'email') ?>
                        </div>
                        <div class="field<?= isset($errors['course']) ? ' has-error' : '' ?>">
                            <label for="course">Course Interested In</label>
                            <select id="course" name="course" aria-describedby="err-course">
                                <option value="">Select a course</option>
                                <?php foreach (cfg('course_options') as $opt): ?>
                                <option value="<?= e($opt) ?>"<?= ($old['course'] ?? '') === $opt ? ' selected' : '' ?>><?= e($opt) ?></option>
                                <?php endforeach; ?>
                            </select>
                            <?= field_err($errors, 'course') ?>
                        </div>
                        <div class="field field--full<?= isset($errors['message']) ? ' has-error' : '' ?>">
                            <label for="message">Message</label>
                            <textarea id="message" name="message" placeholder="Your message here..." maxlength="2000" aria-describedby="err-message"><?= old($old, 'message') ?></textarea>
                            <?= field_err($errors, 'message') ?>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn--primary" type="submit" id="enquiry-submit">Send Message <?= icon('arrow-right') ?></button>
                    </div>
                </form>
            </div>

            <div class="form-success" id="form-success" role="status" tabindex="-1" <?= $sent ? '' : 'hidden' ?>>
                <span class="form-success__icon"><?= icon('check') ?></span>
                <h2 class="h-sub">Thank you — your enquiry has been sent</h2>
                <p>We’ve received your message and will get back to you soon. For anything urgent, call us on <a class="text-pink" href="tel:<?= e(cfg('phone_link')) ?>"><?= e(cfg('phone_display')) ?></a>.</p>
                <a class="btn btn--outline btn--sm" href="courses.php">Explore Courses</a>
            </div>
        </div>
    </div>
</section>

<section class="map-section" style="padding-bottom: var(--section-y)">
    <div class="container">
        <div class="map-embed reveal">
            <div class="map-overlay">
                <h3>Kalalaya Fine Arts</h3>
                <p><?= e($a['line1']) ?>, <?= e($a['line2']) ?><br><?= e($a['city']) ?> – <?= e($a['postcode']) ?>, <?= e($a['state']) ?>, <?= e($a['country']) ?></p>
                <a href="<?= e(cfg('maps_url')) ?>" target="_blank" rel="noopener">View on Google Maps <?= icon('external') ?></a>
            </div>
            <iframe src="<?= e(maps_embed_src()) ?>" title="Map: Kalalaya Fine Arts, Coimbatore" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
    </div>
</section>

<section class="cta-band">
    <img class="cta-band__brush cta-band__brush--l" src="assets/images/decor/brush-stroke.svg" alt="" aria-hidden="true" width="120" height="100" loading="lazy">
    <img class="cta-band__brush cta-band__brush--r" src="assets/images/decor/brush-stroke.svg" alt="" aria-hidden="true" width="120" height="100" loading="lazy">
    <div class="container cta-band__inner">
        <h2 class="h-section">Let’s Create<br>Something Beautiful</h2>
        <span class="cta-band__divider" aria-hidden="true"></span>
        <p class="cta-band__text">Join Kalalaya Fine Arts and be part of a community that celebrates art, creativity and self-expression.</p>
        <div class="btn-row"><a class="btn btn--primary btn--sm" href="courses.php">Explore Courses <?= icon('arrow-right') ?></a></div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
