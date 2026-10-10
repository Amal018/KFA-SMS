<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'courses',
    'title' => 'Art Classes in Coimbatore for Kids, Teens & Adults | Kalalaya',
    'description' => 'Art classes near you in Coimbatore: drawing, painting and fine arts for ages 5 to adults. Weekday and weekend batches at Kalalaya Fine Arts.',
    'path' => 'art-classes-coimbatore.php',
    'footer' => 'full',
    'og_image' => 'assets/images/courses/cat-kids.jpg',
    'crumbs' => [['Home', ''], ['Courses', 'courses.php'], ['Art Classes in Coimbatore', 'art-classes-coimbatore.php']],
];
$areas = areas_sentence();
$L = [
    'eyebrow' => 'Art Classes · Coimbatore',
    'h1' => 'Art Classes in',
    'h1_accent' => 'Coimbatore',
    'lead' => 'A complete fine-arts journey — from a five-year-old’s first crayon drawing to exam-ready portfolios and weekend hobby courses for adults.',
    'img' => 'assets/images/courses/cat-kids.jpg',
    'img_alt' => 'Two young girls colouring with markers and crayons',
    'intro' => [
        'Parents looking for <strong>art classes near me</strong> in Coimbatore often want two things: a place their child will enjoy, and teaching that actually builds skill. Kalalaya Fine Arts has offered both since 2002, with age-graded programmes in drawing, painting and fine arts at our studio in Maniyakarampalayam.',
        'We are easy to reach from ' . e($areas) . ', with weekday-evening batches for young children and weekend batches for school students.',
    ],
    'sections' => [
        ['Art classes for kids', [
            'Our <a href="course-details.php#kids">kids art class (ages 5–7)</a> builds colour sense, shape recognition and fine motor skills through pencil drawing and colouring. From age 8, <a href="course-details.php#young-artists">young artists</a> learn structured drawing fundamentals, shading, designs, portraits and cartoons.',
        ]],
        ['Art classes for teenagers', [
            '<a href="course-details.php#teen-artists">Teen artists (13–18)</a> explore watercolour, oil and acrylic painting, portraits, landscapes, perspective, charcoal, mandala and illusion art — useful both as a creative outlet and as a foundation for design, architecture and fine-arts courses after school.',
        ]],
        ['Art classes for adults and homemakers', [
            'It is never too late to start. Our <a href="course-details.php#short-term">short-term courses</a> cover glass painting, Tanjore glass reverse painting, mural work, portraits, still life, life drawing and mandala art — and you take your finished work home.',
        ]],
        ['What makes Kalalaya different', [], [
            'Teaching since 2002, led by founder Mr. Anthony Raj, D.F.A., TTC.',
            'A structured, age-graded syllabus — students always know what comes next.',
            'Preparation for the Tamil Nadu Government Technical Examination in Drawing &amp; Painting.',
            'Personal guidance that encourages each student’s individuality.',
        ]],
    ],
    'courses' => ['kids', 'young-artists', 'teen-artists', 'short-term'],
    'faqs' => [
        ['Are there art classes near me in Coimbatore?', 'Kalalaya Fine Arts is at 511/1 Rabindranath Tagore Road, Maniyakarampalayam, Coimbatore 641006, close to ' . $areas . '. Tap Get Directions for a route from your location.'],
        ['What is the right age to start art classes?', 'Children can start from age 5. Each age group has its own syllabus, so beginners of any age — including adults — are welcome.'],
        ['Do you offer weekend art classes?', 'Yes. Students aged 8–18 can attend on Saturday evening (5–6:30 pm) or Sunday morning (11 am–12:30 pm, or the special batch from 10:30 am).'],
        ['Do you offer art classes for adults?', 'Yes. Adults and homemakers can join short-term courses in glass painting, mural work, portrait, still life, life drawing and mandala art, or a regular batch.'],
        ['How can I enquire about fees and admission?', 'Tap “Reserve a Seat” to send your details on WhatsApp, call ' . cfg('phone_display') . ', or visit the studio ' . cfg('hours_days') . ', ' . cfg('hours_time') . '.'],
    ],
    'related' => [['Drawing classes in Coimbatore', 'drawing-classes-coimbatore.php'], ['Painting classes in Coimbatore', 'painting-classes-coimbatore.php'], ['Read our art blog', 'blog.php'], ['Meet our talented students', 'gallery.php#students-work']],
];
require __DIR__ . '/includes/header.php';
require __DIR__ . '/includes/landing.php';
require __DIR__ . '/includes/footer.php';
