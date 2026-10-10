<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'courses',
    'title' => 'Painting Classes in Coimbatore: Watercolour, Oil & Acrylic',
    'description' => 'Painting class near you in Coimbatore: watercolour, oil, acrylic and glass painting for kids, teens and adults at Kalalaya Fine Arts, since 2002.',
    'path' => 'painting-classes-coimbatore.php',
    'footer' => 'full',
    'og_image' => 'assets/images/courses/detail-painting.jpg',
    'crumbs' => [['Home', ''], ['Courses', 'courses.php'], ['Painting Classes in Coimbatore', 'painting-classes-coimbatore.php']],
];
$areas = areas_sentence();
$L = [
    'eyebrow' => 'Painting Classes · Coimbatore',
    'h1' => 'Painting Classes in',
    'h1_accent' => 'Coimbatore',
    'lead' => 'Watercolour, oil, acrylic and Tanjore glass painting — learn colour, brushwork and composition in a friendly studio in Maniyakarampalayam.',
    'img' => 'assets/images/courses/detail-painting.jpg',
    'img_alt' => 'Painting of a tree on a cliff in progress',
    'intro' => [
        'Searching for a <strong>painting class near me</strong> in Coimbatore? At Kalalaya Fine Arts, students learn to paint with real techniques — mixing colours, controlling the brush, building layers and composing a picture — rather than just copying a finished image.',
        'Our studio has taught painting in Coimbatore since 2002 and welcomes students from ' . e($areas) . '. Young children start with colouring and simple paint work; teenagers and adults move on to watercolour, oil and acrylic painting, landscapes, still life and portraits.',
    ],
    'sections' => [
        ['Painting styles you can learn', [
            'Painting is part of the teen and adult programmes and of our short-term courses:',
        ], [
            '<b>Watercolour:</b> washes, wet-on-wet, layering and landscapes.',
            '<b>Oil and acrylic painting:</b> colour mixing, blending, texture, still life and portraits.',
            '<b>Glass painting:</b> including Tanjore glass reverse painting and mural work in the short-term course.',
            '<b>Mandala and illusion art:</b> pattern, symmetry and precision.',
        ]],
        ['Painting classes for every age', [
            'Children aged 5–7 begin with colouring and simple painting to learn colour and control. Students aged 13–18 study watercolour, oil and acrylic painting, landscapes, perspective and still life with light and shade. Adults and homemakers can join the <a href="course-details.php#short-term">short-term courses</a> to learn glass painting, mural work and more, and take finished pieces home.',
        ]],
        ['What to bring', [
            'For your first class, simply come along — we will tell you which brushes, paints and paper to buy for your course, so you do not spend money on materials you will not use.',
        ]],
    ],
    'courses' => ['teen-artists', 'short-term', 'kids', 'professional'],
    'faqs' => [
        ['Is there a painting class near me in Coimbatore?', 'Kalalaya Fine Arts is at 511/1 Rabindranath Tagore Road, Maniyakarampalayam, Coimbatore 641006, and is convenient for ' . $areas . '. Tap Get Directions for the route from where you are.'],
        ['Which painting mediums do you teach?', 'Watercolour, oil painting, acrylic painting and glass painting (including Tanjore glass reverse painting), along with mural work, mandala art and charcoal.'],
        ['Can adults with no experience join painting classes?', 'Yes. Many adults and homemakers start with no experience. The short-term courses are designed for beginners who want to learn a specific style and take home finished work.'],
        ['When are the painting batches?', 'Teen batches run on Saturday (5–6:30 pm) and Sunday (11 am–12:30 pm, or 10:30 am–12:30 pm for the special batch). Short-term courses run on weekdays (Wednesday to Friday, any two days).'],
        ['How do I book a painting class?', 'Tap “Reserve a Seat” to send your details on WhatsApp, call ' . cfg('phone_display') . ', or visit the studio ' . cfg('hours_days') . ', ' . cfg('hours_time') . '.'],
    ],
    'related' => [['Drawing classes in Coimbatore', 'drawing-classes-coimbatore.php'], ['Art classes for kids & adults', 'art-classes-coimbatore.php'], ['Read our art blog', 'blog.php'], ['See student paintings', 'gallery.php?category=painting#student-gallery']],
];
require __DIR__ . '/includes/header.php';
require __DIR__ . '/includes/landing.php';
require __DIR__ . '/includes/footer.php';
