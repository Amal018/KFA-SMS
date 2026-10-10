<?php
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
$page = [
    'id' => 'courses',
    'title' => 'Drawing Classes in Coimbatore for Kids & Adults | Kalalaya',
    'description' => 'Drawing class near you in Coimbatore: pencil drawing, shading, portraits and sketching for ages 5 to adults at Kalalaya Fine Arts, since 2002.',
    'path' => 'drawing-classes-coimbatore.php',
    'footer' => 'full',
    'og_image' => 'assets/images/courses/cat-young.jpg',
    'crumbs' => [['Home', ''], ['Courses', 'courses.php'], ['Drawing Classes in Coimbatore', 'drawing-classes-coimbatore.php']],
];
$areas = areas_sentence();
$L = [
    'eyebrow' => 'Drawing Classes · Coimbatore',
    'h1' => 'Drawing Classes in',
    'h1_accent' => 'Coimbatore',
    'lead' => 'Pencil drawing, shading, sketching and portraits — taught step by step for children from age 5, teenagers and adults at our studio in Maniyakarampalayam.',
    'img' => 'assets/images/courses/cat-young.jpg',
    'img_alt' => 'Young girl drawing with coloured pencils at a table',
    'intro' => [
        'If you have been searching for a <strong>drawing class near me</strong> in Coimbatore, Kalalaya Fine Arts has been teaching drawing in the city since 2002. Our studio on Rabindranath Tagore Road, Maniyakarampalayam is a short ride for families in ' . e($areas) . '.',
        'Every student starts with the fundamentals — lines, shapes, proportion and light — and moves on at their own pace to shading, still life, portraits and figure drawing. Classes are guided by founder <a href="about.php#founder">Mr. Anthony Raj, D.F.A., TTC.</a>, who has more than 25 years of experience in art education.',
    ],
    'sections' => [
        ['What students learn in our drawing classes', [
            'The syllabus is structured by age, so a six-year-old and a sixteen-year-old each get work that suits them:',
        ], [
            '<b>Ages 5–7:</b> pencil drawing and colouring, shapes and colour recognition.',
            '<b>Ages 8–12:</b> fruits, flowers, designs, symmetrical drawing, 3D objects, advanced pencil shading, portrait fundamentals and cartoons.',
            '<b>Ages 13–18:</b> free-hand drawing, perspective, still life with light and shade, portraits, human figure, animals and birds, and charcoal.',
            '<b>Career-focused students:</b> preparation for the Tamil Nadu Government Technical Examination in drawing — free-hand outline, model drawing and geometrical drawing.',
        ]],
        ['Why a regular drawing class helps', [
            'Drawing trains the eye and the hand together. Children who draw regularly build fine motor control, concentration and patience, and older students develop the observation skills that every art, design and architecture course depends on. A weekly class also gives screen-free, hands-on time with real materials.',
        ]],
        ['Batch timings', [
            'Kids batches run on weekday evenings (Wednesday to Friday, any two days, 5–6 pm or 6–7 pm). Students aged 8–18 can choose Saturday evening (5–6:30 pm) or Sunday morning (11 am–12:30 pm, or the special batch from 10:30 am). See <a href="course-details.php">full timings and syllabus</a>.',
        ]],
    ],
    'courses' => ['kids', 'young-artists', 'teen-artists', 'professional'],
    'faqs' => [
        ['Where is the nearest drawing class to me in Coimbatore?', 'Kalalaya Fine Arts is at 511/1 Rabindranath Tagore Road, Maniyakarampalayam, Coimbatore 641006. Families attend from nearby areas such as ' . $areas . '. Use the Get Directions button for the route from your location.'],
        ['What age can my child start drawing classes?', 'Children can join from age 5. The kids batch focuses on pencil drawing and colouring; from age 8 students move to drawing fundamentals, shading and portraits.'],
        ['Do you teach drawing for adults and beginners?', 'Yes. Adults and complete beginners are welcome. Short-term courses and regular batches are available — contact us to find a timing that suits you.'],
        ['Do you prepare students for the Tamil Nadu Government drawing examination?', 'Yes. Our one-year professional course prepares students for the Tamil Nadu Government Technical Examination in Drawing & Painting, covering free-hand outline, model drawing, geometrical drawing, painting and design.'],
        ['How do I join a drawing class at Kalalaya?', 'Tap “Reserve a Seat” on this page to send your details on WhatsApp, call ' . cfg('phone_display') . ', or visit the studio between ' . cfg('hours_time') . ', ' . cfg('hours_days') . '.'],
    ],
    'related' => [['Painting classes in Coimbatore', 'painting-classes-coimbatore.php'], ['Art classes for kids & adults', 'art-classes-coimbatore.php'], ['Read our art blog', 'blog.php'], ['See student artwork', 'gallery.php#student-gallery']],
];
require __DIR__ . '/includes/header.php';
require __DIR__ . '/includes/landing.php';
require __DIR__ . '/includes/footer.php';
