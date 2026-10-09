import { icon } from './icons.js';
import { productImage, categoryImage } from './product-presentation.js';
import { menuPage } from './menu-pagination.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC'}).format(value);
let products = [], categories = [], selected = 0, menuLoaded = false, loading = false, currentPage = 1;
const dialog = $('#customer-product-dialog');
$('#customer-search-icon').innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg>';
$('#customer-product-close').innerHTML = icon('close');
function imageMarkup(product, className = '') {
  const image = productImage(product);
  return image ? `<img class="${className}" src="${escape(image)}" alt="${escape(product.name)}" loading="lazy">` : `<div class="customer-no-photo ${className}">${icon('menu')}<span>Imagen próximamente</span></div>`;
}
function renderProducts() {
  const search = $('#customer-search').value.trim().toLocaleLowerCase('es');
  const matches = products.filter(p => (!selected || p.categoryId === selected) && `${p.name} ${p.description} ${p.category}`.toLocaleLowerCase('es').includes(search));
  const result = menuPage(matches,currentPage); currentPage = result.current;
  $('#customer-products').innerHTML = result.items.map(p => `<article class="customer-product"><button type="button" class="customer-product-photo" data-customer-product="${p.id}" aria-label="Ver foto y detalles de ${escape(p.name)}">${imageMarkup(p)}<span class="customer-availability ${p.available ? '' : 'is-unavailable'}"><span aria-hidden="true">●</span> ${p.available ? 'Disponible' : 'Agotado'}</span><span class="customer-photo-expand" aria-hidden="true">${icon('plus')}</span></button><div class="customer-product-copy"><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p><div class="customer-product-bottom"><strong>${money(p.price)}</strong><button class="customer-button" data-customer-product="${p.id}">Ver plato ${icon('arrow')}</button></div></div></article>`).join('');
  $('#customer-menu-status').textContent = matches.length ? `Mostrando ${result.start}–${result.end} de ${result.total} ${result.total === 1 ? 'plato' : 'platos'} · Página ${result.current} de ${result.count}` : menuLoaded ? 'No hay platos para esta búsqueda.' : 'El menú estará disponible cuando se conecte el restaurante.';
  const paginator = $('#customer-pagination'); paginator.hidden = result.count <= 1;
  const pageNumbers = Array.from({length:result.count},(_,index) => index+1).filter(number => number === 1 || number === result.count || Math.abs(number-currentPage) <= 1);
  paginator.innerHTML = `<button type="button" class="customer-pagination-prev" data-menu-page="${currentPage-1}" ${currentPage === 1 ? 'disabled' : ''}>${icon('arrow','pagination-back')} Anterior</button><div class="customer-pagination-pages">${pageNumbers.map((number,index) => `${index && number-pageNumbers[index-1] > 1 ? '<span aria-hidden="true">…</span>' : ''}<button type="button" data-menu-page="${number}" aria-label="Página ${number}" ${number === currentPage ? 'class="active" aria-current="page"' : ''}>${number}</button>`).join('')}</div><button type="button" class="customer-pagination-next" data-menu-page="${currentPage+1}" ${currentPage === result.count ? 'disabled' : ''}>Siguiente ${icon('arrow')}</button>`;
  $('#customer-filters').querySelectorAll('button').forEach(button => { const active = Number(button.dataset.customerCategory) === selected; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
}
function renderCategories() {
  $('#customer-categories').innerHTML = categories.map(c => `<button class="customer-category" data-customer-category="${c.id}"><img src="${categoryImage(c.name)}" alt="" loading="lazy"><span>${escape(c.name)} ${icon('arrow')}</span></button>`).join('');
  $('#customer-filters').innerHTML = `<button data-customer-category="0" class="active" aria-pressed="true">Todos los platos</button>` + categories.map(c => `<button data-customer-category="${c.id}" aria-pressed="false">${escape(c.name)}</button>`).join('');
}
async function loadMenu() {
  if (loading) return;
  loading = true;
  try {
    const results = await Promise.all(['/api/products','/api/categories'].map(async path => { const response = await fetch(path); if (!response.ok) throw new Error('No se pudo cargar el menú.'); return response.json(); }));
    [products,categories] = results;
    const featured = ['casado de pollo','patacones','tres leches','limonada natural'];
    products.sort((a,b) => { const rank = p => { const index = featured.indexOf(p.name.toLocaleLowerCase('es')); return index < 0 ? 20 : index; }; return rank(a)-rank(b); });
    categories.sort((a,b) => { const rank = c => ({entradas:0,platos:1,bebidas:2,postres:3})[categoryImage(c.name).match(/customer-(\w+)/)[1]]; return rank(a)-rank(b); });
    menuLoaded = true; renderCategories(); renderProducts();
  } catch {
    $('#customer-menu-status').innerHTML = 'No se pudo cargar el menú. <button class="customer-retry" id="customer-menu-retry">Intentar de nuevo</button>';
  } finally { loading = false; }
}
document.addEventListener('click', event => {
  const categoryButton = event.target.closest('[data-customer-category]');
  if (categoryButton) { selected = Number(categoryButton.dataset.customerCategory); currentPage = 1; renderProducts(); if (categoryButton.closest('#customer-categories')) location.hash = 'menu'; }
  const pageButton = event.target.closest('[data-menu-page]');
  if (pageButton && !pageButton.disabled) { currentPage = Number(pageButton.dataset.menuPage); renderProducts(); $('#customer-menu-title').focus({preventScroll:true}); $('#menu').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth'}); }
  const productButton = event.target.closest('[data-customer-product]');
  if (productButton) {
    const product = products.find(p => p.id === Number(productButton.dataset.customerProduct));
    if (!product) return;
    $('#customer-product-detail').innerHTML = `${imageMarkup(product,'customer-detail-photo')}<div class="customer-detail-copy"><p class="customer-eyebrow">${escape(product.category)}</p><h2 id="customer-detail-title">${escape(product.name)}</h2><div class="customer-detail-meta"><strong>${money(product.price)}</strong><span class="customer-detail-availability ${product.available ? '' : 'is-unavailable'}">${icon(product.available ? 'check' : 'blocked')}${product.available ? 'Disponible' : 'Agotado'}</span></div><h3>Ingredientes y descripción</h3><p class="customer-detail-description">${escape(product.description)}</p><p class="customer-detail-time">${icon('clock')} ${product.minutes} min de preparación</p></div>`;
    dialog.setAttribute('aria-labelledby','customer-detail-title'); dialog.showModal();
  }
  if (event.target.closest('#customer-menu-retry')) loadMenu();
});
$('#customer-product-close').addEventListener('click',() => dialog.close());
$('#customer-search').addEventListener('input',() => { currentPage = 1; renderProducts(); });
$('#customer-login').addEventListener('click',() => document.dispatchEvent(new Event('customer-login')));
document.addEventListener('customer-session',event => { $('#customer-login').textContent = event.detail?.user ? 'Cerrar sesión' : 'Iniciar sesión'; if (!$('#customer-view').hidden) loadMenu(); });
document.addEventListener('products-updated',() => loadMenu());
function updateNavigation() { const active = location.hash.slice(1) || 'inicio'; document.querySelectorAll('[data-customer-nav]').forEach(link => { const matches = link.dataset.customerNav === active; link.classList.toggle('active',matches); if (matches) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); }); }
window.addEventListener('hashchange',updateNavigation); updateNavigation(); loadMenu();
