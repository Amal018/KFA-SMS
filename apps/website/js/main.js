/* =====================================================================
   KALALAYA FINE ARTS — SHARED SCRIPT
   Mobile menu · dropdowns · sticky header · reveal-on-scroll ·
   lightbox · pagination helper · broken-image fallback
   ===================================================================== */
(function () {
    'use strict';
    var doc = document, body = doc.body;
    var K = (window.Kalalaya = window.Kalalaya || {});
    var PLACEHOLDER = 'assets/images/placeholder.svg';

    /* ---------- helpers ---------- */
    K.esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };
    K.icon = {
        right: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
        left: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'
    };
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- broken image fallback (works for images added later too) ---------- */
    doc.addEventListener('error', function (e) {
        var t = e.target;
        if (t && t.tagName === 'IMG' && !t.dataset.fallback && t.src.indexOf(PLACEHOLDER) === -1) {
            t.dataset.fallback = '1';
            t.src = PLACEHOLDER;
        }
    }, true);

    /* ---------- mobile menu ---------- */
    var toggle = doc.querySelector('.nav-toggle');
    var nav = doc.getElementById('primary-nav');
    var backdrop = doc.querySelector('.nav-backdrop');
    function setMenu(open) {
        if (!toggle) return;
        body.classList.toggle('nav-open', open);
        body.classList.toggle('no-scroll', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        if (backdrop) backdrop.hidden = !open;
        if (open) { var first = nav.querySelector('a, button'); if (first) first.focus(); }
    }
    if (toggle && nav) {
        toggle.addEventListener('click', function () { setMenu(!body.classList.contains('nav-open')); });
        if (backdrop) backdrop.addEventListener('click', function () { setMenu(false); });
        nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
        window.addEventListener('resize', function () { if (window.innerWidth > 1024 && body.classList.contains('nav-open')) setMenu(false); });
    }

    /* ---------- dropdowns (click / tap / keyboard; hover handled in CSS) ---------- */
    var dropItems = doc.querySelectorAll('.has-dropdown');
    function closeDrops(except) {
        dropItems.forEach(function (li) {
            if (li !== except) {
                li.classList.remove('is-open');
                var b = li.querySelector('.dropdown-toggle'); if (b) b.setAttribute('aria-expanded', 'false');
            }
        });
    }
    dropItems.forEach(function (li) {
        var btn = li.querySelector('.dropdown-toggle');
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = !li.classList.contains('is-open');
            closeDrops(li);
            li.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', String(open));
        });
        li.addEventListener('focusout', function (e) {
            if (window.innerWidth > 1024 && !li.contains(e.relatedTarget)) { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
        });
    });
    doc.addEventListener('click', function (e) { if (!e.target.closest('.has-dropdown')) closeDrops(); });
    doc.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var openLi = doc.querySelector('.has-dropdown.is-open');
        closeDrops();
        if (openLi) openLi.querySelector('.dropdown-toggle').focus();
        if (body.classList.contains('nav-open') && !K.lightboxOpen) { setMenu(false); toggle.focus(); }
    });

    /* ---------- header shadow on scroll ---------- */
    var header = doc.querySelector('.site-header');
    var onScroll = function () { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* ---------- reveal on scroll ---------- */
    K.observeReveal = function (root) {
        var els = (root || doc).querySelectorAll('.reveal:not(.is-visible)');
        if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-visible'); }); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        els.forEach(function (el) { io.observe(el); });
    };
    K.observeReveal();

    /* ---------- lightbox ---------- */
    var lb = doc.getElementById('lightbox');
    if (lb) {
        var lbImg = lb.querySelector('.lightbox__img'), lbCap = lb.querySelector('.lightbox__caption');
        var prevBtn = lb.querySelector('.lightbox__nav--prev'), nextBtn = lb.querySelector('.lightbox__nav--next');
        var items = [], idx = 0, lastFocus = null;

        function show(i) {
            idx = (i + items.length) % items.length;
            var it = items[idx];
            lbImg.src = it.src;
            lbImg.alt = it.alt || it.caption || '';
            lbCap.innerHTML = it.caption ? K.esc(it.caption) + (it.sub ? '<small>' + K.esc(it.sub) + '</small>' : '') : '';
            prevBtn.hidden = nextBtn.hidden = items.length < 2;
        }
        K.openLightbox = function (list, start) {
            if (!list || !list.length) return;
            items = list; lastFocus = doc.activeElement;
            show(start || 0);
            lb.hidden = false; K.lightboxOpen = true;
            body.classList.add('no-scroll');
            lb.querySelector('.lightbox__close').focus();
        };
        function close() {
            lb.hidden = true; K.lightboxOpen = false;
            if (!body.classList.contains('nav-open')) body.classList.remove('no-scroll');
            if (lastFocus) lastFocus.focus();
        }
        lb.querySelector('.lightbox__close').addEventListener('click', close);
        prevBtn.addEventListener('click', function () { show(idx - 1); });
        nextBtn.addEventListener('click', function () { show(idx + 1); });
        lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__figure')) close(); });
        doc.addEventListener('keydown', function (e) {
            if (lb.hidden) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') show(idx - 1);
            else if (e.key === 'ArrowRight') show(idx + 1);
            else if (e.key === 'Tab') { // keep focus inside the dialog
                var f = [].slice.call(lb.querySelectorAll('button:not([hidden])'));
                var i = f.indexOf(doc.activeElement);
                e.preventDefault();
                f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
            }
        });
        // touch swipe
        var sx = null;
        lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', function (e) {
            if (sx === null) return;
            var dx = e.changedTouches[0].clientX - sx; sx = null;
            if (Math.abs(dx) > 50 && items.length > 1) show(idx + (dx < 0 ? 1 : -1));
        });

        // Any [data-lightbox] element opens the viewer with its group
        doc.addEventListener('click', function (e) {
            var trg = e.target.closest('[data-lightbox]');
            if (!trg) return;
            e.preventDefault();
            var group = trg.closest('[data-lightbox-group]');
            var nodes = group ? [].slice.call(group.querySelectorAll('[data-lightbox]')) : [trg];
            K.openLightbox(nodes.map(function (n) {
                var img = n.querySelector('img');
                return { src: n.getAttribute('data-lightbox'), caption: n.getAttribute('data-caption'), sub: n.getAttribute('data-sub'), alt: img ? img.alt : '' };
            }), nodes.indexOf(trg));
        });
    }

    /* ---------- pagination helper ---------- */
    K.renderPagination = function (navEl, current, total, onChange) {
        if (!navEl) return;
        if (total <= 1) { navEl.innerHTML = ''; return; }
        var h = '<button type="button" data-p="' + (current - 1) + '" aria-label="Previous page"' + (current === 1 ? ' disabled' : '') + '>' + K.icon.left + '</button>';
        for (var i = 1; i <= total; i++) {
            h += '<button type="button" data-p="' + i + '" aria-label="Page ' + i + '"' + (i === current ? ' aria-current="page"' : '') + '>' + i + '</button>';
        }
        h += '<button type="button" data-p="' + (current + 1) + '" aria-label="Next page"' + (current === total ? ' disabled' : '') + '>' + K.icon.right + '</button>';
        navEl.innerHTML = h;
        navEl.onclick = function (e) {
            var b = e.target.closest('button[data-p]');
            if (!b || b.disabled) return;
            onChange(parseInt(b.getAttribute('data-p'), 10));
        };
    };

    /* Read / write an integer query parameter without reloading */
    K.getParam = function (name) { return new URLSearchParams(window.location.search).get(name); };
    K.setParam = function (name, value) {
        if (!window.history || !history.replaceState) return;
        var u = new URL(window.location.href);
        if (value == null || value === 1) u.searchParams.delete(name); else u.searchParams.set(name, value);
        history.replaceState(null, '', u.pathname + u.search + u.hash);
    };
})();
