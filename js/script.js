// ================================================================
// VITAVOLT GLOBAL - Master Script (+ i18n + layered navigation)
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50), { passive: true });

    // Layered discovery navigation: less visible, more discoverable.
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        const renewableItems = [
            ['☀', 'GES — Güneş Enerji Sistemleri', '/izmir-ges.html'],
            ['▣', 'BESS — Enerji Depolama Sistemleri', '/izmir-bess-enerji-depolama.html'],
            ['♢', 'RES — Rüzgâr Enerji Sistemleri', '/yenilenebilir-enerji-sistemleri.html#res'],
            ['ϟ', 'Hibrit Enerji Sistemleri', '/yenilenebilir-enerji-sistemleri.html#hibrit'],
            ['▦', 'Endüstriyel Enerji Çözümleri', '/izmir-endustriyel-epc.html'],
            ['⌂', 'Çatı GES', '/izmir-ges.html#cati-ges'],
            ['◒', 'Tarım / Agrivoltaik', '/yenilenebilir-enerji-sistemleri.html#agrivoltaik']
        ];
        const otherItems = [
            ['◈', 'EPC', '/izmir-endustriyel-epc.html'],
            ['◉', 'Karbon Yönetimi', '/izmir-karbon-danismanligi.html'],
            ['◌', 'Su Yönetimi', '/izmir-yagmur-suyu-hasat.html'],
            ['✦', 'VITA Energy Intelligence', '/vita-energy-intelligence.html']
        ];
        const sectorItems = [
            ['🏭', 'Fabrika & Endüstriyel', '/izmir-endustriyel-epc.html'],
            ['🏢', 'Ticari İşletmeler', '/ticari-otel-su-yonetimi.html'],
            ['🏠', 'Konut & Küçük İşletme', '/konut-kucuk-isletme.html'],
            ['🌱', 'Tarım & Sürdürülebilirlik', '/yenilenebilir-enerji-sistemleri.html#agrivoltaik']
        ];
        const vitaItems = [
            ['⚡', 'VITA Energy Intelligence', '/vita-energy-intelligence.html'],
            ['◉', 'Hızlı Ön Fizibilite', '/index.html#hizli-hesapla'],
            ['✦', 'ANNE AI Research', '/research/']
        ];
        const makeItems = items => items.map(([icon,label,href]) => `<a class="vv-mega-item" href="${href}"><span class="vv-mega-icon" aria-hidden="true">${icon}</span><span>${label}</span></a>`).join('');
        navMenu.innerHTML = `
            <a href="/index.html" class="nav-link">ANA SAYFA</a>
            <a href="/about.html" class="nav-link">HAKKIMIZDA</a>
            <div class="vv-nav-dropdown" data-menu="solutions">
                <button class="nav-link vv-nav-trigger" type="button" aria-expanded="false" aria-haspopup="true">ÇÖZÜMLERİMİZ <span class="vv-chevron" aria-hidden="true">⌄</span></button>
                <div class="vv-mega-menu" role="menu">
                    <div class="vv-mega-lead">
                        <a class="vv-mega-category" href="/yenilenebilir-enerji-sistemleri.html"><span class="vv-mega-category-icon">◒</span><span><strong>Yenilenebilir Enerji Sistemleri</strong><small>Daha temiz, daha güvenli bir gelecek için.</small></span><span class="vv-arrow">›</span></a>
                        <button class="vv-mega-category vv-secondary vv-advisory-trigger" type="button" aria-expanded="false"><span class="vv-mega-category-icon">◆</span><span><strong>Danışmanlık</strong><small>Sürdürülebilirlik, karbon, uyum ve yatırım.</small></span><span class="vv-arrow vv-advisory-chevron">›</span></button>
<div class="vv-advisory-submenu" hidden>
  <a class="vv-mega-item" href="/sustainability-carbon-advisory.html"><span class="vv-mega-icon">◉</span><span>Sürdürülebilirlik & Karbon</span></a>
  <a class="vv-mega-item" href="/izmir-karbon-danismanligi.html"><span class="vv-mega-icon">◉</span><span>Karbon Yönetimi</span></a>
  <a class="vv-mega-item" href="/izmir-enerji-karbon-donusumu.html"><span class="vv-mega-icon">ϟ</span><span>Enerji & Karbon Dönüşümü</span></a>
  <a class="vv-mega-item" href="/izmir-yagmur-suyu-hasat.html"><span class="vv-mega-icon">◌</span><span>Su & Kaynak Yönetimi</span></a>
</div>
                    </div>
                    <div class="vv-mega-content">
                        <div class="vv-mega-heading">YENİLENEBİLİR ENERJİ SİSTEMLERİ</div>
                        <div class="vv-mega-grid">${makeItems(renewableItems)}</div>
                        <div class="vv-mega-heading vv-other-heading">DİĞER ÇÖZÜMLER</div>
                        <div class="vv-mega-grid vv-other-grid">${makeItems(otherItems)}</div>
                    </div>
                </div>
            </div>
            <div class="vv-nav-dropdown vv-simple-dropdown" data-menu="sectors">
                <button class="nav-link vv-nav-trigger" type="button" aria-expanded="false" aria-haspopup="true">SEKTÖRLER <span class="vv-chevron" aria-hidden="true">⌄</span></button>
                <div class="vv-mini-menu" role="menu">${makeItems(sectorItems)}</div>
            </div>
            <div class="vv-nav-dropdown vv-simple-dropdown" data-menu="vita">
                <button class="nav-link vv-nav-trigger" type="button" aria-expanded="false" aria-haspopup="true">VITA <span class="vv-chevron" aria-hidden="true">⌄</span></button>
                <div class="vv-mini-menu" role="menu">${makeItems(vitaItems)}</div>
            </div>
            <a href="/investment/" class="nav-link">YATIRIMCILAR</a>
            <a href="/blog/" class="nav-link">BLOG</a>
            <a href="/contact.html" class="nav-link">İLETİŞİM</a>`;

        const style = document.createElement('style');
        style.id = 'vv-layered-nav-style';
        style.textContent = `
            .vv-nav-dropdown{position:relative;display:flex;align-items:center}.vv-nav-trigger{appearance:none;background:none;border:0;cursor:pointer;font-family:inherit;line-height:inherit}.vv-chevron{display:inline-block;margin-left:.25rem;font-size:.85em;transition:transform .25s ease}.vv-nav-dropdown.open .vv-chevron{transform:rotate(180deg)}
            .vv-mega-menu,.vv-mini-menu{position:absolute;top:calc(100% + 14px);left:50%;transform:translateX(-50%) translateY(-6px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .2s ease,transform .2s ease,visibility .2s ease;z-index:1400}.vv-nav-dropdown.open .vv-mega-menu,.vv-nav-dropdown.open .vv-mini-menu{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}
            .vv-mega-menu{width:min(760px,calc(100vw - 40px));display:grid;grid-template-columns:270px 1fr;background:rgba(4,15,26,.98);border:1px solid rgba(0,174,239,.25);border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.48);overflow:hidden;backdrop-filter:blur(18px)}.vv-mega-lead{padding:18px;border-right:1px solid rgba(255,255,255,.09)}
            .vv-mega-category{display:grid;grid-template-columns:38px 1fr 18px;gap:10px;align-items:center;padding:14px 10px;border-radius:10px;color:var(--color-text);transition:background .2s ease,color .2s ease}.vv-mega-category:hover,.vv-mega-category:focus-visible{background:rgba(0,174,239,.10);color:var(--color-text)}.vv-mega-category.vv-secondary{margin-top:10px;border-top:1px solid rgba(255,255,255,.08);border-radius:0;padding-top:18px}.vv-mega-category.vv-secondary.vv-advisory-trigger{background:transparent!important;color:var(--color-text)!important;-webkit-appearance:none;appearance:none;box-shadow:none}.vv-mega-category.vv-secondary.vv-advisory-trigger:hover,.vv-mega-category.vv-secondary.vv-advisory-trigger:focus,.vv-mega-category.vv-secondary.vv-advisory-trigger:active{background:rgba(38,179,107,.10)!important;color:var(--color-text)!important}.vv-advisory-trigger{width:100%;text-align:left;cursor:pointer;font-family:inherit}.vv-advisory-trigger .vv-advisory-chevron{transition:transform .2s ease}.vv-advisory-trigger.open .vv-advisory-chevron{transform:rotate(90deg)}.vv-advisory-submenu{display:none;margin:0 0 4px 48px;padding:6px 0 2px;border-left:1px solid rgba(56,189,248,.16)}.vv-advisory-submenu:not([hidden]){display:block}.vv-advisory-submenu .vv-mega-item{padding:8px 8px 8px 12px;font-size:11px}.vv-mega-category-icon{font-size:22px;color:var(--color-success)}.vv-mega-category strong{display:block;font-size:13px;line-height:1.35}.vv-mega-category small{display:block;color:var(--color-text-muted);font-size:11px;line-height:1.4;margin-top:4px}.vv-arrow{font-size:22px;color:var(--color-primary)}
            .vv-mega-content{padding:22px 24px 20px}.vv-mega-heading{font-size:10px;letter-spacing:.14em;font-weight:800;color:var(--color-primary);margin-bottom:10px}.vv-other-heading{margin-top:18px}.vv-mega-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px}.vv-mega-item{display:flex;align-items:center;gap:10px;padding:9px 7px;border-radius:7px;color:var(--color-text-secondary);font-size:12px;font-weight:600}.vv-mega-item:hover,.vv-mega-item:focus-visible{background:rgba(255,255,255,.06);color:var(--color-text)}.vv-mega-icon{width:20px;text-align:center;color:var(--color-success);font-size:16px;flex:none}.vv-mini-menu{width:260px;padding:10px;background:rgba(4,15,26,.98);border:1px solid rgba(0,174,239,.22);border-radius:12px;box-shadow:0 20px 55px rgba(0,0,0,.42);backdrop-filter:blur(18px)}.vv-mini-menu .vv-mega-item{padding:11px 10px}.vv-nav-dropdown.active-parent>.vv-nav-trigger{color:var(--color-text)}.vv-nav-dropdown.active-parent>.vv-nav-trigger:after{width:100%}
            @media(max-width:1023px){.vv-nav-dropdown{display:block;width:100%}.vv-nav-trigger{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;padding:14px 0}.vv-nav-trigger:after{display:none}.vv-mega-menu,.vv-mini-menu{position:static;width:100%;transform:none!important;opacity:1;visibility:visible;pointer-events:auto;display:none;margin:0;padding:0;background:transparent;border:0;border-radius:0;box-shadow:none;backdrop-filter:none}.vv-nav-dropdown.open .vv-mega-menu,.vv-nav-dropdown.open .vv-mini-menu{display:block}.vv-mega-menu{grid-template-columns:1fr}.vv-mega-lead{padding:0 0 4px;border-right:0}.vv-mega-category{padding:11px 8px}.vv-mega-category.vv-secondary{margin-top:2px;padding-top:12px}.vv-advisory-submenu{margin-left:16px}.vv-advisory-submenu .vv-mega-item{padding:9px 7px;font-size:12px}.vv-mega-content{padding:10px 0 8px 14px}.vv-mega-heading{font-size:9px;margin:8px 0}.vv-mega-grid,.vv-other-grid{grid-template-columns:1fr;gap:0}.vv-mega-item{padding:9px 7px;font-size:12px}.vv-mini-menu{padding:0 0 6px 14px}.vv-simple-dropdown .vv-mega-item{border-bottom:1px solid rgba(255,255,255,.05)}}`;
        document.head.appendChild(style);

        const advisoryTrigger=navMenu.querySelector('.vv-advisory-trigger');
        const advisorySubmenu=navMenu.querySelector('.vv-advisory-submenu');
        if(advisoryTrigger&&advisorySubmenu){
            advisoryTrigger.addEventListener('click',e=>{
                e.preventDefault();
                const isOpen=!advisorySubmenu.hidden;
                advisorySubmenu.hidden=isOpen;
                advisoryTrigger.classList.toggle('open',!isOpen);
                advisoryTrigger.setAttribute('aria-expanded',String(!isOpen));
            });
        }
        const dropdowns = navMenu.querySelectorAll('.vv-nav-dropdown');
        const closeDropdowns = except => dropdowns.forEach(drop => { if (drop !== except) { drop.classList.remove('open'); const btn=drop.querySelector('.vv-nav-trigger'); if(btn) btn.setAttribute('aria-expanded','false'); } });
        dropdowns.forEach(drop => { const btn=drop.querySelector('.vv-nav-trigger'); if(!btn) return; btn.addEventListener('click',e=>{e.preventDefault();const open=drop.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));if(open)closeDropdowns(drop);}); });
        document.addEventListener('click',e=>{if(!e.target.closest('.vv-nav-dropdown'))closeDropdowns(null)});
        document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDropdowns(null)});

        if (window.location.pathname.endsWith('/services.html')) { document.title='Çözümlerimiz | Vitavolt Global'; const h1=document.querySelector('.section-title'); if(h1&&/ENERGY INFRASTRUCTURE|ALTYAPI/i.test(h1.textContent))h1.textContent='ENERJİ ÇÖZÜMLERİ'; const subtitle=document.querySelector('.section-subtitle'); if(subtitle)subtitle.textContent='Yenilenebilir enerji · Endüstriyel çözümler · Karbon · Su · VITA Intelligence'; }
        const pathNow=window.location.pathname;
        dropdowns.forEach(drop=>{const menu=drop.dataset.menu;let active=false;if(menu==='solutions')active=/izmir-ges|izmir-bess|izmir-endustriyel|izmir-karbon|izmir-yagmur|izmir-gri|services\.html|konut-kucuk|ticari-otel|yenilenebilir-enerji-sistemleri/.test(pathNow);if(menu==='sectors')active=/izmir-endustriyel|konut-kucuk|ticari-otel/.test(pathNow);if(menu==='vita')active=/vita-energy-intelligence|anne|research/.test(pathNow);drop.classList.toggle('active-parent',active);});
    }

    // Smooth scroll for same-page anchors.
    document.querySelectorAll('a[href^="#"],a[href*="#"]').forEach(anchor=>anchor.addEventListener('click',function(e){const href=this.getAttribute('href');if(!href||!href.includes('#'))return;const hash=href.substring(href.indexOf('#'));if(hash==='#'||hash.length<2)return;const base=href.split('#')[0];const same=href.charAt(0)==='#'||base===''||base===window.location.pathname||base==='/'+(window.location.pathname.split('/').pop()||'index.html');if(!same)return;const target=document.querySelector(hash);if(target){e.preventDefault();const headerH=header?header.offsetHeight:0;window.scrollTo({top:target.getBoundingClientRect().top+window.pageYOffset-headerH,behavior:'smooth'});}}));

    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.fade-in,.service-card,.stat-card,.path-card').forEach(el=>observer.observe(el));

    const navLinks=document.querySelectorAll('.nav-link');const path=window.location.pathname;const currentPage=path.split('/').pop()||'index.html';const isResearchPath=path.indexOf('/research')!==-1||['anne.html','edcs.html','anne-ai.html'].includes(currentPage);
    navLinks.forEach(link=>{const href=link.getAttribute('href')||'';if(link.classList.contains('vv-nav-trigger'))return;let isActive=href===currentPage||(href==='index.html'&&(currentPage===''||currentPage==='/'))||(href==='/index.html'&&currentPage==='index.html')||(href==='/blog/'&&path.indexOf('/blog')!==-1)||(href==='/research/'&&isResearchPath);link.classList.toggle('active',isActive);});

    const menuToggle=document.querySelector('.menu-toggle');const menuOverlay=document.querySelector('.menu-overlay');
    function closeMenu(){if(navMenu)navMenu.classList.remove('active');if(menuToggle){menuToggle.classList.remove('active');menuToggle.setAttribute('aria-expanded','false')}if(menuOverlay)menuOverlay.classList.remove('active');document.body.classList.remove('menu-open');if(navMenu)navMenu.querySelectorAll('.vv-nav-dropdown.open').forEach(drop=>{drop.classList.remove('open');const btn=drop.querySelector('.vv-nav-trigger');if(btn)btn.setAttribute('aria-expanded','false')});}
    function openMenu(){if(navMenu)navMenu.classList.add('active');if(menuToggle){menuToggle.classList.add('active');menuToggle.setAttribute('aria-expanded','true')}if(menuOverlay)menuOverlay.classList.add('active');document.body.classList.add('menu-open');}
    if(menuToggle&&navMenu){menuToggle.setAttribute('aria-expanded','false');menuToggle.addEventListener('click',()=>navMenu.classList.contains('active')?closeMenu():openMenu());navMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));if(menuOverlay)menuOverlay.addEventListener('click',closeMenu);}

    const langBtns=document.querySelectorAll('[data-set-lang]');function setLang(lang){document.documentElement.lang=lang==='en'?'en':'tr';document.querySelectorAll('[data-lang]').forEach(el=>el.hidden=el.getAttribute('data-lang')!==lang);langBtns.forEach(btn=>{const on=btn.getAttribute('data-set-lang')===lang;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));});try{localStorage.setItem('vv_lang',lang)}catch(e){}}
    langBtns.forEach(btn=>btn.addEventListener('click',()=>setLang(btn.getAttribute('data-set-lang'))));let initialLang='tr';try{const stored=localStorage.getItem('vv_lang');if(stored==='en'||stored==='tr')initialLang=stored}catch(e){}if(langBtns.length)setLang(initialLang);
    window.addEventListener('resize',()=>setTimeout(()=>{if(window.innerWidth>1023)closeMenu()},250),{passive:true});

    // Global visual layer: one shared stylesheet, loaded after the base CSS so it can safely override presentation only.
    if (!document.querySelector('link[data-vv-visual]')) {
        const visual = document.createElement('link');
        visual.rel = 'stylesheet';
        visual.href = '/css/vitavolt-visual.css';
        visual.dataset.vvVisual = 'true';
        document.head.appendChild(visual);
    }
});