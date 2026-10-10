/* =====================================================================
   KALALAYA FINE ARTS — MOTION LAYER
   Letter-by-letter headings · scroll progress · scroll parallax ·
   staggered reveals · count-up stats · sticky section tabs ·
   seat booking dialog (WhatsApp)
   Everything respects prefers-reduced-motion and needs no libraries.
   ===================================================================== */
(function () {
    'use strict';
    var doc = document, body = doc.body, win = window;
    var reduceMotion = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- scroll progress bar ---------- */
    var bar = doc.querySelector('.scroll-progress');
    if (bar) {
        var setBar = function () {
            var max = doc.documentElement.scrollHeight - win.innerHeight;
            bar.style.transform = 'scaleX(' + (max > 0 ? win.scrollY / max : 0) + ')';
        };
        win.addEventListener('scroll', setBar, { passive: true });
        win.addEventListener('resize', setBar);
        setBar();
    }

    /* ---------- sticky offset = real header height (used by .course-tabs) ---------- */
    var siteHeader = doc.querySelector('.site-header');
    if (siteHeader) {
        var setTop = function () { doc.documentElement.style.setProperty('--sticky-top', siteHeader.offsetHeight + 'px'); };
        win.addEventListener('resize', setTop); win.addEventListener('load', setTop); setTop();
        if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(setTop);
    }

    /* ---------- letter-by-letter page headings ---------- */
    function splitLetters(el) {
        var i = 0, label = (el.innerText || el.textContent).replace(/\s+/g, ' ').trim();
        (function walk(node) {
            [].slice.call(node.childNodes).forEach(function (n) {
                if (n.nodeType === 3) {
                    var frag = doc.createDocumentFragment();
                    n.textContent.split(/(\s+)/).forEach(function (word) {
                        if (!word) return;
                        if (/^\s+$/.test(word)) { frag.appendChild(doc.createTextNode(' ')); return; }
                        var w = doc.createElement('span');
                        w.className = 'split-word';
                        word.split('').forEach(function (ch) {
                            var c = doc.createElement('span');
                            c.className = 'split-char';
                            c.style.setProperty('--i', i++);
                            c.textContent = ch;
                            w.appendChild(c);
                        });
                        frag.appendChild(w);
                    });
                    n.parentNode.replaceChild(frag, n);
                } else if (n.nodeType === 1 && n.tagName !== 'BR') {
                    walk(n);
                }
            });
        })(el);
        el.setAttribute('aria-label', label);
        [].forEach.call(el.children, function (c) { c.setAttribute('aria-hidden', 'true'); });
        el.classList.add('is-split');
    }
    if (!reduceMotion) doc.querySelectorAll('.hero .h-display, .page-hero .h-display').forEach(splitLetters);
    requestAnimationFrame(function () { body.classList.add('is-loaded'); });

    /* ---------- staggered reveals for card grids ---------- */
    doc.querySelectorAll('.category-cards, .feature-cards, .master-grid, .thumb-grid, .why-grid, .course-cards').forEach(function (grid) {
        [].forEach.call(grid.children, function (el, n) {
            el.classList.add('reveal');
            el.style.setProperty('--d', n % 6);
        });
    });
    if (window.Kalalaya && Kalalaya.observeReveal) Kalalaya.observeReveal();

    /* ---------- floating art tools: gentle scroll parallax ---------- */
    var tools = [].slice.call(doc.querySelectorAll('[data-depth]'));
    if (tools.length && !reduceMotion) {
        var ticking = false;
        var apply = function () {
            var sy = Math.min(win.scrollY, 900);
            tools.forEach(function (t) {
                t.style.setProperty('--py', (-sy * parseFloat(t.getAttribute('data-depth')) * .012).toFixed(1) + 'px');
            });
            ticking = false;
        };
        win.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    }

    /* ---------- count-up numbers ---------- */
    var counters = doc.querySelectorAll('[data-count]');
    if (counters.length && 'IntersectionObserver' in win && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                io.unobserve(en.target);
                var el = en.target, to = +el.getAttribute('data-count'), from = +(el.getAttribute('data-from') || 0);
                var suf = el.getAttribute('data-suffix') || '', t0 = performance.now(), dur = 1600;
                (function tick(now) {
                    var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.round(from + (to - from) * e) + suf;
                    if (p < 1) requestAnimationFrame(tick);
                })(t0);
            });
        }, { threshold: .6 });
        counters.forEach(function (c) { io.observe(c); });
    }

    /* ---------- sticky section tabs (scroll-spy) ---------- */
    doc.querySelectorAll('[data-spy]').forEach(function (nav) {
        var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
        var targets = links.map(function (a) { return doc.getElementById(a.getAttribute('href').slice(1)); });
        if (!('IntersectionObserver' in win)) return;
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var i = targets.indexOf(en.target);
                links.forEach(function (a, n) { a.classList.toggle('is-active', n === i); if (n === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
                var act = links[i];
                if (act && act.scrollIntoView && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: act.offsetLeft - 20, behavior: reduceMotion ? 'auto' : 'smooth' });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        targets.forEach(function (t) { if (t) spy.observe(t); });
    });

    /* ---------- seat booking dialog → WhatsApp ---------- */
    var dlg = doc.getElementById('booking');
    if (dlg) {
        var form = dlg.querySelector('form'), steps = [].slice.call(form.querySelectorAll('.booking__step'));
        var marks = [].slice.call(dlg.querySelectorAll('.booking__steps li'));
        var back = form.querySelector('[data-back]'), next = form.querySelector('[data-next]'), send = form.querySelector('[data-send]');
        var err = form.querySelector('.booking__error'), step = 0, lastFocus = null;
        // order matches includes/courses.php ids → config course_options
        var COURSE_IDS = ['kids', 'young-artists', 'teen-artists', 'professional', 'short-term'];

        var go = function (n) {
            step = n; err.textContent = '';
            steps.forEach(function (s, i) { s.hidden = i !== n; });
            marks.forEach(function (m, i) { m.classList.toggle('is-on', i <= n); });
            back.hidden = n === 0; next.hidden = n === steps.length - 1; send.hidden = !next.hidden;
            var f = steps[n].querySelector('input:checked, input, textarea');
            if (f) f.focus({ preventScroll: true });
        };
        var valid = function () {
            var s = steps[step];
            var radio = s.querySelector('input[type=radio]');
            if (radio && !s.querySelector('input[type=radio]:checked')) { err.textContent = 'Please choose one option.'; return false; }
            var bad = [].slice.call(s.querySelectorAll('input[required]:not([type=radio])')).filter(function (i) { return !i.value.trim() || !i.checkValidity(); })[0];
            if (bad) { err.textContent = 'Please fill in “' + bad.closest('label').querySelector('span').firstChild.textContent.trim() + '”.'; bad.focus(); return false; }
            return true;
        };
        var open = function (courseId) {
            lastFocus = doc.activeElement;
            form.reset();
            var idx = COURSE_IDS.indexOf(courseId);
            var radios = form.querySelectorAll('input[name=course]');
            if (idx > -1 && radios[idx]) radios[idx].checked = true;
            dlg.hidden = false; body.classList.add('no-scroll');
            requestAnimationFrame(function () { dlg.classList.add('is-open'); });
            go(idx > -1 ? 1 : 0);
        };
        var close = function () {
            dlg.classList.remove('is-open'); body.classList.remove('no-scroll');
            setTimeout(function () { dlg.hidden = true; }, reduceMotion ? 0 : 250);
            if (lastFocus) lastFocus.focus();
        };

        doc.addEventListener('click', function (e) {
            var t = e.target.closest('[data-booking]');
            if (!t) return;
            e.preventDefault();
            open(t.getAttribute('data-booking'));
        });
        next.addEventListener('click', function () { if (valid()) go(step + 1); });
        back.addEventListener('click', function () { go(step - 1); });
        dlg.querySelector('.booking__close').addEventListener('click', close);
        dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
        form.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT' && send.hidden) { e.preventDefault(); if (valid()) go(step + 1); }
        });
        doc.addEventListener('keydown', function (e) {
            if (dlg.hidden) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'Tab') {
                var f = [].slice.call(dlg.querySelectorAll('button:not([hidden]), input, textarea, a[href]')).filter(function (x) { return x.offsetParent !== null; });
                var i = f.indexOf(doc.activeElement);
                if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
                else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
            }
        });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!valid()) return;
            var v = function (n) { var el = form.elements[n]; return el ? String(el.value || '').trim() : ''; };
            var lines = [
                'Hello Kalalaya Fine Arts! I would like to reserve a seat.',
                '',
                'Course: ' + v('course'),
                'Student: ' + v('student') + ' (Age ' + v('age') + ')',
                v('parent') ? 'Contact: ' + v('parent') : '',
                'Preferred timing: ' + v('timing'),
                v('note') ? 'Note: ' + v('note') : ''
            ].filter(function (l, i) { return l || i === 1; });
            win.open('https://wa.me/' + form.getAttribute('data-whatsapp') + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
            close();
        });
    }
})();
