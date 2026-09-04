// ================================================================
// VITAVOLT GLOBAL - Master Script (+ i18n)
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    const revealElements = document.querySelectorAll('.scroll-reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        revealElements.forEach(el => revealObserver.observe(el));
    }

    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-count'), 10);
                    if (isNaN(target) || target < 0) return;
                    let current = 0;
                    const duration = 2000;
                    const stepTime = 16;
                    const steps = duration / stepTime;
                    const increment = target / steps;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            el.textContent = target + '+';
                            clearInterval(timer);
                        } else {
                            el.textContent = Math.floor(current);
                        }
                    }, stepTime);
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 0.3 });
        counters.forEach(c => counterObserver.observe(c));
    }

    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId) return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    const navLinks = document.querySelectorAll('.nav-link');
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        let isActive = false;
        if (href === currentPage || (href === 'index.html' && (currentPage === '' || currentPage === '/'))) isActive = true;
        if (href === 'blog/' && path.indexOf('/blog') !== -1) isActive = true;
        if (href.endsWith('.html') && currentPage === href) isActive = true;
        link.classList.toggle('active', isActive);
    });

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

    const solutionCopy = {
        solar: { title: 'path-solar-result-title', description: 'path-solar-result-desc', meta: 'path-solar-result-meta', href: 'izmir-ges.html' },
        efficiency: { title: 'path-efficiency-result-title', description: 'path-efficiency-result-desc', meta: 'path-efficiency-result-meta', href: 'services.html#consult' },
        storage: { title: 'path-storage-result-title', description: 'path-storage-result-desc', meta: 'path-storage-result-meta', href: 'izmir-bess-enerji-depolama.html' },
        carbon: { title: 'path-carbon-result-title', description: 'path-carbon-result-desc', meta: 'path-carbon-result-meta', href: 'izmir-enerji-karbon-donusumu.html' }
    };
    function renderSolution(solutionId, lang) {
        const dict = (window.translations && window.translations[lang]) || {};
        const copy = solutionCopy[solutionId] || solutionCopy.solar;
        const result = document.querySelector('.solution-result');
        if (!result) return;
        const title = result.querySelector('[data-solution-target="title"]');
        const description = result.querySelector('[data-solution-target="description"]');
        const meta = result.querySelector('[data-solution-target="meta"]');
        const link = result.querySelector('[data-solution-target="link"]');
        if (title) title.textContent = dict[copy.title] || '';
        if (description) description.textContent = dict[copy.description] || '';
        if (meta) meta.textContent = dict[copy.meta] || '';
        if (link) link.href = copy.href;
        result.classList.remove('solution-result-refresh');
        window.requestAnimationFrame(() => result.classList.add('solution-result-refresh'));
    }
    function applyLanguage(lang) {
        const dict = (window.translations && window.translations[lang]) || {};
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                const icon = el.querySelector('i');
                if (icon) {
                    el.childNodes.forEach(node => { if (node.nodeType === Node.TEXT_NODE) node.textContent = ''; });
                    if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) el.firstChild.textContent = dict[key] + ' ';
                    else el.insertBefore(document.createTextNode(dict[key] + ' '), icon);
                } else el.textContent = dict[key];
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
        });
        document.documentElement.lang = lang;
        try { localStorage.setItem('vitavolt-lang', lang); } catch (_) {}
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-lang') === lang));
        const activeSolution = document.querySelector('.solution-option.is-active');
        if (activeSolution) renderSolution(activeSolution.dataset.solution, lang);
    }
    let savedLang = 'tr';
    try { savedLang = localStorage.getItem('vitavolt-lang') || 'tr'; } catch (_) {}
    applyLanguage(savedLang);
    document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', function() {
        const newLang = this.getAttribute('data-lang');
        if (newLang) applyLanguage(newLang);
    }));
    document.querySelectorAll('.solution-option').forEach(option => option.addEventListener('click', function() {
        document.querySelectorAll('.solution-option').forEach(item => {
            const active = item === option;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-selected', String(active));
        });
        renderSolution(option.dataset.solution, document.documentElement.lang || savedLang);
    }));

    const header = document.querySelector('.header');
    if (header) {
        const updateShadow = function() {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            header.style.boxShadow = currentScroll > 50 ? '0 4px 30px rgba(0,0,0,0.6)' : '0 2px 10px rgba(0,0,0,0.3)';
        };
        window.addEventListener('scroll', updateShadow, { passive: true });
        updateShadow();
    }

    const newsletterBtn = document.querySelector('.newsletter-btn');
    const newsletterInput = document.querySelector('.newsletter-input');
    if (newsletterBtn && newsletterInput) {
        const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const showNotification = (message, type = 'success') => {
            const existing = document.querySelector('.notification-toast');
            if (existing) existing.remove();
            const toast = document.createElement('div');
            toast.className = 'notification-toast';
            toast.textContent = message;
            toast.setAttribute('role', 'status');
            toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:14px 24px;border-radius:12px;font-weight:600;font-size:0.95rem;z-index:10000;background:${type==='success'?'#38D67A':'#FF4444'};color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.4);max-width:400px;`;
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity='0'; setTimeout(() => toast.remove(),300); },3000);
        };
        const handleSubmit = () => {
            const email = newsletterInput.value.trim();
            if (!email) return showNotification('Please enter your email.', 'error');
            if (!validateEmail(email)) return showNotification('Please enter a valid email.', 'error');
            showNotification('✅ Subscribed successfully!', 'success');
            newsletterInput.value = '';
        };
        newsletterBtn.addEventListener('click', handleSubmit);
        newsletterInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleSubmit(); });
    }

    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (window.innerWidth > 1023) closeMenu(); }, 250);
    }, { passive: true });
});
