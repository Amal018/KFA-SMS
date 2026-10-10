/* =====================================================================
   GALLERY PAGE — Student Gallery (built by PHP from the student-gallery/
   folder). Category filter buttons, "Show more" paging, deep links
   (gallery.php?category=painting). The lightbox only shows visible items.
   ===================================================================== */
(function () {
    'use strict';
    var PAGE = 24;
    var wall = document.querySelector('[data-gallery]'), bar = document.querySelector('[data-gallery-filters]');
    if (!wall || !bar) return;
    var items = [].slice.call(wall.children), more = document.querySelector('[data-gallery-more]');
    var buttons = [].slice.call(bar.querySelectorAll('button[data-cat]'));
    var cat = 'all', shown = PAGE;

    function render(animate) {
        var match = items.filter(function (li) { return cat === 'all' || li.getAttribute('data-cat') === cat; });
        items.forEach(function (li) { li.hidden = true; li.classList.remove('is-entering'); });
        match.forEach(function (li, n) {
            if (n >= shown) return;
            li.hidden = false;
            // only the visible artworks are part of the lightbox group
            var b = li.querySelector('.art-wall__btn');
            if (animate) { li.style.setProperty('--n', Math.min(n % PAGE, 20)); li.classList.add('is-entering'); }
            b.setAttribute('data-lightbox', b.getAttribute('data-lightbox') || b.getAttribute('data-lb'));
        });
        items.forEach(function (li) {
            if (!li.hidden) return;
            var b = li.querySelector('.art-wall__btn');
            if (b.hasAttribute('data-lightbox')) { b.setAttribute('data-lb', b.getAttribute('data-lightbox')); b.removeAttribute('data-lightbox'); }
        });
        if (more) more.hidden = match.length <= shown;
    }
    function select(c, animate) {
        if (!buttons.some(function (b) { return b.getAttribute('data-cat') === c; })) c = 'all';
        cat = c; shown = PAGE;
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === c)); });
        render(animate);
    }

    bar.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-cat]');
        if (!b) return;
        var c = b.getAttribute('data-cat');
        select(c, true);
        if (window.Kalalaya && Kalalaya.setParam) {
            var u = new URL(location.href);
            if (c === 'all') u.searchParams.delete('category'); else u.searchParams.set('category', c);
            history.replaceState(null, '', u.pathname + u.search + u.hash);
        }
    });
    if (more) more.addEventListener('click', function () { shown += PAGE; render(true); });

    var start = new URLSearchParams(location.search).get('category');
    select(start || 'all', false);
    if (start) document.getElementById('student-gallery').scrollIntoView();
})();
