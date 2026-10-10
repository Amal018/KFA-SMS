/* =====================================================================
   GALLERY PAGE — renders "Our Talented Students" from the talented-students/ folder
   Shows STUDENTS_PER_PAGE cards per page with working pagination.
   ===================================================================== */
(function () {
    'use strict';
    var STUDENTS_PER_PAGE = 10;
    var K = window.Kalalaya, students = window.KALALAYA_STUDENTS || [];
    var grid = document.getElementById('student-grid');
    var pager = document.getElementById('student-pagination');
    if (!grid) return;

    var total = Math.max(1, Math.ceil(students.length / STUDENTS_PER_PAGE));
    var current = Math.min(Math.max(parseInt(K.getParam('page'), 10) || 1, 1), total);

    function profileOf(s) { return s.profile || 'assets/images/placeholder.svg'; }

    function card(s) {
        var meta = K.esc(s.course) + (s.age ? '<span class="sep" aria-hidden="true"></span>Age ' + K.esc(s.age) : '');
        var url = 'student-gallery.php?student=' + encodeURIComponent(s.id);
        return '<li class="card student-card reveal">' +
            '<img src="' + K.esc(profileOf(s)) + '" alt="' + K.esc(s.name) + ', ' + K.esc(s.course) + ' student" width="400" height="258" loading="lazy">' +
            '<div class="student-card__body"><h3>' + K.esc(s.name) + '</h3><p class="meta">' + meta + '</p>' +
            '<a class="btn btn--outline" href="' + url + '" aria-label="View ' + K.esc(s.name) + '’s gallery">View Gallery ' + K.icon.right + '</a></div></li>';
    }

    function render(page, scroll) {
        current = page;
        if (!students.length) { grid.innerHTML = '<li class="gallery-empty">Student artwork will be added soon.</li>'; return; }
        var start = (page - 1) * STUDENTS_PER_PAGE;
        grid.innerHTML = students.slice(start, start + STUDENTS_PER_PAGE).map(card).join('');
        K.observeReveal(grid);
        K.renderPagination(pager, page, total, function (p) { render(p, true); });
        K.setParam('page', page);
        if (scroll) document.getElementById('students-work').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    render(current, false);
})();
