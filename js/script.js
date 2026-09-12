// ================================================================
// VITAVOLT GLOBAL - Master Script (+ i18n)
// ================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Sticky Header ---
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
    }

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.length < 2) return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerH = header ? header.offsetHeight : 0;
                const top = target.getBoundingClientRect().top + window.pageYOffset - headerH;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // --- Intersection Observer for fade-in ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-in, .service-card, .stat-card, .path-card').forEach(el => observer.observe(el));

    // --- Active nav based on path ---
    const navLinks = document.querySelectorAll('.nav-link');
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';
    const isResearchPath = (
        path.indexOf('/research') !== -1 ||
        currentPage === 'anne.html' ||
        currentPage === 'edcs.html' ||
        currentPage === 'anne-ai.html'
    );
    navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        let isActive = false;
        if (href === currentPage || (href === 'index.html' && (currentPage === '' || currentPage === '/'))) isActive = true;
        if (href === 'blog/' && path.indexOf('/blog') !== -1) isActive = true;
        if (href.endsWith('.html') && currentPage === href) isActive = true;
        // RESEARCH umbrella: research/*, anne.html, edcs.html
        if ((href === 'research/' || href === '../research/' || href.indexOf('research/') !== -1) && isResearchPath) isActive = true;
        link.classList.toggle('active', isActive);
    });

    // --- Mobile menu ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    function closeMenu() {
        if (navMenu) navMenu.classList.remove('active');
        if (menuToggle) { menuToggle.classList.remove('active'); menuToggle.setAttribute('aria-expanded', 'false'); }
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    function openMenu() {
        if (navMenu) navMenu.classList.add('active');
        if (menuToggle) { menuToggle.classList.add('active'); menuToggle.setAttribute('aria-expanded', 'true'); }
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    }
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.contains('active') ? closeMenu() : openMenu();
        });
        navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
        if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
    }

    // --- Language switch (basic) ---
    const langBtns = document.querySelectorAll('[data-set-lang]');
    function setLang(lang) {
        document.documentElement.lang = lang === 'en' ? 'en' : 'tr';
        document.querySelectorAll('[data-lang]').forEach(el => {
            el.hidden = el.getAttribute('data-lang') !== lang;
        });
        langBtns.forEach(btn => {
            const on = btn.getAttribute('data-set-lang') === lang;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', String(on));
        });
        try { localStorage.setItem('vv_lang', lang); } catch (e) {}
    }
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.getAttribute('data-set-lang')));
    });
    let initialLang = 'tr';
    try {
        const stored = localStorage.getItem('vv_lang');
        if (stored === 'en' || stored === 'tr') initialLang = stored;
    } catch (e) {}
    if (langBtns.length) setLang(initialLang);

    // resize close menu
    window.addEventListener('resize', () => {
        setTimeout(() => { if (window.innerWidth > 1023) closeMenu(); }, 250);
    }, { passive: true });
});
