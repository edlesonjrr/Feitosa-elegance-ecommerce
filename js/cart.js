/* cart.js — Cart state + UI */
import { CAT_ICONS } from './products.js';
import { showToast } from './ui.js';
import { openCheckout } from './checkout.js';

let cart = [];
const WPP = '5581983207224';

/* ── Formatting ── */
export const fmt = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* ── Cart operations ── */
export function addItem(product) {
    const ex = cart.find(i => i.id === product.id);
    if (ex) ex.qty++;
    else cart.push({ ...product, qty: 1 });
    persist();
    renderDrawer();
    showToast(`<span class="toast-icon">✓</span> <b>${product.name.split(' ').slice(0, 3).join(' ')}</b> adicionado!`);
    bumpBadge();
    flyToCart(product);
}

export function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    persist();
    renderDrawer();
}

export function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) removeItem(id);
    else { persist(); renderDrawer(); }
}

export function getCart() { return cart; }
export function getTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
export function getTotalItems() { return cart.reduce((s, i) => s + i.qty, 0); }
export function clearCart() { cart = []; persist(); renderDrawer(); }

function persist() {
    try { localStorage.setItem('fe_cart', JSON.stringify(cart)); } catch (e) { }
}
function load() {
    try { const d = localStorage.getItem('fe_cart'); if (d) cart = JSON.parse(d); } catch (e) { }
}


function flyToCart(product) {
    // Encontra o botão que foi clicado (último add-btn com .adding)
    const btn = document.querySelector('.add-btn.adding, .add-to-cart-btn.adding');
    const cartIcon = document.getElementById('cart-btn');
    if (!btn || !cartIcon) return;

    const bRect = btn.getBoundingClientRect();
    const cRect = cartIcon.getBoundingClientRect();

    const dot = document.createElement('div');
    dot.className = 'fly-dot';
    dot.style.cssText = `
        position: fixed;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--rose), var(--gold));
        box-shadow: 0 2px 10px rgba(200,133,106,.5);
        z-index: 9999;
        pointer-events: none;
        left: ${bRect.left + bRect.width / 2 - 7}px;
        top: ${bRect.top + bRect.height / 2 - 7}px;
        transition: none;
    `;
    document.body.appendChild(dot);

    // Force reflow
    dot.getBoundingClientRect();

    const destX = cRect.left + cRect.width / 2 - 7;
    const destY = cRect.top + cRect.height / 2 - 7;

    dot.style.transition = 'all 0.55s cubic-bezier(.4,0,.2,1)';
    dot.style.left = destX + 'px';
    dot.style.top = destY + 'px';
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.opacity = '0';
    dot.style.transform = 'scale(0)';

    setTimeout(() => {
        dot.remove();
        // Flash no ícone do carrinho
        cartIcon.classList.add('cart-flash');
        setTimeout(() => cartIcon.classList.remove('cart-flash'), 400);
    }, 560);
}

/* ── Drawer UI ── */
const overlay = document.getElementById('cart-overlay');
const drawer = document.getElementById('cart-drawer');
const bodyEl = document.getElementById('cart-body');
const footerEl = document.getElementById('cart-footer');
const badge = document.getElementById('cart-badge');
const countEl = document.getElementById('cart-items-count');

export function openCart() {
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
}
export function closeCart() {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
}

function bumpBadge() {
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 400);
}

function updateBadge() {
    const total = getTotalItems();
    badge.textContent = total;
    badge.classList.toggle('visible', total > 0);
    if (countEl) countEl.textContent = total;
}


function shippingProgress() {
    const FREE_THRESHOLD = 200;
    const total = getTotal();
    const pct = Math.min((total / FREE_THRESHOLD) * 100, 100);
    const fill = document.getElementById('ship-fill');
    const txt = document.getElementById('ship-text');
    const truck = document.getElementById('ship-truck');
    if (!fill || !txt) return;

    fill.style.width = pct + '%';

    // Move o caminhão junto com a barra
    if (truck) {
        truck.style.left = `calc(${pct}% - 18px)`;
        truck.classList.toggle('arrived', pct >= 100);
    }

    if (total >= FREE_THRESHOLD) {
        txt.innerHTML = `<span class="ship-success">🎉 Frete grátis desbloqueado!</span>`;
    } else {
        const missing = fmt(FREE_THRESHOLD - total);
        txt.innerHTML = `Faltam <strong>${missing}</strong> para frete grátis`;
    }
}


function renderEmpty() {
    return `
    <div class="cart-empty">
      <div class="cart-empty-visual">
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Sacola -->
          <path d="M28 34h64l-8 48H36L28 34z" fill="url(#bagGrad)" opacity=".12"/>
          <path d="M28 34h64l-8 48H36L28 34z" stroke="url(#bagGrad)" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
          <!-- Alça -->
          <path d="M44 34c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke="url(#bagGrad)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <!-- Estrelinhas decorativas -->
          <circle cx="92" cy="20" r="2" fill="#E8B9A8" opacity=".6"/>
          <circle cx="100" cy="35" r="1.5" fill="#E8D5B0" opacity=".5"/>
          <circle cx="18" cy="45" r="2" fill="#E8B9A8" opacity=".5"/>
          <circle cx="25" cy="22" r="1.5" fill="#E8D5B0" opacity=".4"/>
          <!-- Tag de preço -->
          <rect x="49" y="52" width="22" height="14" rx="4" fill="url(#tagGrad)" opacity=".2"/>
          <path d="M49 52h22v14H49z" stroke="url(#tagGrad)" stroke-width="1.5" rx="4" fill="none"/>
          <line x1="54" y1="59" x2="66" y2="59" stroke="#C8856A" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>
          <defs>
            <linearGradient id="bagGrad" x1="28" y1="34" x2="92" y2="82" gradientUnits="userSpaceOnUse">
              <stop stop-color="#C8856A"/>
              <stop offset="1" stop-color="#C9A96E"/>
            </linearGradient>
            <linearGradient id="tagGrad" x1="49" y1="52" x2="71" y2="66" gradientUnits="userSpaceOnUse">
              <stop stop-color="#C8856A"/>
              <stop offset="1" stop-color="#C9A96E"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h4>Seu estilo está esperando</h4>
      <p>Explore nossa coleção e encontre peças que combinam com você.</p>
      <button class="btn btn-rose btn-sm" id="cart-browse">
        <i class="ri-store-2-line"></i> Explorar Coleção
      </button>
    </div>`;
}

function renderItems() {
    return `<ul class="cart-items">` + cart.map(item => {
        const icon = CAT_ICONS[item.cat] || '🛍️';
        return `
      <li class="cart-item" data-id="${item.id}">
        <div class="ci-img">
          <img src="${item.image}" alt="${item.name}" loading="lazy"
            onerror="this.style.display='none';this.parentElement.innerHTML='${icon}'"/>
        </div>
        <div class="ci-info">
          <p class="ci-name">${item.name}</p>
          <p class="ci-cat">${item.cat}</p>
          <p class="ci-unit-price">${fmt(item.price)} / un</p>
          <div class="ci-qty">
            <button class="ci-qty-btn minus" data-id="${item.id}" data-delta="-1">−</button>
            <span class="ci-qty-num">${item.qty}</span>
            <button class="ci-qty-btn" data-id="${item.id}" data-delta="1">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;">
          <span class="ci-total-price">${fmt(item.price * item.qty)}</span>
          <button class="ci-remove" data-id="${item.id}" aria-label="Remover">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </li>`;
    }).join('') + `</ul>`;
}

function bindItemEvents() {
    bodyEl.querySelectorAll('.ci-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.id), parseInt(btn.dataset.delta)));
    });
    bodyEl.querySelectorAll('.ci-remove').forEach(btn => {
        btn.addEventListener('click', () => removeItem(parseInt(btn.dataset.id)));
    });
    const browseBtn = bodyEl.querySelector('#cart-browse');
    if (browseBtn) browseBtn.addEventListener('click', closeCart);
}

export function renderDrawer() {
    updateBadge();
    shippingProgress();
    const hasItems = cart.length > 0;
    bodyEl.innerHTML = hasItems ? renderItems() : renderEmpty();
    footerEl.style.display = hasItems ? 'flex' : 'none';
    if (hasItems) {
        document.getElementById('cart-subtotal-val').textContent = fmt(getTotal());
        bindItemEvents();
    }
}

/* ── Init ── */
export function initCart() {
    load();
    renderDrawer();
    document.getElementById('cart-btn').addEventListener('click', openCart);
    overlay.addEventListener('click', closeCart);
    document.getElementById('cart-close-btn').addEventListener('click', closeCart);
    document.getElementById('checkout-btn').addEventListener('click', () => {
        closeCart();
        openCheckout();
    });
}