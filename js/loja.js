/* loja.js — Products grid, filter, sort, search, modal */
import { PRODUCTS, CAT_ICONS } from './products.js';
import { addItem, getCart } from './cart.js';
import { playSfx } from './ui.js';

const BATCH = 8;
let visible = BATCH;
let currentCat = 'all';
let currentSort = 'default';
let currentSearch = '';
let renderScheduled = false;

const grid = document.getElementById('products-grid');
const countEl = document.getElementById('loja-count');
const loadBtn = document.getElementById('load-more-btn');

export function initSearch() {
  // Injeta a barra de busca dinamicamente acima da grade
  const lojaHeader = document.querySelector('.loja-header');
  if (!lojaHeader) return;

  const wrap = document.createElement('div');
  wrap.className = 'search-wrap';
  wrap.innerHTML = `
        <div class="search-box">
            <i class="ri-search-line search-icon"></i>
            <input
                type="search"
                id="product-search"
                class="search-input"
                placeholder="Buscar produtos…"
                autocomplete="off"
                spellcheck="false"
                aria-label="Buscar produtos"
            />
            <button class="search-clear" id="search-clear" aria-label="Limpar busca" style="display:none">
                <i class="ri-close-line"></i>
            </button>
        </div>
    `;
  lojaHeader.insertAdjacentElement('afterend', wrap);

  const input = document.getElementById('product-search');
  const clearBtn = document.getElementById('search-clear');

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = input.value.trim().toLowerCase();
      clearBtn.style.display = currentSearch ? 'flex' : 'none';
      visible = BATCH;
      renderProducts();
    }, 220);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    currentSearch = '';
    clearBtn.style.display = 'none';
    input.focus();
    visible = BATCH;
    renderProducts();
  });
}

/* ── Filter ── */
function getFiltered() {
  let list = currentCat === 'all' ? [...PRODUCTS] : PRODUCTS.filter(p => p.cat === currentCat);
  if (currentSearch) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(currentSearch) ||
      p.cat.toLowerCase().includes(currentSearch) ||
      p.desc.toLowerCase().includes(currentSearch)
    );
  }
  if (currentSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (currentSort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

/* ── Preço PIX ── */
function pixPrice(price) {
  return (price * 0.95).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getCartQty(id) {
  return getCart().find(i => i.id === id)?.qty || 0;
}

/* ── Card HTML ── */
function cardHTML(p, idx = 0) {
  const icon = CAT_ICONS[p.cat] || '🛍️';
  const badgeHTML = p.badge
    ? `<span class="pcard-badge pcard-badge-${p.badge === 'hot' ? 'hot' : 'new'}">${p.badge === 'hot' ? '🔥 Destaque' : '✨ Novo'}</span>`
    : '';
  const loadStrategy = idx < 4 ? 'eager' : 'lazy';
  const fetchPriority = idx < 2 ? 'high' : 'auto';
  const qty = getCartQty(p.id);
  const inCartBadge = qty > 0
    ? `<div class="pcard-in-cart" aria-label="${qty} no carrinho"><i class="ri-shopping-bag-fill"></i> ${qty}</div>`
    : '';

  // Destaca texto buscado
  const name = currentSearch
    ? p.name.replace(new RegExp(`(${currentSearch})`, 'gi'), '<mark>$1</mark>')
    : p.name;

  return `
    <article class="product-card entering${qty > 0 ? ' in-cart' : ''}" data-id="${p.id}" style="content-visibility:auto;contain-intrinsic-size:0 320px" role="button" tabindex="0" aria-label="Ver detalhes de ${p.name}">
      <div class="pcard-img">
        <img src="${p.image}" alt="${p.name}" width="400" height="400"
          loading="${loadStrategy}" fetchpriority="${fetchPriority}" decoding="async"
          onerror="this.style.display='none';this.nextElementSibling.classList.add('show')" />
        <div class="pcard-fallback">
          <span class="pcard-fallback-icon">${icon}</span>
          <span>${p.cat}</span>
        </div>
        <div class="pcard-badges">
          <span class="pcard-badge pcard-badge-cat">${p.cat}</span>
          ${badgeHTML}
        </div>
        ${inCartBadge}
        <button class="pcard-wish" aria-label="Favoritar" data-id="${p.id}">
          <i class="ri-heart-line"></i>
        </button>
      </div>
      <div class="pcard-body">
        <p class="pcard-cat">${p.cat}</p>
        <h3 class="pcard-name">${name}</h3>
        <p class="pcard-desc">${p.desc}</p>
      </div>
      <div class="pcard-footer">
        <div>
          <span class="pcard-price-label">Preço</span>
          <span class="pcard-price">${p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          <span class="pcard-pix-price"><i class="ri-flashlight-line"></i> ${pixPrice(p.price)} no PIX</span>
        </div>
        <button class="add-to-cart-btn add-btn" data-id="${p.id}" aria-label="Adicionar ao carrinho">
          <i class="ri-shopping-bag-add-line"></i>
        </button>
      </div>
    </article>`;
}

function openProductModal(product) {
  const existing = document.getElementById('product-modal-backdrop');
  if (existing) existing.remove();

  const icon = CAT_ICONS[product.cat] || '🛍️';
  const qty = getCartQty(product.id);
  const backdrop = document.createElement('div');
  backdrop.id = 'product-modal-backdrop';
  backdrop.className = 'pmodal-backdrop';
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-label', product.name);

  backdrop.innerHTML = `
        <div class="pmodal" id="pmodal">
            <div class="pmodal-handle" aria-hidden="true"></div>
            <button class="pmodal-close" id="pmodal-close" aria-label="Fechar">
                <i class="ri-close-line"></i>
            </button>

            <div class="pmodal-body">
                <div class="pmodal-img-wrap">
                    <img src="${product.image}" alt="${product.name}"
                        width="500" height="500" loading="eager" decoding="async"
                        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
                    <div class="pmodal-img-fallback" style="display:none">
                        <span>${icon}</span>
                    </div>
                    ${product.badge ? `<span class="pmodal-badge pcard-badge-${product.badge === 'hot' ? 'hot' : 'new'}">${product.badge === 'hot' ? '🔥 Destaque' : '✨ Novo'}</span>` : ''}
                </div>

                <div class="pmodal-info">
                    <p class="pmodal-cat">${product.cat}</p>
                    <h2 class="pmodal-name">${product.name}</h2>
                    <p class="pmodal-desc">${product.desc}</p>

                    <div class="pmodal-pricing">
                        <div class="pmodal-price-main">
                            <span class="pmodal-price-label">Preço</span>
                            <span class="pmodal-price">${product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div class="pmodal-pix-box">
                            <i class="ri-flashlight-fill"></i>
                            <div>
                                <span class="pmodal-pix-label">No PIX</span>
                                <span class="pmodal-pix-price">${pixPrice(product.price)}</span>
                            </div>
                            <span class="pmodal-pix-badge">5% OFF</span>
                        </div>
                    </div>

                    <div class="pmodal-perks">
                        <div class="pmodal-perk"><i class="ri-truck-line"></i> Frete grátis acima de R$ 200</div>
                        <div class="pmodal-perk"><i class="ri-shield-check-line"></i> Pagamento seguro</div>
                        <div class="pmodal-perk"><i class="ri-whatsapp-line"></i> Atendimento via WhatsApp</div>
                    </div>

                    <button class="btn btn-rose btn-lg btn-block pmodal-add-btn" id="pmodal-add" data-id="${product.id}">
                        <i class="ri-shopping-bag-line"></i>
                        ${qty > 0 ? `Adicionar mais (${qty} no carrinho)` : 'Adicionar ao Carrinho'}
                    </button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  // Abre com animação
  requestAnimationFrame(() => backdrop.classList.add('open'));

  function closeModal() {
    backdrop.classList.remove('open');
    setTimeout(() => {
      backdrop.remove();
      document.body.style.overflow = '';
    }, 380);
  }

  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  backdrop.querySelector('#pmodal-close').addEventListener('click', closeModal);

  // Escape
  const onKey = e => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);

  // Adicionar ao carrinho pelo modal
  backdrop.querySelector('#pmodal-add').addEventListener('click', () => {
    addItem(product);
    playSfx();
    const btn = backdrop.querySelector('#pmodal-add');
    btn.innerHTML = '<i class="ri-check-line"></i> Adicionado!';
    btn.style.background = 'var(--emerald)';
    const newQty = getCartQty(product.id);
    setTimeout(() => {
      btn.innerHTML = `<i class="ri-shopping-bag-line"></i> Adicionar mais (${newQty} no carrinho)`;
      btn.style.background = '';
    }, 1200);
  });

  // Swipe down para fechar (mobile)
  const pmodal = backdrop.querySelector('#pmodal');
  let swipeStartY = 0;
  pmodal.addEventListener('touchstart', e => { swipeStartY = e.touches[0].clientY; }, { passive: true });
  pmodal.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - swipeStartY > 80) closeModal();
  }, { passive: true });
}

/* ── Grid events — delegação ── */
function bindGridEvents() {
  grid.removeEventListener('click', handleGridClick);
  grid.addEventListener('click', handleGridClick);
}

function handleGridClick(e) {
  // Wishlist
  const wishBtn = e.target.closest('.pcard-wish');
  if (wishBtn) {
    e.stopPropagation();
    const active = wishBtn.classList.toggle('active');
    wishBtn.innerHTML = active ? '<i class="ri-heart-fill"></i>' : '<i class="ri-heart-line"></i>';
    return;
  }

  // Adicionar ao carrinho (botão redondo)
  const addBtn = e.target.closest('.add-to-cart-btn');
  if (addBtn) {
    e.stopPropagation();
    const id = parseInt(addBtn.dataset.id);
    const product = PRODUCTS.find(p => p.id === id);
    if (!product || addBtn.disabled) return;
    addBtn.disabled = true;
    addBtn.classList.add('adding');
    addBtn.innerHTML = '<i class="ri-check-line"></i>';
    addItem(product);
    playSfx();
    setTimeout(() => {
      addBtn.disabled = false;
      addBtn.classList.remove('adding');
      addBtn.innerHTML = '<i class="ri-shopping-bag-add-line"></i>';
      // Atualiza badge no card
      const card = addBtn.closest('.product-card');
      if (card) updateCardBadge(card, parseInt(card.dataset.id));
    }, 900);
    return;
  }

  // Clique no card → abre modal
  const card = e.target.closest('.product-card');
  if (card) {
    const id = parseInt(card.dataset.id);
    const product = PRODUCTS.find(p => p.id === id);
    if (product) openProductModal(product);
  }
}

function updateCardBadge(card, id) {
  const qty = getCartQty(id);
  const existing = card.querySelector('.pcard-in-cart');
  if (qty > 0) {
    if (existing) {
      existing.innerHTML = `<i class="ri-shopping-bag-fill"></i> ${qty}`;
    } else {
      const badge = document.createElement('div');
      badge.className = 'pcard-in-cart';
      badge.innerHTML = `<i class="ri-shopping-bag-fill"></i> ${qty}`;
      card.querySelector('.pcard-img').appendChild(badge);
    }
    card.classList.add('in-cart');
  } else {
    existing?.remove();
    card.classList.remove('in-cart');
  }
}

/* ── Render ── */
export function renderProducts() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    _doRender();
  });
}

function _doRender() {
  const filtered = getFiltered();
  const slice = filtered.slice(0, visible);

  if (countEl) {
    const n = filtered.length;
    if (currentSearch && n === 0) {
      countEl.innerHTML = `Nenhum resultado para <strong>"${currentSearch}"</strong>`;
    } else {
      countEl.innerHTML = `<strong>${n}</strong> produto${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}`;
    }
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
            <div class="no-results" style="grid-column:1/-1;text-align:center;padding:60px 20px">
                <div style="font-size:3rem;margin-bottom:16px">🔍</div>
                <h3 style="font-family:var(--font-serif);font-size:1.4rem;margin-bottom:8px">Nenhum produto encontrado</h3>
                <p style="color:var(--ink-60);font-size:.9rem">Tente outro termo ou explore as categorias acima.</p>
            </div>`;
    if (loadBtn) loadBtn.style.display = 'none';
    bindGridEvents();
    return;
  }

  grid.innerHTML = slice.map((p, i) => cardHTML(p, i)).join('');
  if (loadBtn) loadBtn.style.display = visible < filtered.length ? 'inline-flex' : 'none';

  bindGridEvents();

  if ('IntersectionObserver' in window) {
    const cards = grid.querySelectorAll('.product-card.entering');
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('entered'); o.unobserve(e.target); }
      });
    }, { rootMargin: '60px', threshold: 0.05 });
    cards.forEach(c => obs.observe(c));
  } else {
    grid.querySelectorAll('.product-card.entering').forEach(c => c.classList.add('entered'));
  }
}

/* ── Init ── */
export function initLoja() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCat = chip.dataset.cat;
      visible = BATCH;
      renderProducts();
      document.getElementById('loja')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const sortSel = document.getElementById('sort-select');
  if (sortSel) sortSel.addEventListener('change', e => { currentSort = e.target.value; renderProducts(); });

  if (loadBtn) loadBtn.addEventListener('click', () => { visible += BATCH; renderProducts(); });

  initSearch();
  renderProducts();
}