/* =====================================================================
   DIGITAL EASEL — interactive drawing canvas (home page)
   Brushes: pencil · marker · watercolour · crayon · spray · eraser
   Extras: mandala symmetry · tracing guides · undo/redo · save as PNG
   Mouse, touch and stylus (pressure) via Pointer Events. No libraries.
   ===================================================================== */
(function () {
    'use strict';
    var root = document.querySelector('[data-easel]');
    if (!root) return;

    var MANDALA_SLICES = 8, HISTORY = 20;
    var canvas = root.querySelector('.easel__canvas'), ctx = canvas.getContext('2d');
    var paper = root.querySelector('.easel__paper'), empty = root.querySelector('[data-empty]');
    var guideLayer = root.querySelector('[data-guide-layer]');
    var undoBtn = root.querySelector('[data-undo]'), redoBtn = root.querySelector('[data-redo]');
    var sizeIn = root.querySelector('[data-size]'), alphaIn = root.querySelector('[data-alpha]');
    var sizeOut = root.querySelector('[data-size-out]'), alphaOut = root.querySelector('[data-alpha-out]');
    var mandalaBtn = root.querySelector('[data-mandala]');

    var state = { color: '#5236D9', brush: 'marker', size: 12, alpha: 1, mandala: false };
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
    var undo = [], redo = [], drawing = false, last = null, dirty = false;

    /* ---------- sizing (keeps the drawing when the window resizes) ---------- */
    function fit() {
        var r = paper.getBoundingClientRect();
        var nw = Math.round(r.width), nh = Math.round(r.height);
        if (!nw || !nh || (nw === W && nh === H)) return;
        var keep = null;
        if (W && H) { keep = document.createElement('canvas'); keep.width = canvas.width; keep.height = canvas.height; keep.getContext('2d').drawImage(canvas, 0, 0); }
        W = nw; H = nh;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (keep) ctx.drawImage(keep, 0, 0, keep.width, keep.height, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        undo = []; redo = []; syncHistory(); // snapshots no longer match the new size
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(paper); else window.addEventListener('resize', fit);
    fit();

    /* ---------- helpers ---------- */
    function rgba(hex, a) {
        var n = parseInt(hex.slice(1), 16);
        return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    function rand(a, b) { return a + Math.random() * (b - a); }

    // every point the user draws, repeated around the centre in mandala mode
    function mirrors(p) {
        if (!state.mandala) return [p];
        var cx = W / 2, cy = H / 2, dx = p.x - cx, dy = p.y - cy, out = [];
        for (var k = 0; k < MANDALA_SLICES; k++) {
            var t = k * Math.PI * 2 / MANDALA_SLICES, c = Math.cos(t), s = Math.sin(t);
            out.push({ x: cx + dx * c - dy * s, y: cy + dx * s + dy * c, p: p.p });
            out.push({ x: cx + dx * c + dy * s, y: cy + dx * s - dy * c, p: p.p }); // reflected copy
        }
        return out;
    }

    /* ---------- brushes: each draws one segment a → b ---------- */
    var brushes = {
        pencil: function (a, b, s) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = rgba(state.color, state.alpha * .9);
            ctx.lineWidth = Math.max(1, s * .3);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        },
        marker: function (a, b, s) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = rgba(state.color, state.alpha);
            ctx.lineWidth = s;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        },
        water: function (a, b, s) {
            ctx.globalCompositeOperation = 'multiply';
            stepAlong(a, b, Math.max(2, s * .3), function (x, y) {
                var r = s * rand(.9, 1.4), g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, rgba(state.color, state.alpha * .09));
                g.addColorStop(.75, rgba(state.color, state.alpha * .06));
                g.addColorStop(1, rgba(state.color, 0));
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
            });
        },
        crayon: function (a, b, s) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = rgba(state.color, state.alpha * .55);
            stepAlong(a, b, 1.5, function (x, y) {
                for (var i = 0; i < s * .7; i++) ctx.fillRect(x + rand(-s / 2, s / 2), y + rand(-s / 2, s / 2), rand(.8, 2), rand(.8, 2));
            });
        },
        spray: function (a, b, s) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = rgba(state.color, state.alpha);
            stepAlong(a, b, 4, function (x, y) {
                for (var i = 0; i < s * 1.2; i++) {
                    var ang = rand(0, 6.2832), rad = Math.sqrt(Math.random()) * s * 1.4;
                    ctx.fillRect(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad, 1.2, 1.2);
                }
            });
        },
        eraser: function (a, b, s) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = s * 1.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
    };
    function stepAlong(a, b, gap, fn) {
        var d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / gap));
        for (var i = 1; i <= n; i++) fn(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n);
    }
    function segment(a, b) {
        var s = state.size * (b.p ? .4 + b.p * 1.2 : 1);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        var ma = mirrors(a), mb = mirrors(b);
        for (var i = 0; i < ma.length; i++) brushes[state.brush](ma[i], mb[i], s);
        ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- pointer input ---------- */
    function point(e) {
        var r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pointerType === 'pen' && e.pressure ? e.pressure : 0 };
    }
    canvas.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        snapshot();
        drawing = true; last = point(e);
        segment(last, { x: last.x + .01, y: last.y + .01, p: last.p }); // a tap leaves a dot
        if (!dirty) { dirty = true; empty.hidden = true; }
    });
    canvas.addEventListener('pointermove', function (e) {
        if (!drawing) return;
        var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        if (!evs.length) evs = [e];
        evs.forEach(function (ev) { var p = point(ev); segment(last, p); last = p; });
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
        canvas.addEventListener(t, function () { drawing = false; last = null; });
    });

    /* ---------- history ---------- */
    function snapshot() {
        undo.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (undo.length > HISTORY) undo.shift();
        redo = []; syncHistory();
    }
    function restore(from, to) {
        if (!from.length) return;
        to.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        ctx.putImageData(from.pop(), 0, 0);
        syncHistory();
    }
    function syncHistory() { undoBtn.disabled = !undo.length; redoBtn.disabled = !redo.length; }
    undoBtn.addEventListener('click', function () { restore(undo, redo); });
    redoBtn.addEventListener('click', function () { restore(redo, undo); });
    document.addEventListener('keydown', function (e) {
        if (!(e.ctrlKey || e.metaKey) || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
        var r = root.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return; // only while the easel is on screen
        var k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); restore(undo, redo); }
        else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); restore(redo, undo); }
    });
    root.querySelector('[data-clear]').addEventListener('click', function () {
        if (!dirty) return;
        snapshot();
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore();
        dirty = false; empty.hidden = false;
    });

    /* ---------- toolbar ---------- */
    function pick(group, el) {
        group.forEach(function (b) { b.setAttribute('aria-checked', String(b === el)); });
    }
    var swatches = [].slice.call(root.querySelectorAll('.swatch[data-color]'));
    var tools = [].slice.call(root.querySelectorAll('[data-brush]'));
    function setColor(hex, el) {
        state.color = hex;
        root.style.setProperty('--easel-color', hex);
        pick(swatches, el || null);
        if (state.brush === 'eraser') setBrush('marker'); // choosing a colour means you want to paint
    }
    function setBrush(id) {
        state.brush = id;
        pick(tools, root.querySelector('[data-brush="' + id + '"]'));
        paper.classList.toggle('is-erasing', id === 'eraser');
    }
    swatches.forEach(function (b) { b.addEventListener('click', function () { setColor(b.getAttribute('data-color'), b); }); });
    root.querySelector('[data-color-input]').addEventListener('input', function (e) { setColor(e.target.value, null); });
    tools.forEach(function (b) { b.addEventListener('click', function () { setBrush(b.getAttribute('data-brush')); }); });
    // arrow keys move between options inside each radiogroup
    root.querySelectorAll('[role=radiogroup]').forEach(function (g) {
        g.addEventListener('keydown', function (e) {
            if (!/Arrow(Left|Right|Up|Down)/.test(e.key)) return;
            var items = [].slice.call(g.querySelectorAll('[role=radio]')), i = items.indexOf(document.activeElement);
            if (i < 0) return;
            e.preventDefault();
            var n = items[(i + (/Right|Down/.test(e.key) ? 1 : -1) + items.length) % items.length];
            n.focus(); n.click();
        });
    });
    sizeIn.addEventListener('input', function () { state.size = +sizeIn.value; sizeOut.textContent = sizeIn.value; root.style.setProperty('--easel-size', sizeIn.value + 'px'); });
    alphaIn.addEventListener('input', function () { state.alpha = alphaIn.value / 100; alphaOut.textContent = alphaIn.value + '%'; });
    mandalaBtn.addEventListener('click', function () {
        state.mandala = !state.mandala;
        mandalaBtn.setAttribute('aria-pressed', String(state.mandala));
        paper.classList.toggle('is-mandala', state.mandala);
    });

    /* ---------- tracing guides (outline sits above the canvas, never in the saved image) ---------- */
    var GUIDES = {
        flower: '<circle cx="200" cy="120" r="22"/><ellipse cx="200" cy="72" rx="18" ry="28"/><ellipse cx="200" cy="168" rx="18" ry="28"/><ellipse cx="152" cy="120" rx="28" ry="18"/><ellipse cx="248" cy="120" rx="28" ry="18"/><ellipse cx="166" cy="86" rx="16" ry="26" transform="rotate(-45 166 86)"/><ellipse cx="234" cy="86" rx="16" ry="26" transform="rotate(45 234 86)"/><ellipse cx="166" cy="154" rx="16" ry="26" transform="rotate(45 166 154)"/><ellipse cx="234" cy="154" rx="16" ry="26" transform="rotate(-45 234 154)"/><path d="M200 196 C200 230 196 260 200 292"/><path d="M199 250 C170 230 150 236 140 250 C160 262 182 262 199 250z"/><path d="M201 232 C226 212 248 216 258 230 C238 244 218 244 201 232z"/>',
        fish: '<path d="M80 150 C140 70 260 70 300 150 C260 230 140 230 80 150z"/><path d="M300 150 L362 100 L350 150 L362 200z"/><circle cx="130" cy="135" r="7"/><path d="M110 170 C120 178 132 180 142 176"/><path d="M190 92 C200 70 225 64 245 72 L232 100"/><path d="M200 210 C206 226 222 234 236 230"/><path d="M175 110 C185 130 185 170 175 190M215 104 C225 130 225 170 215 196M255 112 C263 132 263 168 255 188"/>',
        house: '<path d="M100 160 L200 76 L300 160"/><rect x="122" y="150" width="156" height="128"/><rect x="184" y="210" width="34" height="68"/><rect x="140" y="178" width="30" height="30"/><rect x="232" y="178" width="30" height="30"/><path d="M250 112 V84 H272 V130"/><circle cx="345" cy="58" r="24"/><path d="M20 278 H380"/><path d="M40 70 C50 58 70 58 78 70 C90 64 104 72 100 84 H40 C30 82 30 72 40 70z"/>',
        mandala: '<circle cx="200" cy="150" r="30"/><circle cx="200" cy="150" r="62"/><circle cx="200" cy="150" r="96"/><circle cx="200" cy="150" r="130"/><path d="M200 20 V280M70 150 H330M108 58 L292 242M292 58 L108 242"/>'
    };
    root.querySelector('[data-guide]').addEventListener('change', function (e) {
        guideLayer.innerHTML = GUIDES[e.target.value] || '';
        paper.classList.toggle('has-guide', !!e.target.value);
    });

    /* ---------- save as PNG (on white paper) ---------- */
    function exportArt() {
        var out = document.createElement('canvas');
        out.width = canvas.width; out.height = canvas.height;
        var o = out.getContext('2d');
        o.fillStyle = '#FFFFFF'; o.fillRect(0, 0, out.width, out.height);
        o.drawImage(canvas, 0, 0);
        o.font = (14 * dpr) + 'px "Plus Jakarta Sans", sans-serif'; o.fillStyle = 'rgba(30,27,58,.45)'; o.textAlign = 'right';
        o.fillText('Made on the Kalalaya Digital Easel', out.width - 14 * dpr, out.height - 14 * dpr);
        return out;
    }
    function download(out) {
        var done = function (url) {
            var a = document.createElement('a');
            a.href = url; a.download = 'my-kalalaya-art.png';
            document.body.appendChild(a); a.click(); a.remove();
        };
        if (out.toBlob) out.toBlob(function (b) { var u = URL.createObjectURL(b); done(u); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); });
        else done(out.toDataURL('image/png'));
    }

    /* ---------- lead capture: details are asked once per browser before the first download ---------- */
    var LEAD_KEY = 'kalalaya_lead_shared';
    var dlg = document.getElementById('lead-dialog');
    var leadForm = dlg && dlg.querySelector('[data-lead-form]');
    var pending = null, lastFocus = null, leadTitle = dlg ? dlg.querySelector('#lead-title').textContent : '';
    function leadShared() { try { return localStorage.getItem(LEAD_KEY) === '1'; } catch (e) { return false; } }
    function openLead(out) {
        pending = out; lastFocus = document.activeElement;
        dlg.querySelector('#lead-title').textContent = leadTitle;
        dlg.querySelector('[data-lead-preview]').src = out.toDataURL('image/png');
        dlg.querySelectorAll('[data-err]').forEach(function (el) { el.textContent = ''; });
        dlg.querySelector('[data-lead-error]').textContent = '';
        dlg.hidden = false; document.body.classList.add('no-scroll');
        requestAnimationFrame(function () { dlg.classList.add('is-open'); });
        setTimeout(function () { leadForm.elements.name.focus(); }, 60);
    }
    function closeLead() {
        dlg.classList.remove('is-open'); document.body.classList.remove('no-scroll');
        setTimeout(function () { dlg.hidden = true; }, 250);
        if (lastFocus) lastFocus.focus();
    }
    root.querySelector('[data-download]').addEventListener('click', function () {
        if (!dirty) { empty.classList.remove('is-nudge'); void empty.offsetWidth; empty.classList.add('is-nudge'); return; }
        var out = exportArt();
        if (!dlg || leadShared()) download(out); else openLead(out);
    });
    if (dlg) {
        dlg.querySelector('[data-lead-close]').addEventListener('click', closeLead);
        dlg.addEventListener('click', function (e) { if (e.target === dlg) closeLead(); });
        document.addEventListener('keydown', function (e) {
            if (dlg.hidden) return;
            if (e.key === 'Escape') closeLead();
            else if (e.key === 'Tab') {
                var f = [].slice.call(dlg.querySelectorAll('button, input:not([type=hidden]):not([tabindex="-1"]), select')).filter(function (x) { return x.offsetParent !== null; });
                var i = f.indexOf(document.activeElement);
                if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
                else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
            }
        });
        leadForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = leadForm.querySelector('[data-lead-submit]'), errBox = dlg.querySelector('[data-lead-error]');
            var setErr = function (k, msg) { var el = dlg.querySelector('[data-err="' + k + '"]'); if (el) el.textContent = msg || ''; };
            ['name', 'phone', 'email', 'consent'].forEach(function (k) { setErr(k, ''); });
            errBox.textContent = '';
            // quick checks in the browser; the server checks everything again
            var el = leadForm.elements, bad = false;
            if (el.name.value.trim().length < 2) { setErr('name', 'Please enter your name.'); bad = bad || el.name; }
            if (!/^[0-9+\-\s()]{7,20}$/.test(el.phone.value.trim())) { setErr('phone', 'Please enter a valid phone number.'); bad = bad || el.phone; }
            if (el.email.value.trim() && !el.email.checkValidity()) { setErr('email', 'Please enter a valid email, or leave it empty.'); bad = bad || el.email; }
            if (!el.consent.checked) { setErr('consent', 'Please tick the box so we can contact you.'); bad = bad || el.consent; }
            if (bad) { bad.focus(); return; }

            var fd = new FormData(leadForm);
            fd.append('art', pending.toDataURL('image/png'));
            btn.disabled = true; btn.classList.add('is-busy');
            fetch('save-lead.php', { method: 'POST', body: fd, headers: { Accept: 'application/json' }, credentials: 'same-origin' })
                .then(function (r) { return r.json().catch(function () { return { ok: false, message: 'Something went wrong. Please try again.' }; }); })
                .then(function (res) {
                    if (res.ok) {
                        try { localStorage.setItem(LEAD_KEY, '1'); } catch (x) { /* private mode */ }
                        download(pending);
                        dlg.querySelector('.booking__panel').classList.add('is-done');
                        errBox.textContent = '';
                        dlg.querySelector('#lead-title').textContent = res.message || 'Thank you! Your artwork is downloading.';
                        setTimeout(function () { closeLead(); dlg.querySelector('.booking__panel').classList.remove('is-done'); }, 2200);
                        leadForm.reset();
                    } else {
                        Object.keys(res.errors || {}).forEach(function (k) { setErr(k, res.errors[k]); });
                        errBox.textContent = res.message || 'Please check the form and try again.';
                    }
                })
                .catch(function () { errBox.textContent = 'No connection. Please check your internet and try again.'; })
                .then(function () { btn.disabled = false; btn.classList.remove('is-busy'); });
        });
    }

    setBrush('marker');
    setColor(state.color, swatches[1]);
})();
