/* loja.js — Products grid, filter, sort */
import { PRODUCTS, CAT_ICONS, CATEGORIES } from './products.js';
import { addItem } from './cart.js';

const BATCH = 8;
let visible = BATCH;
let currentCat = 'all';
let currentSort = 'default';

const grid = document.getElementById('products-grid');
const countEl = document.getElementById('loja-count');
const loadBtn = document.getElementById('load-more-btn');

/* ── Filter ── */
function getFiltered() {
  let list = currentCat === 'all' ? [...PRODUCTS] : PRODUCTS.filter(p => p.cat === currentCat);
  if (currentSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (currentSort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

/* ── Render card ── */
function cardHTML(p, delay = 0) {
  const icon = CAT_ICONS[p.cat] || '🛍️';
  const badgeHTML = p.badge
    ? `<span class="pcard-badge pcard-badge-${p.badge === 'hot' ? 'hot' : 'new'}">${p.badge === 'hot' ? '🔥 Destaque' : '✨ Novo'}</span>`
    : '';
  return `
    <article class="product-card entering" data-id="${p.id}" style="animation-delay:${delay}ms">
      <div class="pcard-img">
        <img
          src="${p.image}"
          alt="${p.name}"
          loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.classList.add('show')"
        />
        <div class="pcard-fallback">
          <span class="pcard-fallback-icon">${icon}</span>
          <span>${p.cat}</span>
        </div>
        <div class="pcard-badges">
          <span class="pcard-badge pcard-badge-cat">${p.cat}</span>
          ${badgeHTML}
        </div>
        <button class="pcard-wish" aria-label="Favoritar" data-id="${p.id}">
          <i class="ri-heart-line"></i>
        </button>
        <div class="pcard-quick">
          <button class="btn btn-rose btn-sm w-full add-btn" data-id="${p.id}">
            <i class="ri-shopping-bag-line"></i> Adicionar ao Carrinho
          </button>
        </div>
      </div>
      <div class="pcard-body">
        <p class="pcard-cat">${p.cat}</p>
        <h3 class="pcard-name">${p.name}</h3>
        <p class="pcard-desc">${p.desc}</p>
      </div>
      <div class="pcard-footer">
        <div>
          <span class="pcard-price-label">Preço</span>
          <span class="pcard-price">${p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <button class="add-to-cart-btn add-btn" data-id="${p.id}" aria-label="Adicionar ao carrinho">
          <i class="ri-shopping-bag-add-line"></i>
        </button>
      </div>
    </article>`;
}

/* ── Render grid ── */
export function renderProducts() {
  const filtered = getFiltered();
  const slice = filtered.slice(0, visible);

  if (countEl) countEl.innerHTML = `<strong>${filtered.length}</strong> produto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;

  grid.innerHTML = slice.map((p, i) => cardHTML(p, i * 40)).join('');

  if (loadBtn) loadBtn.style.display = visible < filtered.length ? 'inline-flex' : 'none';

  // Bind add-to-cart — com micro-interação
  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const product = PRODUCTS.find(p => p.id === id);
      if (product) {
        // Estado visual "adicionando"
        btn.classList.add('adding');
        btn.innerHTML = btn.classList.contains('add-to-cart-btn')
          ? '<i class="ri-check-line"></i>'
          : '<i class="ri-check-line"></i> Adicionado!';

        addItem(product);

        setTimeout(() => {
          btn.classList.remove('adding');
          btn.innerHTML = btn.classList.contains('add-to-cart-btn')
            ? '<i class="ri-shopping-bag-add-line"></i>'
            : '<i class="ri-shopping-bag-line"></i> Adicionar ao Carrinho';
        }, 900);
      }
    });
  });

  // Wishlist toggle
  grid.querySelectorAll('.pcard-wish').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const active = btn.classList.toggle('active');
      btn.innerHTML = active ? '<i class="ri-heart-fill"></i>' : '<i class="ri-heart-line"></i>';
    });
  });
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
  if (sortSel) {
    sortSel.addEventListener('change', e => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      visible += BATCH;
      renderProducts();
    });
  }

  renderProducts();
}