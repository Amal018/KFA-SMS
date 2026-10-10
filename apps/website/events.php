<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'events',
    'title' => 'Events & Workshops | Kalalaya Fine Arts Coimbatore',
    'description' => 'Upcoming art workshops, exhibitions and events at Kalalaya Fine Arts, Coimbatore. Contact us to hear about the next event.',
    'path' => 'events.php',
    'footer' => 'compact',
    'jsonld' => breadcrumb_jsonld([['Home', ''], ['Events', 'events.php']]),
];
require __DIR__ . '/includes/header.php';
?>

<section class="hero">
    <div class="container hero__grid">
        <div class="hero__copy">
            <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="index.php">Home</a></li><li aria-current="page">Events</li></ol></nav>
            <h1 class="h-display">Events &amp; <span class="text-pink">Workshops</span></h1>
            <p>Exhibitions, workshops, competitions and creative get-togethers from the Kalalaya studio.</p>
        </div>
        <div class="hero__media brush-media">
            <img src="assets/images/about/studio.jpg" width="698" height="484" alt="The Kalalaya Fine Arts studio" fetchpriority="high">
        </div>
    </div>
</section>

<section class="section section--white">
    <div class="container">
        <!-- EVENTS: replace this block with event cards when dates are announced. -->
        <div class="card events-empty reveal">
            <span class="events-empty__icon"><?= icon('calendar') ?></span>
            <div>
                <h2 class="h-sub">New events will be announced soon</h2>
                <p>We regularly host workshops, student exhibitions and special art sessions. Contact the studio or message us on WhatsApp to be told when the next one opens for registration.</p>
                <div class="btn-row">
                    <a class="btn btn--primary btn--sm" href="contact.php#enquiry">Ask About Upcoming Events <?= icon('arrow-right') ?></a>
                    <a class="btn btn--outline btn--sm" href="<?= e(cfg('social.whatsapp')) ?>" target="_blank" rel="noopener">Message on WhatsApp</a>
                </div>
            </div>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
