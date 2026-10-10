/* =====================================================================
   HOME PAGE — age-based course slider · floating student gallery
   ===================================================================== */
(function () {
    'use strict';
    var doc = document, K = window.Kalalaya || {};

    /* ---------- age slider ---------- */
    var slider = doc.querySelector('[data-age-slider]');
    if (slider) {
        var input = slider.querySelector('input[type=range]');
        var fill = slider.querySelector('.age-slider__fill');
        var stops = [].slice.call(slider.querySelectorAll('[data-stop]'));
        var panels = [].slice.call(slider.querySelectorAll('[data-panel]'));
        var max = +input.max, current = -1;

        var show = function (i) {
            i = Math.max(0, Math.min(max, i));
            fill.style.width = (max ? i / max * 100 : 0) + '%';
            if (i === current) return;
            var prev = current; current = i;
            input.value = i;
            input.setAttribute('aria-valuetext', stops[i].textContent);
            stops.forEach(function (s, n) { if (n === i) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current'); });
            panels.forEach(function (p, n) {
                if (n === i) {
                    p.hidden = false;
                    p.classList.remove('is-active', 'from-left', 'from-right');
                    void p.offsetWidth; // restart the entrance animation
                    p.classList.add('is-active', prev > i ? 'from-left' : 'from-right');
                } else { p.hidden = true; p.classList.remove('is-active'); }
            });
        };
        input.addEventListener('input', function () { show(Math.round(+input.value)); });
        stops.forEach(function (s) { s.addEventListener('click', function () { show(+s.getAttribute('data-stop')); }); });
        // swipe between age groups on touch screens
        var sx = null, box = slider.querySelector('.age-panels');
        box.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
        box.addEventListener('touchend', function (e) {
            if (sx === null) return;
            var dx = e.changedTouches[0].clientX - sx; sx = null;
            if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
        });
        show(0);
    }

    /* ---------- floating gallery (two rows drifting in opposite directions) ---------- */
    // artworks come from the student-gallery/ folder (printed by index.php)
    var fg = doc.querySelector('[data-float-gallery]');
    var pick = window.KALALAYA_GALLERY || [];
    if (fg && pick.length) {
        var tile = function (i) {
            var label = i.title + (i.name ? ' by ' + i.name : '');
            return '<button type="button" class="float-tile" data-lightbox="' + K.esc(i.img) + '" data-caption="' + K.esc(i.title + (i.name ? ' — ' + i.name : '')) + '" data-sub="' + K.esc(i.category) + '" aria-label="View larger: ' + K.esc(label) + '">' +
                '<img src="' + K.esc(i.img) + '" alt="' + K.esc(label) + '" loading="lazy" width="260" height="200">' +
                '<span class="float-tile__tip"><b>' + K.esc(i.name || i.title) + '</b>' + K.esc((i.name ? i.title + ' · ' : '') + i.category) + '</span></button>';
        };
        var half = Math.ceil(pick.length / 2);
        var rows = fg.querySelectorAll('.float-row__track');
        [pick.slice(0, half), pick.slice(half)].forEach(function (set, r) {
            var html = set.map(tile).join('');
            // duplicate for a seamless loop; the copy is hidden from assistive tech
            rows[r].innerHTML = html + '<span class="float-row__dup" aria-hidden="true">' + html.replace(/<button /g, '<button tabindex="-1" ').replace(/data-lightbox=/g, 'data-copy=') + '</span>';
        });
        // a click on a loop copy opens the original, so the viewer lists each artwork once
        fg.addEventListener('click', function (e) {
            var c = e.target.closest('[data-copy]');
            if (!c) return;
            var track = c.closest('.float-row__track');
            var copies = [].slice.call(track.querySelectorAll('[data-copy]'));
            track.querySelectorAll('[data-lightbox]')[copies.indexOf(c)].click();
        });
    } else if (fg) {
        fg.closest('section').hidden = true;
    }
})();
