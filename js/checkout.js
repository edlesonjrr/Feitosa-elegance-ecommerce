/* checkout.js — Multi-step Order Flow */
import { getCart, getTotal, fmt, clearCart } from './cart.js';
import { showToast } from './ui.js';

const WPP = '5581983207224';
const CARD_SURCHARGE = 0.05; // 5%
const INSTALLMENT_RATES = [0, 0, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07];

let state = {
  step: 1,
  payment: 'pix',
  delivery: 'pickup',
  installments: 1,
  customer: {},
  address: {},
};

const backdrop = document.getElementById('checkout-backdrop');
const modal = document.getElementById('checkout-modal');

export function openCheckout() {
  if (!getCart().length) return;
  state = { step: 1, payment: 'pix', delivery: 'pickup', installments: 1, customer: {}, address: {} };
  renderModal();
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}
export function closeCheckout() {
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

function getOrderTotal() {
  const base = getTotal();
  if (state.payment === 'credit') {
    const rate = INSTALLMENT_RATES[state.installments] || 0;
    return base * (1 + rate);
  }
  return base;
}

function getDeliveryFee() {
  return state.delivery === 'delivery' ? (getTotal() < 200 ? 15 : 0) : 0;
}

/* ── Render ── */
function renderModal() {
  modal.innerHTML = `
    <!-- Handle -->
    <div class="modal-handle"></div>

    <!-- Header -->
    <div class="modal-header">
      <h3>${state.step === 4 ? 'Resumo do Pedido' : 'Finalizar Pedido'}</h3>
      ${state.step > 1 && state.step < 4
      ? `<button class="modal-back" id="co-back"><i class="ri-arrow-left-s-line"></i> Voltar</button>`
      : `<button class="cart-close-btn" id="co-close" aria-label="Fechar">
            <i class="ri-close-line" style="font-size:1.2rem"></i></button>`
    }
    </div>

    <!-- Steps -->
    <div class="checkout-steps">
      ${[
      ['ri-shopping-bag-2-line', 'Carrinho'],
      ['ri-bank-card-line', 'Pagamento'],
      ['ri-map-pin-2-line', 'Entrega'],
      ['ri-whatsapp-line', 'Confirmar'],
    ].map(([icon, label], i) => {
      const n = i + 1;
      const cls = n < state.step ? 'done' : n === state.step ? 'active' : '';
      return `<div class="step-tab ${cls}"><i class="${icon}"></i>${label}</div>`;
    }).join('')}
    </div>

    <!-- Body -->
    <div class="modal-body" id="co-body">
      ${renderStep()}
    </div>

    <!-- Footer -->
    <div class="modal-footer" id="co-footer">
      ${renderFooter()}
    </div>
  `;

  bindEvents();
}

function renderStep() {
  switch (state.step) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    case 4: return renderStep4();
  }
  return '';
}

function renderStep1() {
  const cart = getCart();
  const sub = getTotal();
  return `
    <div class="step-panel active">
      <div>
        <p class="order-summary-title"><i class="ri-list-check"></i> Itens do pedido</p>
        <div class="order-summary-items">
          ${cart.map(item => `
            <div class="osi">
              <div class="osi-img">
                <img src="${item.image}" alt="${item.name}" loading="lazy"
                  onerror="this.style.display='none';this.parentElement.textContent='🛍️'"/>
              </div>
              <div class="osi-info">
                <p class="osi-name">${item.name}</p>
                <p class="osi-qty-price">${item.qty}x ${fmt(item.price)}</p>
              </div>
              <span class="osi-total">${fmt(item.price * item.qty)}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="order-totals">
        <div class="order-total-row">
          <span>Subtotal (${cart.reduce((s, i) => s + i.qty, 0)} itens)</span>
          <span>${fmt(sub)}</span>
        </div>
        ${sub >= 200 ? `<div class="order-total-row"><span>Frete</span><span class="discount">Grátis 🎉</span></div>` : ''}
        <div class="order-total-row total">
          <span>Total estimado</span>
          <span>${fmt(sub)}</span>
        </div>
      </div>
    </div>`;
}

function renderStep2() {
  return `
    <div class="step-panel active">
      <div>
        <p class="order-summary-title"><i class="ri-bank-card-line"></i> Forma de Pagamento</p>
        <div class="payment-options">
          ${[
      { val: 'pix', icon: '🏦', name: 'PIX', desc: 'Pagamento instantâneo', badge: '5% OFF', badgeCls: '' },
      { val: 'cash', icon: '💵', name: 'Dinheiro', desc: 'Pague na retirada/entrega', badge: null, badgeCls: '' },
      { val: 'debit', icon: '💳', name: 'Cartão de Débito', desc: 'Aprovação imediata', badge: null, badgeCls: '' },
      { val: 'credit', icon: '💎', name: 'Cartão de Crédito', desc: 'Em até 7x', badge: '+5%', badgeCls: 'warn' },
    ].map(opt => `
            <button class="payment-option ${state.payment === opt.val ? 'selected' : ''}" data-pay="${opt.val}">
              <div class="payment-option-radio"></div>
              <div class="payment-option-icon">${opt.icon}</div>
              <div class="payment-option-info">
                <p class="payment-option-name">${opt.name}</p>
                <p class="payment-option-desc">${opt.desc}</p>
              </div>
              ${opt.badge ? `<span class="payment-option-badge ${opt.badgeCls}">${opt.badge}</span>` : ''}
            </button>`).join('')}
        </div>
      </div>

      <!-- Installments (only for credit) -->
      <div class="installments-wrap ${state.payment === 'credit' ? 'show' : ''}" id="installments-wrap">
        <label for="installments-sel">Parcelamento</label>
        <select class="installments-select" id="installments-sel">
          ${generateInstallmentOptions()}
        </select>
        <p class="surcharge-note"><i class="ri-alert-line"></i> Parcelamento acima de 2x tem acréscimo.</p>
      </div>

      <!-- PIX discount note -->
      <div class="cart-note" id="pay-note">
        ${payNote()}
      </div>
    </div>`;
}

function generateInstallmentOptions() {
  const base = getTotal();
  return [1, 2, 3, 4, 5, 6, 7].map(n => {
    const rate = INSTALLMENT_RATES[n] || 0;
    const total = base * (1 + rate);
    const perInstall = total / n;
    const label = n === 1
      ? `À vista — ${fmt(total)}`
      : `${n}x de ${fmt(perInstall)}${rate > 0 ? ` (total: ${fmt(total)})` : ' sem juros'}`;
    return `<option value="${n}" ${state.installments === n ? 'selected' : ''}>${label}</option>`;
  }).join('');
}

function payNote() {
  switch (state.payment) {
    case 'pix': return `💚 <b>PIX:</b> Você ganha <b>5% de desconto</b> no pagamento instantâneo!`;
    case 'credit': return `
          <div class='card-security-notice'>
            <div class='csn-header'>
              <i class='ri-shield-check-fill csn-shield'></i>
              <strong>Pagamento Seguro via WhatsApp</strong>
            </div>
            <p>Para sua segurança, pagamentos no cartão são realizados via <b>link seguro</b> enviado pelo WhatsApp após a finalização do pedido. Nenhum dado do cartão é inserido neste site.</p>
            <span class='csn-badge'><i class='ri-lock-2-fill'></i> 100% Seguro &amp; Protegido</span>
          </div>
          ⚠️ <b>Cartão de Crédito:</b> Acréscimo de <b>5%</b> no valor total parcelado acima de 2x.`;
    case 'debit': return `
          <div class='card-security-notice'>
            <div class='csn-header'>
              <i class='ri-shield-check-fill csn-shield'></i>
              <strong>Pagamento Seguro via WhatsApp</strong>
            </div>
            <p>Para sua segurança, pagamentos no cartão são realizados via <b>link seguro</b> enviado pelo WhatsApp após a finalização do pedido. Nenhum dado do cartão é inserido neste site.</p>
            <span class='csn-badge'><i class='ri-lock-2-fill'></i> 100% Seguro &amp; Protegido</span>
          </div>
          💳 <b>Débito:</b> Aprovação imediata e sem acréscimos.`;
    case 'cash': return `💵 <b>Dinheiro:</b> Pague no ato da retirada ou entrega.`;
    default: return '';
  }
}

function renderStep3() {
  return `
    <div class="step-panel active">
      <!-- Delivery type -->
      <div>
        <p class="order-summary-title"><i class="ri-map-pin-2-line"></i> Tipo de Entrega</p>
        <div class="delivery-options">
          <button class="delivery-option ${state.delivery === 'pickup' ? 'selected' : ''}" data-del="pickup">
            <div class="delivery-option-radio"></div>
            <div class="delivery-option-icon">🏪</div>
            <div>
              <p class="delivery-option-name">Retirada na Loja</p>
              <p class="delivery-option-desc">Grátis · Av. Exemplo, 100 – Recife/PE</p>
            </div>
          </button>
          <button class="delivery-option ${state.delivery === 'delivery' ? 'selected' : ''}" data-del="delivery">
            <div class="delivery-option-radio"></div>
            <div class="delivery-option-icon">🚚</div>
            <div>
              <p class="delivery-option-name">Entrega em Domicílio</p>
              <p class="delivery-option-desc">${getTotal() >= 200 ? 'Frete Grátis' : 'R$ 15,00 · Prazo: 2–5 dias úteis'}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Customer info -->
      <div class="customer-form">
        <p class="form-section-title"><i class="ri-user-line"></i> Seus Dados</p>
        <div class="form-group">
          <label>Nome Completo <span class="required">*</span></label>
          <input class="form-input" id="f-name" type="text" placeholder="Seu nome completo"
            value="${state.customer.name || ''}" autocomplete="name"/>
        </div>
        <div class="form-group">
          <label>WhatsApp <span class="required">*</span></label>
          <input class="form-input" id="f-phone" type="tel" placeholder="(81) 99999-9999"
            value="${state.customer.phone || ''}" autocomplete="tel"/>
        </div>
      </div>

      <!-- Address form -->
      <div class="address-form ${state.delivery === 'delivery' ? 'show' : ''}" id="address-form">
        <p class="form-section-title"><i class="ri-home-4-line"></i> Endereço de Entrega</p>
        <div class="form-row">
          <div class="form-group">
            <label>CEP <span class="required">*</span></label>
            <div class="cep-wrap">
              <input class="form-input" id="f-cep" type="text" placeholder="00000-000"
                value="${state.address.cep || ''}" maxlength="9" autocomplete="postal-code"/>
              <div class="cep-spinner" id="cep-spinner"></div>
            </div>
          </div>
          <div class="form-group">
            <label>UF</label>
            <input class="form-input" id="f-uf" type="text" placeholder="PE"
              value="${state.address.uf || ''}" maxlength="2"/>
          </div>
        </div>
        <div class="form-group form-group-full">
          <label>Rua / Logradouro <span class="required">*</span></label>
          <input class="form-input" id="f-street" type="text" placeholder="Rua das Flores"
            value="${state.address.street || ''}"/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Número <span class="required">*</span></label>
            <input class="form-input" id="f-number" type="text" placeholder="123"
              value="${state.address.number || ''}"/>
          </div>
          <div class="form-group">
            <label>Complemento</label>
            <input class="form-input" id="f-comp" type="text" placeholder="Apto, Bloco…"
              value="${state.address.complement || ''}"/>
          </div>
        </div>
        <div class="form-group">
          <label>Bairro <span class="required">*</span></label>
          <input class="form-input" id="f-neighborhood" type="text" placeholder="Centro"
            value="${state.address.neighborhood || ''}"/>
        </div>
        <div class="form-group">
          <label>Cidade <span class="required">*</span></label>
          <input class="form-input" id="f-city" type="text" placeholder="Recife"
            value="${state.address.city || ''}"/>
        </div>
      </div>
    </div>`;
}

function renderStep4() {
  const cart = getCart();
  const sub = getTotal();
  const delivFee = getDeliveryFee();
  const cardRate = state.payment === 'credit' ? (INSTALLMENT_RATES[state.installments] || 0) : 0;
  const cardSurcharge = sub * cardRate;
  const pixDiscount = state.payment === 'pix' ? sub * 0.05 : 0;
  const finalTotal = sub + delivFee + cardSurcharge - pixDiscount;

  const deliveryLabel = state.delivery === 'pickup'
    ? '🏪 Retirada na Loja'
    : `🚚 Entrega — ${state.address.street}, ${state.address.number}${state.address.complement ? ', ' + state.address.complement : ''} — ${state.address.neighborhood}, ${state.address.city} — CEP ${state.address.cep}`;

  const payLabel = {
    pix: '💚 PIX (5% desconto)',
    cash: '💵 Dinheiro',
    debit: '💳 Cartão de Débito',
    credit: `💎 Cartão de Crédito — ${state.installments}x`,
  }[state.payment];

  return `
    <div class="step-panel active">
      <div class="order-summary-items">
        ${cart.map(i => `
          <div class="osi">
            <div class="osi-img">
              <img src="${i.image}" alt="${i.name}" loading="lazy"
                onerror="this.style.display='none';this.parentElement.textContent='🛍️'"/>
            </div>
            <div class="osi-info">
              <p class="osi-name">${i.name}</p>
              <p class="osi-qty-price">${i.qty}x ${fmt(i.price)}</p>
            </div>
            <span class="osi-total">${fmt(i.price * i.qty)}</span>
          </div>`).join('')}
      </div>

      <div class="order-totals">
        <div class="order-total-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
        ${delivFee > 0 ? `<div class="order-total-row"><span>Frete</span><span>${fmt(delivFee)}</span></div>` : ''}
        ${delivFee === 0 && state.delivery === 'delivery' ? `<div class="order-total-row"><span>Frete</span><span class="discount">Grátis 🎉</span></div>` : ''}
        ${cardSurcharge > 0 ? `<div class="order-total-row"><span>Acréscimo cartão (${(cardRate * 100).toFixed(0)}%)</span><span class="surcharge">+${fmt(cardSurcharge)}</span></div>` : ''}
        ${pixDiscount > 0 ? `<div class="order-total-row"><span>Desconto PIX (5%)</span><span class="discount">−${fmt(pixDiscount)}</span></div>` : ''}
        <div class="order-total-row total"><span>TOTAL</span><span>${fmt(finalTotal)}</span></div>
      </div>

      <div class="cart-note">
        <b>Entrega:</b> ${deliveryLabel}<br>
        <b>Pagamento:</b> ${payLabel}<br>
        <b>Cliente:</b> ${state.customer.name} · ${state.customer.phone}
      </div>

      <div class="confirm-step">
        <div class="confirm-icon">📱</div>
        <h4>Tudo certo!</h4>
        <p>Clique abaixo para abrir o WhatsApp com os dados do seu pedido preenchidos automaticamente.</p>
        <div class="confirm-msg-preview" id="wpp-preview">${buildWppMessage(finalTotal, deliveryLabel, payLabel)}</div>
      </div>
    </div>`;
}

function buildWppMessage(total, delivery, pay) {
  const cart = getCart();
  const lines = cart.map(i => `• ${i.name} (x${i.qty}) — ${fmt(i.price * i.qty)}`).join('\n');
  return `Olá, Feitosa Elegance! 🛍️

Gostaria de fazer um pedido:

*ITENS:*
${lines}

*TOTAL: ${fmt(total)}*
*Pagamento:* ${pay}
*Entrega:* ${delivery}
*Nome:* ${state.customer.name || '–'}
*WhatsApp:* ${state.customer.phone || '–'}

Aguardo confirmação! 😊`;
}

function renderFooter() {
  switch (state.step) {
    case 1: return `
      <div class="modal-nav">
        <button class="btn btn-primary btn-block" id="co-next">
          Escolher Pagamento <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>`;
    case 2: return `
      <div class="modal-nav">
        <button class="btn btn-primary btn-block" id="co-next">
          Dados de Entrega <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>`;
    case 3: return `
      <div class="modal-nav">
        <button class="btn btn-primary btn-block" id="co-next">
          Revisar Pedido <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>`;
    case 4: return `
      <div class="modal-nav">
        <button class="btn btn-wpp btn-block btn-lg" id="co-wpp">
          <i class="ri-whatsapp-line" style="font-size:1.2rem"></i>
          Enviar pelo WhatsApp
        </button>
      </div>
      <p style="text-align:center;font-size:.72rem;color:var(--ink-30);">
        Você será redirecionado para o WhatsApp
      </p>`;
  }
  return '';
}

/* ── Event binding ── */
function bindEvents() {
  modal.querySelector('#co-close')?.addEventListener('click', closeCheckout);
  modal.querySelector('#co-back')?.addEventListener('click', () => { state.step--; renderModal(); });
  modal.querySelector('#co-next')?.addEventListener('click', handleNext);
  modal.querySelector('#co-wpp')?.addEventListener('click', handleSend);

  // Payment options
  modal.querySelectorAll('.payment-option').forEach(btn => {
    btn.addEventListener('click', () => {
      state.payment = btn.dataset.pay;
      modal.querySelectorAll('.payment-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const wrap = modal.querySelector('#installments-wrap');
      if (wrap) wrap.classList.toggle('show', state.payment === 'credit');
      const note = modal.querySelector('#pay-note');
      if (note) note.innerHTML = payNote();
      // update installments select options
      const sel = modal.querySelector('#installments-sel');
      if (sel) sel.innerHTML = generateInstallmentOptions();
    });
  });

  // Installments
  modal.querySelector('#installments-sel')?.addEventListener('change', e => {
    state.installments = parseInt(e.target.value);
  });

  // Delivery options
  modal.querySelectorAll('.delivery-option').forEach(btn => {
    btn.addEventListener('click', () => {
      state.delivery = btn.dataset.del;
      modal.querySelectorAll('.delivery-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const form = modal.querySelector('#address-form');
      if (form) form.classList.toggle('show', state.delivery === 'delivery');
    });
  });

  // CEP auto-fill
  const cepInput = modal.querySelector('#f-cep');
  if (cepInput) {
    cepInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
      e.target.value = v;
      if (v.replace('-', '').length === 8) fetchCep(v.replace('-', ''));
    });
  }
}

async function fetchCep(cep) {
  const spinner = modal.querySelector('#cep-spinner');
  if (spinner) spinner.classList.add('loading');
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (!data.erro) {
      const set = (id, val) => { const el = modal.querySelector(id); if (el && val) el.value = val; };
      set('#f-street', data.logradouro);
      set('#f-neighborhood', data.bairro);
      set('#f-city', data.localidade);
      set('#f-uf', data.uf);
    }
  } catch (e) { } finally {
    if (spinner) spinner.classList.remove('loading');
  }
}

function handleNext() {
  if (state.step === 2) {
    // collect payment state (already done reactively)
  }
  if (state.step === 3) {
    // Collect customer fields
    const name = modal.querySelector('#f-name')?.value.trim();
    const phone = modal.querySelector('#f-phone')?.value.trim();
    if (!name || !phone) {
      showToast('<span class="toast-icon">⚠️</span> Preencha nome e WhatsApp!');
      return;
    }
    state.customer = { name, phone };

    if (state.delivery === 'delivery') {
      const street = modal.querySelector('#f-street')?.value.trim();
      const number = modal.querySelector('#f-number')?.value.trim();
      const neighborhood = modal.querySelector('#f-neighborhood')?.value.trim();
      const city = modal.querySelector('#f-city')?.value.trim();
      const cep = modal.querySelector('#f-cep')?.value.trim();
      if (!street || !number || !neighborhood || !city || !cep) {
        showToast('<span class="toast-icon">⚠️</span> Preencha todos os campos de endereço!');
        return;
      }
      state.address = {
        street, number,
        complement: modal.querySelector('#f-comp')?.value.trim() || '',
        neighborhood, city, cep,
        uf: modal.querySelector('#f-uf')?.value.trim() || '',
      };
    }
  }
  state.step++;
  renderModal();
  modal.querySelector('.modal-body')?.scrollTo(0, 0);
}

function handleSend() {
  const cart = getCart();
  const sub = getTotal();
  const delivFee = getDeliveryFee();
  const cardRate = state.payment === 'credit' ? (INSTALLMENT_RATES[state.installments] || 0) : 0;
  const cardSurcharge = sub * cardRate;
  const pixDiscount = state.payment === 'pix' ? sub * 0.05 : 0;
  const finalTotal = sub + delivFee + cardSurcharge - pixDiscount;

  const deliveryLabel = state.delivery === 'pickup'
    ? '🏪 Retirada na Loja'
    : `🚚 ${state.address.street}, ${state.address.number}${state.address.complement ? ', ' + state.address.complement : ''}, ${state.address.neighborhood}, ${state.address.city} - CEP ${state.address.cep}`;

  const payLabel = {
    pix: '💚 PIX (com 5% de desconto)',
    cash: '💵 Dinheiro',
    debit: '💳 Cartão de Débito',
    credit: `💎 Cartão de Crédito — ${state.installments}x`,
  }[state.payment];

  const msg = buildWppMessage(finalTotal, deliveryLabel, payLabel);
  const url = `https://wa.me/${WPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  closeCheckout();
  clearCart();
  showToast('<span class="toast-icon">🎉</span> Pedido enviado via WhatsApp!');
}

export function initCheckout() {
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeCheckout(); });
}