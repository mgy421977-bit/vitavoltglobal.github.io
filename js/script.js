// ================================================================
// VITAVOLT GLOBAL - Master Script
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================================
    // 1. SCROLL REVEAL (Tek Observer ile)
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
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        revealElements.forEach(el => revealObserver.observe(el));
    }

    // ============================================================
    // 2. SAYAÇ ANİMASYONU (data-count kullanarak)
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
    // 3. SMOOTH SCROLL (iç linkler)
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
    // 4. NAVBAR ACTIVE STATE (sayfa bazlı)
    // ============================================================
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && currentPage === '')) {
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
    // 6. DİL DEĞİŞTİRİCİ (TR/EN)
    // ============================================================
    const langButtons = document.querySelectorAll('.lang-btn');
    const savedLang = localStorage.getItem('vitavolt-lang') || 'tr';
    
    if (langButtons.length > 0) {
        langButtons.forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            if (lang === savedLang) btn.classList.add('active');
            
            btn.addEventListener('click', function() {
                const newLang = this.getAttribute('data-lang');
                localStorage.setItem('vitavolt-lang', newLang);
                
                langButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Sayfayı yeniden yükle (dil değişikliği için)
                // Not: Mevcut HTML'de çeviri yok, ama ileride eklenebilir
                // window.location.reload();
                console.log('🌐 Dil değişti:', newLang);
            });
        });
    }

    // ============================================================
    // 7. HEADER SHADOW (scroll efekti)
    // ============================================================
    const header = document.querySelector('.header');
    if (header) {
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            if (currentScroll > 50) {
                header.style.boxShadow = '0 4px 30px rgba(0,0,0,0.6)';
            } else {
                header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            }
            lastScroll = currentScroll;
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
            toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 14px 24px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.95rem;
                z-index: 10000;
                background: ${type === 'success' ? '#38D67A' : '#FF4444'};
                color: #fff;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                animation: slideUp 0.3s ease-out;
                max-width: 400px;
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };
        
        const handleSubmit = () => {
            const email = newsletterInput.value.trim();
            if (!email) {
                showNotification('Lütfen e-posta adresinizi girin.', 'error');
                return;
            }
            if (!validateEmail(email)) {
                showNotification('Geçerli bir e-posta adresi girin.', 'error');
                return;
            }
            showNotification('✅ Başarıyla abone oldunuz!', 'success');
            newsletterInput.value = '';
        };
        
        newsletterBtn.addEventListener('click', handleSubmit);
        newsletterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSubmit();
        });
    }

    // ============================================================
    // 9. RESPONSIVE MENU RESIZE
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

    // ============================================================
    // 10. PERFORMANCE: Debounce yardımcısı
    // ============================================================
    window.debounce = function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // ============================================================
    // 11. CONSOLE LOG (başlangıç bilgisi)
    // ============================================================
    console.log('⚡ Vitavolt Global - Script initialized');
    console.log('📱 Current language:', savedLang);
    console.log('✅ All systems ready.');

}); // DOMContentLoaded sonu
