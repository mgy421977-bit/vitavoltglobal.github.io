// ===== VITAVOLT GLOBAL - JAVASCRIPT =====

// ===== STATE =====
const state = {
  language: localStorage.getItem('language') || 'tr',
  menuOpen: false,
};

// ===== TRANSLATIONS =====
const translations = {
  tr: {
    'nav-home': 'Anasayfa',
    'nav-about': 'Hakkımızda',
    'nav-services': 'Hizmetler',
    'nav-contact': 'İletişim',
    'hero-title': 'Engineering Tomorrow\'s Energy',
    'hero-subtitle': 'Geleceğe Güç Veren Mühendislik',
    'btn-learn': 'Daha Fazla Bilgi',
    'btn-contact': 'İletişime Geçin',
  },
  en: {
    'nav-home': 'Home',
    'nav-about': 'About',
    'nav-services': 'Services',
    'nav-contact': 'Contact',
    'hero-title': 'Engineering Tomorrow\'s Energy',
    'hero-subtitle': 'Engineering Power for the Future',
    'btn-learn': 'Learn More',
    'btn-contact': 'Get in Touch',
  }
};

// ===== DOM ELEMENTS =====
const header = document.querySelector('header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav-link');
const langSwitch = document.querySelector('.lang-switch');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initNavigation();
  initLanguage();
  initScrollReveal();
  initCounters();
  initSmoothScroll();
  setActiveNavigation();
});

// ===== HEADER STICKY EFFECT =====
function initHeader() {
  let lastScrollTop = 0;
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
      header.classList.add('scroll-active');
    } else {
      header.classList.remove('scroll-active');
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }
  
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

function toggleMenu() {
  state.menuOpen = !state.menuOpen;
  
  if (nav) {
    if (state.menuOpen) {
      nav.classList.add('active');
      menuToggle.innerHTML = '✕';
    } else {
      nav.classList.remove('active');
      menuToggle.innerHTML = '☰';
    }
  }
}

function closeMenu() {
  state.menuOpen = false;
  if (nav) {
    nav.classList.remove('active');
  }
  if (menuToggle) {
    menuToggle.innerHTML = '☰';
  }
}

// ===== NAVIGATION =====
function initNavigation() {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      closeMenu();
    });
  });
}

function setActiveNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ===== LANGUAGE SWITCH =====
function initLanguage() {
  if (langSwitch) {
    langSwitch.textContent = state.language.toUpperCase();
    langSwitch.addEventListener('click', switchLanguage);
  }
  
  applyLanguage();
}

function switchLanguage() {
  state.language = state.language === 'tr' ? 'en' : 'tr';
  localStorage.setItem('language', state.language);
  
  if (langSwitch) {
    langSwitch.textContent = state.language.toUpperCase();
  }
  
  applyLanguage();
}

function applyLanguage() {
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[state.language] && translations[state.language][key]) {
      element.textContent = translations[state.language][key];
    }
  });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        closeMenu();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ===== SCROLL REVEAL ANIMATION =====
function initScrollReveal() {
  const elements = document.querySelectorAll('.scroll-reveal');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('active');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  elements.forEach(element => {
    observer.observe(element);
  });
}

// ===== ANIMATED COUNTERS =====
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => {
    observer.observe(counter);
  });
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-count'));
  const duration = 2000;
  const start = Date.now();
  
  const animate = () => {
    const now = Date.now();
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(target * progress);
    
    element.textContent = value;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
}

// ===== FORM SUBMISSION =====
function initForms() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      // Log form data (in production, send to server)
      console.log('Form submitted:', data);
      
      // Show success message
      showNotification('Message sent successfully!', 'success');
      
      // Reset form
      form.reset();
    });
  });
}

// ===== NOTIFICATION =====
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '100px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: '0.5rem',
    background: type === 'success' ? '#38D67A' : '#00AEEF',
    color: '#fff',
    zIndex: 9999,
    animation: 'fadeIn 0.3s ease-out'
  });
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== UTILITIES =====

// Lazy loading for images
function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Initialize lazy loading on page load
window.addEventListener('load', initLazyLoading);

// Initialize forms after DOM is ready
document.addEventListener('DOMContentLoaded', initForms);

// Accessibility: Focus management
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
  }
});

console.log('Vitavolt Global - JavaScript loaded successfully');