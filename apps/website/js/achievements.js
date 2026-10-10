/* Achievements: founder certificate carousel + "View Certificate" */
(function () {
    'use strict';
    var K = window.Kalalaya;
    var thumbs = [].slice.call(document.querySelectorAll('[data-cert-index]'));
    var mainImg = document.getElementById('cert-main-img');
    if (!thumbs.length || !mainImg) return;
    var idx = 0;

    function items() {
        return thumbs.map(function (t) { return { src: t.getAttribute('data-lightbox'), caption: t.getAttribute('data-caption') }; });
    }
    function select(i) {
        idx = (i + thumbs.length) % thumbs.length;
        mainImg.src = thumbs[idx].getAttribute('data-lightbox');
        mainImg.alt = thumbs[idx].getAttribute('data-caption');
        thumbs.forEach(function (t, n) { t.classList.toggle('is-current', n === idx); });
    }
    // Thumbnails switch the main certificate instead of opening the lightbox
    thumbs.forEach(function (t, n) {
        t.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); select(n); }, true);
    });
    document.querySelector('[data-cert-prev]').addEventListener('click', function () { select(idx - 1); });
    document.querySelector('[data-cert-next]').addEventListener('click', function () { select(idx + 1); });
    function openCurrent() { K.openLightbox(items(), idx); }
    document.getElementById('cert-main').addEventListener('click', openCurrent);
    var view = document.getElementById('view-certificate');
    if (view) view.addEventListener('click', openCurrent);
})();
