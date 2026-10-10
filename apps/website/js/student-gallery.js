/* =====================================================================
   STUDENT GALLERY — one reusable page for every student.
   Reads ?student=<id>, finds the matching student from the talented-students/ folder
   and renders the profile + paginated artwork grid.
   ===================================================================== */
(function () {
    'use strict';
    var ARTWORKS_PER_PAGE = 9;
    var K = window.Kalalaya, students = window.KALALAYA_STUDENTS || [];
    var app = document.getElementById('student-app');
    if (!app) return;

    var id = (K.getParam('student') || '').toLowerCase().trim();
    var s = null;
    for (var i = 0; i < students.length; i++) if (students[i].id === id) { s = students[i]; break; }

    if (!s) {
        app.hidden = true;
        document.getElementById('student-not-found').hidden = false;
        document.title = 'Student not found | Kalalaya Fine Arts';
        var robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex';
        document.head.appendChild(robots);
        return;
    }

    var first = s.name.split(' ')[0];
    var possessive = first + (/s$/i.test(first) ? '’' : '’s');

    /* ---- profile ---- */
    document.title = s.name + ' — Student Gallery | Kalalaya Fine Arts';
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', 'Artwork by ' + s.name + ' (' + s.course + ') at Kalalaya Fine Arts, Coimbatore.');
    var photo = document.getElementById('sp-photo');
    photo.src = s.profile || 'assets/images/placeholder.svg';
    photo.alt = s.name + ', ' + s.course + ' student at Kalalaya Fine Arts';
    document.getElementById('sp-name').textContent = s.name;
    document.getElementById('sp-meta').innerHTML = K.esc(s.course) + (s.age ? '<span class="sep" aria-hidden="true"></span>Age ' + K.esc(s.age) : '');
    document.getElementById('sp-desc').textContent = s.description || '';
    var quote = document.getElementById('sp-quote');
    if (s.quote) quote.innerHTML = s.quote.split('|').map(K.esc).join('<br>'); else quote.hidden = true;
    document.getElementById('sp-work-title').textContent = possessive + ' Artwork';
    document.getElementById('sp-work-desc').textContent = 'A collection of artwork created by ' + first + ' during ' + (s.pronoun || 'their') + ' art journey at Kalalaya Fine Arts.';

    /* ---- artworks ---- */
    var arts = s.artworks || [];
    var grid = document.getElementById('artwork-grid');
    var pager = document.getElementById('artwork-pagination');
    var total = Math.max(1, Math.ceil(arts.length / ARTWORKS_PER_PAGE));
    var current = Math.min(Math.max(parseInt(K.getParam('page'), 10) || 1, 1), total);

    function render(page, scroll) {
        current = page;
        if (!arts.length) { grid.innerHTML = '<li class="gallery-empty">Artwork will be added soon.</li>'; pager.innerHTML = ''; return; }
        var start = (page - 1) * ARTWORKS_PER_PAGE;
        grid.innerHTML = arts.slice(start, start + ARTWORKS_PER_PAGE).map(function (a, n) {
            var alt = (a.title || 'Artwork') + (a.category ? ' — ' + a.category : '') + ' by ' + s.name;
            return '<li class="reveal"><figure class="art-card">' +
                '<button class="art-card__img" type="button" data-index="' + (start + n) + '" aria-label="View larger: ' + K.esc(a.title) + '">' +
                '<img src="' + K.esc(a.image) + '" alt="' + K.esc(alt) + '" width="500" height="340" loading="lazy"></button>' +
                '<figcaption><h3>' + K.esc(a.title) + '</h3><p>' + K.esc(a.category) + '</p></figcaption></figure></li>';
        }).join('');
        K.observeReveal(grid);
        K.renderPagination(pager, page, total, function (p) { render(p, true); });
        K.setParam('page', page);
        if (scroll) grid.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Lightbox lets visitors browse ALL of this student's artworks, across pages
    grid.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-index]');
        if (!b || !K.openLightbox) return;
        K.openLightbox(arts.map(function (a) {
            return { src: a.image, caption: a.title, sub: (a.category ? a.category + ' · ' : '') + s.name, alt: a.title + ' by ' + s.name };
        }), parseInt(b.getAttribute('data-index'), 10));
    });

    render(current, false);
})();
