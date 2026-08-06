// ============================================================
//  MATERIA — main.js (v2.0 — JSON-driven / Decap CMS ready)
//  Όλο το δυναμικό περιεχόμενο φορτώνεται με fetch() από /content/*.json
// ============================================================

// ============================================================
// PREMIUM CUSTOM CURSOR — Disabled on touch devices
// ============================================================
const isTouchDevice = () => window.matchMedia('(hover: none)').matches;
const cursor = document.querySelector('.custom-cursor');

if (!isTouchDevice() && cursor) {
    document.addEventListener('mousemove', (e) => {
        cursor.style.transform = `translate(${e.clientX - (cursor.offsetWidth / 2)}px, ${e.clientY - (cursor.offsetHeight / 2)}px)`;
    });
}

// Ενιαία συνάρτηση για cursor hover — καλείται και μετά από κάθε δυναμικό render
function attachCursorListeners(scope = document) {
    if (isTouchDevice() || !cursor) return;
    const interactive = 'a, button, .ov-cat-item, .ov-product-item, .job-item, .blog-card, .pillar-card, .nav-logo';
    scope.querySelectorAll(interactive).forEach(el => {
        if (el.dataset.cursorBound) return; // αποφυγή διπλών listeners
        el.dataset.cursorBound = '1';
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
}
attachCursorListeners();

// ============================================================
// HELPERS — Ασφαλής φόρτωση JSON & προστασία από κακά δεδομένα
// ============================================================

/**
 * Φορτώνει ένα JSON αρχείο. Αν αποτύχει (404, δίκτυο, χαλασμένο JSON),
 * επιστρέφει το fallback ΧΩΡΙΣ να σπάσει τη σελίδα.
 */
async function fetchJSON(url, fallback = null) {
    try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn(`[MATERIA] Αποτυχία φόρτωσης ${url}:`, err.message);
        return fallback;
    }
}

/** Escape HTML — το περιεχόμενο έρχεται από CMS, ποτέ raw στο DOM. */
function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/** "2025-01-15" → "15 Ιανουαρίου 2025" (με ανοχή σε κακές τιμές) */
function formatDateGr(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return esc(iso); // αν δεν είναι έγκυρη ημερομηνία, δείξ' τη ως έχει
    const months = ['Ιανουαρίου','Φεβρουαρίου','Μαρτίου','Απριλίου','Μαΐου','Ιουνίου',
                    'Ιουλίου','Αυγούστου','Σεπτεμβρίου','Οκτωβρίου','Νοεμβρίου','Δεκεμβρίου'];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// ============================================================
// NAVBAR
// ============================================================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    const sections = ['about', 'blog', 'careers', 'contact'];
    let current = '';
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) current = id;
    });
    document.querySelectorAll('.nav-links a[data-section]').forEach(a => {
        a.classList.toggle('active', a.dataset.section === current);
    });
});

// ============================================================
// MOBILE BURGER MENU
// ============================================================
const burger = document.getElementById('mobile-burger');
const navLinks = document.querySelector('.nav-links');

burger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    burger.classList.toggle('toggle');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        burger.classList.remove('toggle');
    });
});

document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        burger.classList.remove('toggle');
    }
});

// ============================================================
// 1. BRAND TICKER — από /content/brands.json
// ============================================================
function renderTicker(brands) {
    const track = document.getElementById('ticker-track');
    if (!track) return;

    const list = Array.isArray(brands) ? brands.filter(b => b && String(b).trim()) : [];
    if (list.length === 0) {
        // Κομψό fallback: κρύβουμε όλη την ενότητα αντί για άδεια λωρίδα
        document.getElementById('brands')?.style.setProperty('display', 'none');
        return;
    }

    track.innerHTML = '';
    [...list, ...list].forEach(b => {
        const el = document.createElement('div');
        el.className = 'ticker-item';
        el.textContent = b;
        track.appendChild(el);
    });
}

// ============================================================
// 2. BLOG GRID — από /content/blog.json
// ============================================================

// Τα 3 γραφικά μοτίβα του αρχικού σχεδιασμού — εναλλάσσονται κυκλικά
const BLOG_PATTERNS = [
    'linear-gradient(135deg,rgba(255,77,0,0.15) 0%,rgba(5,10,24,0.8) 100%),repeating-linear-gradient(45deg,rgba(255,255,255,0.02) 0,rgba(255,255,255,0.02) 1px,transparent 0,transparent 50%) 0/15px 15px',
    'linear-gradient(225deg,rgba(30,60,180,0.25) 0%,rgba(5,10,24,0.9) 100%),repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0,rgba(255,255,255,0.025) 1px,transparent 0,transparent 40px) 0/40px 40px',
    'linear-gradient(315deg,rgba(255,77,0,0.1) 0%,rgba(5,10,24,0.9) 100%),repeating-linear-gradient(60deg,rgba(255,255,255,0.02) 0,rgba(255,255,255,0.02) 1px,transparent 0,transparent 25px) 0/25px 25px'
];

function renderBlog(data) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    const posts = Array.isArray(data?.posts) ? data.posts.filter(p => p && p.title) : [];
    if (posts.length === 0) {
        grid.innerHTML = '<div class="ov-empty-msg" style="padding:40px 0;">Νέα άρθρα έρχονται σύντομα.</div>';
        return;
    }

    // Το featured άρθρο πρώτο· αλλιώς το πρώτο της λίστας γίνεται featured
    const sorted = [...posts].sort((a, b) => (b.featured === true) - (a.featured === true));

    grid.innerHTML = sorted.map((post, i) => {
        const featured = i === 0;
        const imgStyle = post.image
            ? `background:url('${esc(post.image)}') center/cover no-repeat;`
            : `background:${BLOG_PATTERNS[i % BLOG_PATTERNS.length]};`;
        const tag = esc(post.tag || 'ΑΡΘΡΟ') + (featured ? ' • FEATURED' : '');
        const meta = [formatDateGr(post.date), esc(post.readTime || '')]
            .filter(Boolean).map(m => `<span>${m}</span>`).join('');

        return `
            <div class="blog-card ${featured ? 'featured' : ''}" data-aos="fade-up" data-aos-delay="${100 + i * 100}">
                <div class="blog-card-img"><div class="blog-card-img-pattern" style="${imgStyle}"></div></div>
                <div class="blog-card-body">
                    <div class="blog-card-tag">${tag}</div>
                    <div class="blog-card-title">${esc(post.title)}</div>
                    <div class="blog-card-meta">${meta}</div>
                </div>
            </div>
        `;
    }).join('');

    attachCursorListeners(grid);
}

// ============================================================
// 3. CAREERS — από /content/careers.json
// ============================================================
function renderCareers(data) {
    const list = document.getElementById('job-list');
    if (!list) return;

    const intro = document.getElementById('careers-intro');
    if (intro && data?.intro) intro.textContent = data.intro;

    const jobs = (Array.isArray(data?.jobs) ? data.jobs : [])
        .filter(j => j && j.title && j.active !== false); // μόνο ενεργές θέσεις

    if (jobs.length === 0) {
        list.innerHTML = '<div class="ov-empty-msg" style="padding:24px 0;">Δεν υπάρχουν ανοιχτές θέσεις αυτή τη στιγμή. Στείλτε μας το βιογραφικό σας για μελλοντικές ευκαιρίες.</div>';
        return;
    }

    list.innerHTML = jobs.map(job => {
        const meta = [job.location, job.type, job.experience]
            .filter(Boolean).map(esc).join(' • ');
        return `
            <div class="job-item">
                <div class="job-info">
                    <div class="job-title">${esc(job.title)}</div>
                    <div class="job-meta">${meta}</div>
                </div>
                <div class="job-arrow">→</div>
            </div>
        `;
    }).join('');

    attachCursorListeners(list);
}

// ============================================================
// 4. LOCATIONS & CONTACT — από /content/locations.json
// ============================================================
function renderLocations(data) {
    const emailEl = document.getElementById('contact-email');
    if (emailEl) emailEl.textContent = data?.email || 'info@materia.gr';

    const wrap = document.getElementById('locations-list');
    if (!wrap) return;

    const locations = Array.isArray(data?.locations) ? data.locations.filter(l => l && l.name) : [];
    if (locations.length === 0) {
        wrap.innerHTML = '<div class="ov-empty-msg">Τα σημεία εξυπηρέτησης θα ανακοινωθούν σύντομα.</div>';
        return;
    }

    wrap.innerHTML = locations.map(loc => {
        const addressHTML = esc(loc.address || '').replace(/\n/g, '<br>');
        return `
            <div class="showroom-card">
                <div class="showroom-title">◈ ${esc(loc.name)}</div>
                <div class="showroom-address">
                    ${addressHTML}${addressHTML ? '<br>' : ''}
                    ${loc.phone ? `<strong>Τ: ${esc(loc.phone)}</strong>` : ''}
                </div>
                ${loc.hours ? `<div class="showroom-hours">${esc(loc.hours)}</div>` : ''}
            </div>
        `;
    }).join('');
}

// ============================================================
// 5. PRODUCT OVERLAY — COMMAND CENTER (από /content/products.json)
// ============================================================

const overlay      = document.getElementById('product-overlay');
const navProducts  = document.getElementById('nav-products');
const ovCatList    = document.getElementById('ov-cat-list');
const ovProductsP  = document.getElementById('ov-products-pane');
const ovActiveCat  = document.getElementById('ov-active-cat-title');
const ovProdCount  = document.getElementById('ov-product-count');
const ovDetailImg  = document.getElementById('ov-detail-img-inner');
const ovDetailCont = document.getElementById('ov-detail-content');
const ovSearch     = document.getElementById('ov-search');
const backBtn      = document.getElementById('ov-back-btn');
const mobileTitle  = document.getElementById('ov-mobile-title');

let productCategories = [];   // γεμίζει από το products.json
let activeCategory = null;    // όνομα ενεργής κατηγορίας
let currentView    = 'cats';

const getCategory = (name) => productCategories.find(c => c.name === name) || null;

// --- OPEN / CLOSE ---

function openOverlay() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    navProducts.classList.add('overlay-active');

    if (productCategories.length === 0) {
        // Fallback: δεν φορτώθηκε ο κατάλογος
        ovCatList.innerHTML = '<div class="ov-empty-msg" style="padding:20px;">Ο κατάλογος δεν είναι διαθέσιμος αυτή τη στιγμή.<br>Δοκιμάστε ξανά σε λίγο.</div>';
        ovActiveCat.textContent = 'Μη διαθέσιμο';
        ovProdCount.textContent = '';
    } else if (!activeCategory) {
        selectCategory(productCategories[0].name, false);
    }

    currentView = 'cats';
    overlay.classList.remove('view-prods', 'view-detail');
    updateMobileUI();
}

function closeOverlay() {
    overlay.classList.remove('open', 'view-prods', 'view-detail');
    document.body.style.overflow = '';
    navProducts.classList.remove('overlay-active');
    currentView = 'cats';
}

navProducts.addEventListener('click', e => {
    e.preventDefault();
    overlay.classList.contains('open') ? closeOverlay() : openOverlay();
});

document.getElementById('hero-products-btn')?.addEventListener('click', e => {
    e.preventDefault();
    openOverlay();
});

document.getElementById('ov-close-btn').addEventListener('click', closeOverlay);
document.getElementById('ov-close-btn-mob')?.addEventListener('click', closeOverlay);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeOverlay();
});

overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay();
});

// --- CATEGORY RENDERING ---

function renderCategories() {
    ovCatList.innerHTML = '';

    productCategories.forEach(cat => {
        const total = (cat.subcategories || []).reduce((sum, s) => sum + (s.products?.length || 0), 0);

        const el = document.createElement('div');
        el.className = `ov-cat-item ${cat.name === activeCategory ? 'active' : ''}`;
        el.innerHTML = `
            <div class="ov-cat-icon">${esc(cat.icon || '◈')}</div>
            <span>${esc(cat.name)}</span>
            <div class="ov-cat-count">${total}</div>
        `;

        el.addEventListener('click', () => selectCategory(cat.name, true));
        el.addEventListener('mouseenter', () => {
            if (window.innerWidth > 800) selectCategory(cat.name, false);
        });

        ovCatList.appendChild(el);
    });

    attachCursorListeners(ovCatList);
}

function selectCategory(catName, isClick) {
    activeCategory = catName;
    renderCategories();
    renderProducts(catName, ovSearch.value);
    resetDetail();

    if (isClick && window.innerWidth <= 800) {
        currentView = 'prods';
        overlay.classList.add('view-prods');
        overlay.classList.remove('view-detail');
        updateMobileUI();
    }
}

// --- PRODUCT RENDERING ---

function renderProducts(catName, query = '') {
    const cat = getCategory(catName);
    if (!cat) return;

    ovActiveCat.textContent = catName;
    const q = String(query || '').toLowerCase();
    let count = 0;
    let html = '';

    (cat.subcategories || []).forEach((sub, subIdx) => {
        const products = sub.products || [];
        // ΣΗΜΑΝΤΙΚΟ: κρατάμε το ΑΡΧΙΚΟ index (origIdx) ώστε το κλικ να βρίσκει
        // το σωστό προϊόν ακόμα και όταν η λίστα είναι φιλτραρισμένη από αναζήτηση.
        const filtered = products
            .map((p, origIdx) => ({ p, origIdx }))
            .filter(({ p }) => !q
                || (p.name || '').toLowerCase().includes(q)
                || (p.range || '').toLowerCase().includes(q));

        if (filtered.length === 0) return;
        count += filtered.length;

        html += `
            <div class="ov-subcat-section">
                <div class="ov-subcat-title">${esc(sub.name)}</div>
                <div class="ov-product-grid">
        `;
        filtered.forEach(({ p, origIdx }) => {
            html += `
                <div class="ov-product-item" data-cat="${esc(catName)}" data-sub="${subIdx}" data-idx="${origIdx}">
                    <div class="ov-product-name">${esc(p.name || 'Χωρίς όνομα')}</div>
                    <div class="ov-product-range">${esc(p.range || '')}</div>
                    ${p.tag ? `<span class="ov-product-tag">${esc(p.tag)}</span>` : ''}
                </div>
            `;
        });
        html += `</div></div>`;
    });

    ovProductsP.innerHTML = html || '<div class="ov-empty-msg">Δεν βρέθηκαν προϊόντα.</div>';
    ovProdCount.textContent = `${count} προϊόντα`;

    ovProductsP.querySelectorAll('.ov-product-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            if (window.innerWidth > 800) showDetail(getProductData(item), item);
        });
        item.addEventListener('click', () => {
            showDetail(getProductData(item), item);
            if (window.innerWidth <= 800) {
                currentView = 'detail';
                overlay.classList.add('view-detail');
                updateMobileUI();
            }
        });
    });

    attachCursorListeners(ovProductsP);
}

function getProductData(el) {
    const cat = getCategory(el.dataset.cat);
    const sub = cat?.subcategories?.[parseInt(el.dataset.sub)];
    return sub?.products?.[parseInt(el.dataset.idx)] || null;
}

// --- DETAIL RENDERING ---

function showDetail(prod, itemEl) {
    if (!prod) { resetDetail(); return; }

    ovProductsP.querySelectorAll('.ov-product-item').forEach(i => i.classList.remove('hovered'));
    itemEl.classList.add('hovered');

    const cat = getCategory(itemEl.dataset.cat);
    const highlights = Array.isArray(prod.highlights) ? prod.highlights.filter(Boolean) : [];
    const materials  = Array.isArray(prod.materials)  ? prod.materials.filter(Boolean)  : [];

    const materialsHTML = materials.length ? `
        <div class="ov-detail-materials">
            <div class="ov-material-label">ΓΚΑΜΑ ΥΛΙΚΩΝ / ΣΥΣΤΗΜΑ</div>
            <ul>${materials.map(m => `<li><span>•</span> ${esc(m)}</li>`).join('')}</ul>
        </div>
    ` : '';

    ovDetailImg.innerHTML = `
        <div class="material-preview">
            <div class="material-preview-bg" style="background: linear-gradient(135deg, ${esc(prod.color || '#ff4d0033')} 0%, var(--navy) 100%);"></div>
            <div class="material-preview-info">
                <div class="material-preview-icon">${esc(cat?.icon || '◈')}</div>
                <div class="material-preview-range">${esc(prod.range || '')}</div>
            </div>
        </div>
    `;

    ovDetailCont.innerHTML = `
        <div class="ov-detail-tag">${esc(prod.tag || 'ΠΡΟΪΟΝ')} — TECHNICAL DATA</div>
        <div class="ov-detail-name">${esc(prod.name || '')}</div>
        <div class="ov-detail-desc">${esc(prod.desc || 'Επικοινωνήστε μαζί μας για την πλήρη τεχνική περιγραφή.')}</div>
        ${highlights.length ? `
            <div class="ov-highlights">
                ${highlights.map(h => `<span class="ov-highlight">${esc(h)}</span>`).join('')}
            </div>
        ` : ''}
        ${materialsHTML}
        <div class="ov-detail-actions">
            <button class="ov-btn-primary">ΤΕΧΝΙΚΟ ΦΥΛΛΑΔΙΟ (PDF)</button>
            <button class="ov-btn-ghost">REQUEST QUOTE</button>
        </div>
    `;

    attachCursorListeners(ovDetailCont);
}

function resetDetail() {
    ovDetailImg.innerHTML = `<div class="ov-detail-placeholder"><div class="ov-detail-placeholder-icon">◈</div><div class="ov-detail-placeholder-text">HOVER A PRODUCT</div></div>`;
    ovDetailCont.innerHTML = `<div class="ov-detail-empty"><div class="ov-detail-empty-icon">◈</div><div class="ov-detail-empty-text">TECHNICAL PREVIEW</div></div>`;
}

// --- MOBILE NAVIGATION ---

function updateMobileUI() {
    if (window.innerWidth > 800) return;

    if (currentView === 'cats') {
        if (backBtn) backBtn.style.visibility = 'hidden';
        if (mobileTitle) mobileTitle.textContent = 'ΚΑΤΗΓΟΡΙΕΣ';
    } else if (currentView === 'prods') {
        if (backBtn) backBtn.style.visibility = 'visible';
        if (mobileTitle) mobileTitle.textContent = activeCategory || 'ΠΡΟΪΟΝΤΑ';
    } else if (currentView === 'detail') {
        if (backBtn) backBtn.style.visibility = 'visible';
        if (mobileTitle) mobileTitle.textContent = 'ΛΕΠΤΟΜΕΡΕΙΕΣ';
    }
}

backBtn?.addEventListener('click', () => {
    if (currentView === 'detail') {
        currentView = 'prods';
        overlay.classList.remove('view-detail');
    } else if (currentView === 'prods') {
        currentView = 'cats';
        overlay.classList.remove('view-prods');
    }
    updateMobileUI();
});

// --- SEARCH ---
ovSearch.addEventListener('input', e => {
    if (activeCategory) renderProducts(activeCategory, e.target.value);
});

// ============================================================
// PARALLAX HERO — Disabled on mobile
// ============================================================
window.addEventListener('scroll', () => {
    if (window.innerWidth <= 800) return;
    const content = document.querySelector('.hero-content');
    const s = window.scrollY;
    if (content && s < window.innerHeight) {
        content.style.transform = `translateY(${s * 0.18}px)`;
        content.style.opacity = 1 - s / (window.innerHeight * 0.8);
    }
});

document.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 800) return;
    const bg = document.querySelector('.hero-bg');
    if (!bg) return;
    const x = (window.innerWidth  - e.pageX * 2) / 100;
    const y = (window.innerHeight - e.pageY * 2) / 100;
    bg.style.transform = `scale(1.1) translate(${x}px, ${y}px)`;
});

// ============================================================
// BOOTSTRAP — Φόρτωση όλου του περιεχομένου στο DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {

    // Παράλληλη φόρτωση όλων των JSON — καμία δεν μπλοκάρει τις υπόλοιπες
    const [products, brands, blog, careers, locations] = await Promise.all([
        fetchJSON('/content/products.json',  { categories: [] }),
        fetchJSON('/content/brands.json',    { brands: [] }),
        fetchJSON('/content/blog.json',      { posts: [] }),
        fetchJSON('/content/careers.json',   { jobs: [] }),
        fetchJSON('/content/locations.json', { locations: [] })
    ]);

    productCategories = Array.isArray(products?.categories) ? products.categories.filter(c => c && c.name) : [];

    renderTicker(brands?.brands);
    renderBlog(blog);
    renderCareers(careers);
    renderLocations(locations);

    // Το AOS αρχικοποιείται ΜΕΤΑ το render ώστε να "δει" τα δυναμικά στοιχεία
    AOS.init({ duration: 800, easing: 'cubic-bezier(0.16,1,0.3,1)', once: true, offset: 80 });
});
