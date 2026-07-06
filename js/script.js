// ===== DİL ÇEVİRİLERİ =====
const translations = {
    tr: {
        nav: ['Ana Sayfa', 'Hakkımızda', 'Hizmetler', 'İletişim'],
        heroTitle: 'Geleceğe Güç Veren Mühendislik.',
        heroSub: 'Enerjiyi mühendislikle yeniden şekillendiriyoruz.',
        heroBtn: 'Çözümleri Keşfet',
        about: ['Biz Kimiz?', 'Ne Çözüyoruz?', 'Nasıl Çalışıyoruz?', 'Neden Vitavolt?'],
        aboutTexts: [
            'Vitavolt, enerji altyapısını teknoloji ve inovasyonla yeniden şekillendiren yeni nesil bir mühendislik firmasıdır.',
            'Geleneksel şebekelerdeki verimsizliği, yüksek karbon ayak izini ve akıllı depolama eksikliğini çözüyoruz.',
            'Yapay zeka destekli analizler ve modüler sistemlerle anahtar teslim enerji çözümleri tasarlıyor, mühendisliğini yapıyor ve devreye alıyoruz.',
            'Çünkü sadece sistem kurmuyor, ölçülebilir etki yaratan sürdürülebilir bir gelecek mühendisliği yapıyoruz.'
        ],
        // ===== GÜNCELLENEN HİZMET METİNLERİ (TR) =====
        services: [
            'GES (Güneş Enerjisi)',
            'EPC (Mühendislik, Tedarik, İnşaat)',
            'BESS (Batarya Depolama)',
            'Karbon Çözümleri',
            'Danışmanlık'
        ],
        servicesTexts: [
            'Yüksek verimli fotovoltaik santral tasarımı, kurulumu ve optimizasyonu.',
            'Anahtar teslim proje yönetimi, uluslararası tedarik ve inşaat yönetimi.',
            'Batarya enerji depolama, şebeke stabilizasyonu ve hibrit sistem entegrasyonu.',
            'Karbon ayak izi analizi, azaltma ve dengeleme stratejileri.',
            'Teknik fizibilite, finansman, mevzuat ve dönüşüm danışmanlığı.'
        ],
        stats: ['Proje', 'Kurulu Güç (MW)', 'Ülke'],
        contactTitle: 'Teklif Al',
        contactName: 'Adınız',
        contactEmail: 'E-posta',
        contactMsg: 'Mesajınız',
        contactBtn: 'Gönder',
        footer: '© 2026 Vitavolt. Geleceğe Güç Veren Mühendislik.'
    },
    en: {
        nav: ['Home', 'About', 'Services', 'Contact'],
        heroTitle: 'Engineering Tomorrow’s Energy.',
        heroSub: 'Powering the Future with Engineering.',
        heroBtn: 'Explore Solutions',
        about: ['Who We Are', 'What We Solve', 'How We Work', 'Why Vitavolt'],
        aboutTexts: [
            'Vitavolt is a next-generation engineering company reshaping energy infrastructure with technology and innovation.',
            'We solve the inefficiency in traditional grids, high carbon footprints, and lack of smart energy storage.',
            'We design, engineer, and deploy turnkey energy solutions using AI-driven analytics and modular systems.',
            'Because we don\'t just build systems; we engineer a sustainable future with measurable impact.'
        ],
        // ===== GÜNCELLENEN HİZMET METİNLERİ (EN) =====
        services: [
            'Solar Power (GES)',
            'EPC (Engineering, Procurement, Construction)',
            'BESS (Battery Storage)',
            'Carbon Solutions',
            'Consultancy'
        ],
        servicesTexts: [
            'High-efficiency photovoltaic plant design, installation, and optimization.',
            'Turnkey project management, international procurement, and construction management.',
            'Battery energy storage, grid stabilization, and hybrid system integration.',
            'Carbon footprint analysis, reduction, and offsetting strategies.',
            'Technical feasibility, financing, regulation, and transformation consultancy.'
        ],
        stats: ['Projects', 'MW Installed', 'Countries'],
        contactTitle: 'Get a Quote',
        contactName: 'Your Name',
        contactEmail: 'Email',
        contactMsg: 'Your Message',
        contactBtn: 'Send Request',
        footer: '© 2026 Vitavolt. Engineering Tomorrow’s Energy.'
    }
};

// ===== DİL YÖNETİMİ =====
let currentLang = localStorage.getItem('vitavolt-lang') || 'tr';

function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('vitavolt-lang', lang);
    const t = translations[lang];
    if (!t) return;

    // Nav (hem desktop hem mobile)
    const navLinks = document.querySelectorAll('.nav-menu a, .mobile-menu a');
    navLinks.forEach((el, i) => {
        if (i < 4) el.textContent = t.nav[i];
    });

    // Hero (sadece index.html'de var)
    const heroSlogan = document.getElementById('heroSlogan');
    const heroSub = document.getElementById('heroSub');
    const heroBtn = document.getElementById('heroBtn');
    if (heroSlogan) heroSlogan.textContent = t.heroTitle;
    if (heroSub) heroSub.textContent = t.heroSub;
    if (heroBtn) heroBtn.textContent = t.heroBtn;

    // About (index özet ve about.html)
    const aboutTitles = document.querySelectorAll('.about-card h3, .about-card-large h2');
    const aboutDescs = document.querySelectorAll('.about-card p, .about-card-large p');
    aboutTitles.forEach((el, i) => {
        if (i < 4) el.textContent = t.about[i];
    });
    aboutDescs.forEach((el, i) => {
        if (i < 4) el.textContent = t.aboutTexts[i];
    });

    // Services (index özet ve services.html)
    const serviceTitles = document.querySelectorAll('.service-card h3, .service-card-large h3');
    const serviceDescs = document.querySelectorAll('.service-card p, .service-card-large p');
    serviceTitles.forEach((el, i) => {
        if (i < 5) el.textContent = t.services[i];
    });
    serviceDescs.forEach((el, i) => {
        if (i < 5) el.textContent = t.servicesTexts[i];
    });

    // Stats
    const statLabels = document.querySelectorAll('.stats-grid p');
    statLabels.forEach((el, i) => {
        if (i < 3) el.textContent = t.stats[i];
    });

    // Contact
    const contactTitle = document.getElementById('contactTitle');
    const formName = document.getElementById('formName');
    const formEmail = document.getElementById('formEmail');
    const formMsg = document.getElementById('formMessage');
    const formBtn = document.getElementById('formSubmitBtn');
    if (contactTitle) contactTitle.textContent = t.contactTitle;
    if (formName) formName.placeholder = t.contactName;
    if (formEmail) formEmail.placeholder = t.contactEmail;
    if (formMsg) formMsg.placeholder = t.contactMsg;
    if (formBtn) formBtn.textContent = t.contactBtn;

    // Footer
    const footer = document.getElementById('footerText');
    if (footer) footer.textContent = t.footer;

    // Dil butonları
    const langLabels = document.querySelectorAll('#langLabel, #mobileLangLabel');
    langLabels.forEach(el => el.textContent = lang.toUpperCase());

    document.documentElement.lang = lang;
}

function toggleLang() {
    const newLang = currentLang === 'tr' ? 'en' : 'tr';
    updateLanguage(newLang);
}

// ===== SAYFA ÖZEL İŞLEMLER =====
document.addEventListener('DOMContentLoaded', function() {
    // Dil butonları
    const langToggle = document.getElementById('langToggle');
    const mobileLangToggle = document.getElementById('mobileLangToggle');
    if (langToggle) langToggle.addEventListener('click', toggleLang);
    if (mobileLangToggle) mobileLangToggle.addEventListener('click', toggleLang);

    // Mobil menü
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('show');
        });
        // Menü linklerine tıklanınca kapat
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.remove('show'));
        });
    }

    // Açılış animasyonu (sadece index.html)
    const titleEl = document.getElementById('animatedTitle');
    if (titleEl) {
        const steps = ['V', 'VI', 'VITA', 'VITAVOLT'];
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step >= steps.length) { clearInterval(interval); return; }
            titleEl.textContent = steps[step];
        }, 800);
    }

    // Sayaç animasyonu (sadece index.html)
    const counters = document.querySelectorAll('.counter');
    let counted = false;
    function startCounters() {
        if (counted) return;
        const section = document.querySelector('.stats-section');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            counted = true;
            counters.forEach(counter => {
                const target = parseInt(counter.innerText) || 0;
                let current = 0;
                const step = Math.ceil(target / 50);
                const interval = setInterval(() => {
                    current += step;
                    if (current >= target) { current = target; clearInterval(interval); }
                    counter.innerText = current;
                }, 30);
            });
        }
    }
    window.addEventListener('scroll', startCounters);
    // Sayfa yüklenince kontrol et
    setTimeout(startCounters, 500);

    // Form
    const form = document.getElementById('quoteForm');
    const feedback = document.getElementById('formFeedback');
    if (form && feedback) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('formName')?.value.trim();
            const email = document.getElementById('formEmail')?.value.trim();
            const msg = document.getElementById('formMessage')?.value.trim();
            if (!name || !email || !msg) {
                feedback.textContent = currentLang === 'tr' ? 'Lütfen tüm alanları doldurun.' : 'Please fill in all fields.';
                feedback.style.color = '#f87171';
                return;
            }
            feedback.textContent = currentLang === 'tr' ? '✅ Talebiniz alındı! En kısa sürede dönüş yapacağız.' : '✅ Your request has been received! We will get back to you shortly.';
            feedback.style.color = '#22d3ee';
            form.reset();
        });
    }

    // Başlangıç dilini uygula
    updateLanguage(currentLang);
});
