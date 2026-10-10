/* =====================================================================
   CONTACT FORM — client-side validation + AJAX submit.
   Server-side validation in submit-enquiry.php is the real gatekeeper;
   without JavaScript the form still posts normally.
   ===================================================================== */
(function () {
    'use strict';
    var form = document.getElementById('enquiry-form');
    if (!form || !window.fetch) return;
    var btn = document.getElementById('enquiry-submit');
    var errorBox = document.getElementById('form-error');
    var btnHtml = btn.innerHTML;

    var rules = {
        name: function (v) { return v.length < 2 ? 'Please enter your name.' : v.length > 80 ? 'Name must be 80 characters or fewer.' : ''; },
        phone: function (v) {
            var d = v.replace(/\D/g, '');
            if (!v) return 'Please enter your phone number.';
            return (!/^[0-9+\-\s()]{7,20}$/.test(v) || d.length < 7 || d.length > 15) ? 'Please enter a valid phone number.' : '';
        },
        email: function (v) {
            if (!v) return 'Please enter your email address.';
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address.';
        },
        message: function (v) { return v.length > 2000 ? 'Message must be 2000 characters or fewer.' : ''; }
    };

    function setError(name, msg) {
        var input = form.elements[name], field = input && input.closest('.field');
        var span = document.getElementById('err-' + name);
        if (!field) return;
        field.classList.toggle('has-error', !!msg);
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (span) span.textContent = msg || '';
    }
    function validate() {
        var firstBad = null;
        Object.keys(rules).forEach(function (k) {
            var msg = rules[k](form.elements[k].value.trim());
            setError(k, msg);
            if (msg && !firstBad) firstBad = form.elements[k];
        });
        return firstBad;
    }
    function showError(msg) {
        errorBox.querySelector('span').textContent = msg;
        errorBox.hidden = !msg;
    }

    Object.keys(rules).forEach(function (k) {
        form.elements[k].addEventListener('blur', function () { if (this.value) setError(k, rules[k](this.value.trim())); });
        form.elements[k].addEventListener('input', function () { if (this.closest('.field').classList.contains('has-error')) setError(k, rules[k](this.value.trim())); });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        showError('');
        var bad = validate();
        if (bad) { bad.focus(); return; }

        btn.disabled = true;
        btn.textContent = 'Sending…';
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
            .then(function (r) { return r.json().catch(function () { return { ok: false, message: 'Unexpected server response. Please try again or call us.' }; }); })
            .then(function (res) {
                if (res.ok) {
                    form.reset();
                    document.getElementById('form-wrap').hidden = true;
                    var ok = document.getElementById('form-success');
                    ok.hidden = false; ok.focus();
                    return;
                }
                if (res.errors) Object.keys(res.errors).forEach(function (k) { setError(k, res.errors[k]); });
                showError(res.message || 'Something went wrong. Please try again.');
            })
            .catch(function () { showError('Network error — please check your connection and try again, or call us directly.'); })
            .then(function () { btn.disabled = false; btn.innerHTML = btnHtml; });
    });
})();
