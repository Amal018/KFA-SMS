/* Course details: ?category=kids (etc.) scrolls to and highlights that course */
(function () {
    'use strict';
    var cat = (window.Kalalaya.getParam('category') || location.hash.slice(1) || '').toLowerCase();
    if (!/^[a-z-]+$/.test(cat)) return;
    var el = document.getElementById(cat);
    if (!el || !el.classList.contains('course-block')) return;
    el.classList.add('is-highlight', 'is-visible');
    window.addEventListener('load', function () {
        setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    });
    setTimeout(function () { el.classList.remove('is-highlight'); }, 4000);
})();
