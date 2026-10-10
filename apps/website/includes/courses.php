<?php
/**
 * Course content — edit here. Used by course-details.php (full listing)
 * and the home page age slider.
 *   schedule items: [icon, line1, line2]
 *   slider:         short label on the age slider
 *   focus/outcome:  one-line summaries shown on the home page slider
 */
if (!defined('KALALAYA')) { http_response_code(403); exit; }

return [
    [
        'id' => 'kids', 'label' => 'Kids (Ages 5-7 Yrs)', 'heading' => 'Little Hands, Big Imagination',
        'slider' => 'Ages 5–7', 'name' => 'Kids Art Class',
        'intro' => 'Fun and engaging art classes to help young learners explore colours, shapes and creativity.',
        'focus' => 'Pencil drawing, colouring, shapes and colour recognition.',
        'outcome' => 'Fine motor skills, colour confidence and a love for creating.',
        'schedule' => [['calendar', 'Wednesday to Friday', '(Any 2 Days)'], ['clock', 'Batch I', '5pm – 6pm'], ['clock', 'Batch II', '6pm – 7pm']],
        'img' => 'detail-kids', 'alt' => 'Child colouring a butterfly drawing with a crayon',
        'title' => 'Colouring', 'subtitle' => 'Pencil Drawing & Colouring', 'topics' => [],
    ],
    [
        'id' => 'young-artists', 'label' => 'Students (8-12 Yrs)', 'heading' => 'Build Skills, Express Ideas',
        'slider' => 'Ages 8–12', 'name' => 'Young Artists',
        'intro' => 'A structured program to develop drawing skills, explore art techniques and build a strong foundation in fine arts.',
        'focus' => 'Drawing fundamentals, 3D objects, pencil shading and portrait basics.',
        'outcome' => 'Observation, proportion and a strong drawing foundation.',
        'schedule' => [['calendar', 'Saturday', '5 pm – 6:30 pm'], ['clock', 'Sunday Regular Batch', '11 am – 12:30 pm'], ['clock', 'Sunday Special Batch', '10:30 am – 12:30 pm']],
        'img' => 'detail-drawing', 'alt' => 'Pencil shading study of a ball',
        'title' => 'Drawing Fundamentals', 'subtitle' => '',
        'topics' => ['Fruits & Vegetables', 'Flowers', 'Designs', 'Symmetrical Drawing', '3 D Objects', 'Advanced Pencil Shading', 'Portrait Fundamentals', 'Human Anatomy Basics', 'Cartoons'],
    ],
    [
        'id' => 'teen-artists', 'label' => 'Students (13-18 Yrs)', 'heading' => 'Explore. Experiment. Evolve.',
        'slider' => 'Ages 13–18', 'name' => 'Teen Artists',
        'intro' => 'For young artists ready to take their creativity further with advanced techniques and diverse art forms.',
        'focus' => 'Watercolour, oil and acrylic painting, portraits, landscapes and perspective.',
        'outcome' => 'Command of multiple mediums and a personal portfolio.',
        'schedule' => [['calendar', 'Saturday', '5 pm – 6:30 pm'], ['clock', 'Sunday Regular Batch', '11 am – 12:30 pm'], ['clock', 'Sunday Special Batch', '10:30 am – 12:30 pm']],
        'img' => 'detail-painting', 'alt' => 'Painting of a tree on a cliff in progress',
        'title' => 'Painting', 'subtitle' => '',
        'topics' => ['Water Colour', 'Oil Painting', 'Acrylic Painting', 'Subject', 'Portrait', 'Human Figure', 'Still Life (Light and Shade)', 'Landscape', 'Perspective', 'Free Hand Drawing', 'Animals & Birds', 'Mandala Art', 'Illusion', 'Charcoal'],
    ],
    [
        'id' => 'professional', 'label' => 'Professional Courses', 'heading' => 'Learn for a Brighter Future',
        'slider' => 'Career', 'name' => 'Professional Course',
        'intro' => 'Specialized programs for students aspiring to build a career in the field of art and design.',
        'focus' => 'TN Govt. Technical Examination: model drawing, painting, design and fashion sketching.',
        'outcome' => 'Exam readiness and a pathway into art and design careers.',
        'schedule' => [['calendar', '1 Year', ''], ['clock', 'Wednesday to Friday', '(Any 2 Days)'], ['clock', '2 Hours per day', '']],
        'img' => 'detail-professional', 'alt' => 'Fashion illustration sketches on paper',
        'title' => 'TamilNadu Govt. Technical Examination', 'subtitle' => '(Drawing & Painting)',
        'topics' => ['Freehand Outline & Model Drawing', 'Painting', 'Water Colour (or)', 'Oil Painting', 'Design', 'Textile Design(or)', 'Interior Design', 'Geometrical Drawing', 'Fashion Sketching', 'Illustration'],
    ],
    [
        'id' => 'short-term', 'label' => 'Short Term Courses', 'heading' => 'Create, Learn, Take Home',
        'slider' => 'Short-Term & Adults', 'name' => 'Short-Term Course',
        'intro' => 'Weekend and short-term courses to explore your favourite art forms and techniques.',
        'focus' => 'Glass painting, Tanjore glass reverse painting, mural work and mandala art.',
        'outcome' => 'Finished pieces to take home in a few weeks.',
        // PLACEHOLDER: the mockup reads "Months (48 Hours)" — confirm the number of months.
        'schedule' => [['calendar', 'Months (48 Hours)', ''], ['clock', 'Wednesday to Friday', '(Any 2 Days)']],
        'img' => 'detail-glass', 'alt' => 'Stained glass panel with white and pink flowers',
        'title' => 'Glass Painting', 'subtitle' => '',
        'topics' => ['Tanjore Glass Reverse Painting', 'Mural Work', 'Portrait', 'Still Life', 'Life Drawing', 'Mandala Art'],
    ],
];
