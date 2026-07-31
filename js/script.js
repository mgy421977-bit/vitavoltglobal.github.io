// ================================================================
// VITAVOLT GLOBAL - Master Script (+ i18n)
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================================
    // 1. SCROLL REVEAL
    // ============================================================
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

    // ============================================================
    // 2. COUNTERS
    // ============================================================
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

    // ============================================================
    // 3. SMOOTH SCROLL
    // ============================================================
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // ============================================================
    // 4. NAVBAR ACTIVE
    // ============================================================
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && (currentPage === '' || currentPage === '/'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // ============================================================
    // 5. MOBILE MENU
    // ============================================================
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }

    // ============================================================
    // 6. i18n - LANGUAGE SWITCHER (TR / EN)
    // ============================================================
    function applyLanguage(lang) {
        const dict = (window.translations && window.translations[lang]) || {};
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                // Preserve child icons if any (e.g. arrow)
                const icon = el.querySelector('i');
                if (icon) {
                    el.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) node.textContent = '';
                    });
                    // Put text before icon
                    if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
                        el.firstChild.textContent = dict[key] + ' ';
                    } else {
                        el.insertBefore(document.createTextNode(dict[key] + ' '), icon);
                    }
                } else {
                    el.textContent = dict[key];
                }
            }
        });
        document.documentElement.lang = lang;
        localStorage.setItem('vitavolt-lang', lang);

        // Active button state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
    }

    const savedLang = localStorage.getItem('vitavolt-lang') || 'tr';
    applyLanguage(savedLang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const newLang = this.getAttribute('data-lang');
            if (!newLang) return;
            applyLanguage(newLang);
        });
    });

    // ============================================================
    // 7. HEADER SHADOW
    // ============================================================
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            header.style.boxShadow = currentScroll > 50
                ? '0 4px 30px rgba(0,0,0,0.6)'
                : '0 2px 10px rgba(0,0,0,0.3)';
        }, { passive: true });
    }

    // ============================================================
    // 8. NEWSLETTER
    // ============================================================
    const newsletterBtn = document.querySelector('.newsletter-btn');
    const newsletterInput = document.querySelector('.newsletter-input');
    if (newsletterBtn && newsletterInput) {
        const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const showNotification = (message, type = 'success') => {
            const existing = document.querySelector('.notification-toast');
            if (existing) existing.remove();
            const toast = document.createElement('div');
            toast.className = 'notification-toast';
            toast.textContent = message;
            toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:14px 24px;border-radius:12px;font-weight:600;font-size:0.95rem;z-index:10000;background:${type==='success'?'#38D67A':'#FF4444'};color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.4);max-width:400px;`;
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity='0'; setTimeout(() => toast.remove(), 300); }, 3000);
        };
        const handleSubmit = () => {
            const email = newsletterInput.value.trim();
            if (!email) { showNotification('Please enter your email.', 'error'); return; }
            if (!validateEmail(email)) { showNotification('Please enter a valid email.', 'error'); return; }
            showNotification('✅ Subscribed successfully!', 'success');
            newsletterInput.value = '';
        };
        newsletterBtn.addEventListener('click', handleSubmit);
        newsletterInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSubmit(); });
    }

    // ============================================================
    // 9. RESIZE
    // ============================================================
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 1023 && navMenu) {
                navMenu.classList.remove('active');
                if (menuToggle) menuToggle.classList.remove('active');
            }
        }, 250);
    }, { passive: true });

    console.log('⚡ Vitavolt Global ready | lang:', savedLang);
});
