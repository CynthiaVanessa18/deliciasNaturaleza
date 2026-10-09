import { menuPage } from './menu-pagination.js';
import { icon, decorateActions } from './icons.js';
import { productImage } from './product-presentation.js';
import { photoMime, photoPreview } from './product-photo.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
const money = value => new Intl.NumberFormat('es-CR',{ style:'currency',currency:'CRC',maximumFractionDigits:2 }).format(value);
const dateTime = value => new Intl.DateTimeFormat('es-CR',{ timeZone:'America/Costa_Rica',dateStyle:'short',timeStyle:'short' }).format(new Date(value));
const labels = { abierto:'Abierto',pendiente:'Pendiente',preparando:'En preparación',listo:'Listo',entregado:'Entregado',disponible:'Disponible',ocupada:'Ocupada',limpieza:'Limpieza',reservada:'Reservada',fuera_servicio:'Fuera de servicio' };
const stateBadge = status => `<span class="badge-state state-${escape(status)}">${icon(({ disponible:'check',ocupada:'users',limpieza:'clean',reservada:'calendar',fuera_servicio:'blocked',preparando:'kitchen',listo:'check',entregado:'check' })[status] || 'clock')}${escape(labels[status] || status)}</span>`;
const service = ['administrador','gerente','mesero'], management = ['administrador','gerente'];
let user, csrf, page, category = 0, menuSearch = '', adminMenuPage = 1, products = [], tables = [], orders = [], cart = [], editingOrder = null, noticeTimeout, revision = 0, busy = false, refreshRunning = false;
const pages = [
  { id:'dashboard',name:'Inicio',icon:'◈',roles:management },
  { id:'menu',name:'Menú',icon:'▤',roles:['administrador','gerente','mesero','cocinero','cajero','inventario','repartidor','cliente'] },
  { id:'tables',name:'Mesas',icon:'▦',roles:[...service,'cajero'] },
  { id:'orders',name:'Pedidos',icon:'▣',roles:[...service,'cajero'] },
  { id:'kitchen',name:'Cocina',icon:'♨',roles:[...management,'cocinero'] },
  { id:'users',name:'Usuarios',icon:'♙',roles:['administrador'] },
  { id:'audit',name:'Actividad',icon:'◷',roles:['administrador'] }
];
async function request(path,options = {}) {
  const response = await fetch(`/api${path}`,{ ...options,headers:{ 'Content-Type':'application/json','X-CSRF-Token':csrf || '',...options.headers } });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') { user = null; showLogin(); }
    throw new Error(result.error || 'No se pudo completar la operación.');
  }
  return result;
}
function notify(message,error = false) {
  clearTimeout(noticeTimeout); $('#notice').textContent = message; $('#notice').classList.toggle('error',error); $('#notice').hidden = false;
  noticeTimeout = setTimeout(() => $('#notice').hidden = true,5000);
}
function showLogin() { revision++; $('#editor').close(); $('.skip-link').href = '#login-form'; $('#customer-view').hidden = true; $('#app-view').hidden = true; $('#login-view').hidden = false; $('#startup').hidden = true; }
function showCustomer() { revision++; $('#editor').close(); $('.skip-link').href = '#menu'; $('#customer-view').hidden = false; $('#app-view').hidden = true; $('#login-view').hidden = true; $('#startup').hidden = true; document.dispatchEvent(new CustomEvent('customer-session',{ detail:{ user } })); }
document.addEventListener('customer-login',async () => {
  if (user) {
    try { await request('/auth/logout',{method:'POST',body:'{}'}); user = null; showCustomer(); } catch (error) { notify(error.message,true); }
  } else showLogin();
});
$('#login-back-home').addEventListener('click',showCustomer);
function showApp() {
  if (pages.filter(item => item.roles.includes(user.role)).length === 1) return showCustomer();
  $('#customer-view').hidden = true;
  $('.skip-link').href = '#content';
  $('#login-view').hidden = true; $('#startup').hidden = true; $('#app-view').hidden = false;
  $('#user-name').textContent = user.name; $('#user-role').textContent = user.role;
  $('#admin-date').innerHTML = icon('calendar') + escape(new Intl.DateTimeFormat('es-CR',{ timeZone:'America/Costa_Rica',day:'numeric',month:'long',year:'numeric' }).format(new Date()));
  $('#navigation').innerHTML = pages.filter(item => item.roles.includes(user.role)).map(item => `<button class="nav-item" data-page="${item.id}"><span class="nav-icon" aria-hidden="true">${icon(item.id)}</span>${item.name}</button>`).join('');
  decorateActions($('.topbar'));
  decorateActions($('#editor'));
  loadPage(pages.find(item => item.roles.includes(user.role)).id);
}
function heading(title,subtitle,action = '') {
  return `<div class="page-heading"><div class="page-heading-copy"><span class="page-heading-icon">${icon(page)}</span><div><p class="eyebrow mb-2">TU RESTAURANTE, AL DÍA</p><h1>${title}</h1><p>${subtitle}</p></div></div>${action || `<span class="date-chip">${icon('calendar')}${escape(new Intl.DateTimeFormat('es-CR',{ timeZone:'America/Costa_Rica',day:'numeric',month:'long',year:'numeric' }).format(new Date()))}</span>`}</div>`;
}
function empty(message) { return `<div class="empty-state">${icon(page || 'leaf', 'empty-icon')}<div>${message}</div></div>`; }
function filterAdminMenu() {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const query = normalize(menuSearch);
  const cards = [...document.querySelectorAll('#content [data-menu-text]')];
  const matches = cards.filter(card => normalize(card.dataset.menuText).includes(query));
  const result = menuPage(matches, adminMenuPage);
  adminMenuPage = result.current;
  const visible = new Set(result.items);
  cards.forEach(card => { card.hidden = !visible.has(card); });
  const status = $('#admin-menu-results');
  if (status) status.textContent = result.total ? 'Mostrando ' + result.start + '–' + result.end + ' de ' + result.total + ' platos' : 'No se encontraron platos. Prueba otro nombre o categoría.';
  const paginator = $('#admin-menu-pagination');
  if (!paginator) return;
  paginator.hidden = result.count <= 1;
  const numbers = Array.from({length:result.count}, (_, index) => index + 1).filter(number => number === 1 || number === result.count || Math.abs(number - result.current) <= 1);
  paginator.innerHTML = '<button type="button" data-admin-menu-page="' + (result.current - 1) + '" ' + (result.current === 1 ? 'disabled' : '') + '>Anterior</button><div>' + numbers.map((number,index) => (index && number - numbers[index - 1] > 1 ? '<span aria-hidden="true">…</span>' : '') + '<button type="button" data-admin-menu-page="' + number + '" aria-label="Página ' + number + '" ' + (number === result.current ? 'class="active" aria-current="page"' : '') + '>' + number + '</button>').join('') + '</div><button type="button" data-admin-menu-page="' + (result.current + 1) + '" ' + (result.current === result.count ? 'disabled' : '') + '>Siguiente</button>';

}
document.addEventListener('input', event => {
  if (event.target.id !== 'admin-menu-search') return;
  menuSearch = event.target.value;
  adminMenuPage = 1;
  filterAdminMenu();
});
async function loadPage(next = page,quiet = false) {
  if (!user || !pages.find(item => item.id === next && item.roles.includes(user.role))) return;
  page = next; const current = ++revision;
  document.querySelectorAll('[data-page]').forEach(button => button.classList.toggle('active',button.dataset.page === page));
  if (!quiet) $('#content').innerHTML = '<p class="muted">Cargando…</p>';
  try {
    let html;
    if (page === 'dashboard') {
      const [data,newTables,newOrders] = await Promise.all([request('/dashboard'),request('/tables'),request('/orders')]);
      if (current !== revision) return; tables = newTables; orders = newOrders;
      html = heading('Inicio','Un vistazo a lo que está pasando en el restaurante.')+
        `<div class="welcome-banner"><div><h2>Frescura en cada plato,<br>orden en cada servicio</h2><button class="btn admin-create-order" data-page="tables">Crear pedido <span aria-hidden="true">›</span></button></div></div>
        <div class="metric-grid">${[
          ['Pedidos del día',data.todayOrders,'Registrados hoy'],['Mesas disponibles',data.availableTables,'Listas para recibir'],['Mesas ocupadas',data.occupiedTables,'En servicio'],['Órdenes pendientes',data.pendingOrders,'En cocina'],['Consumo registrado',money(data.todayConsumption),'Subtotal de pedidos']
        ].map(([name,value,detail]) => `<div class="metric-card"><div class="metric-label">${name}</div><div class="metric-value">${value}</div><div class="metric-detail">${detail}</div></div>`).join('')}</div>
        <div class="admin-quick-actions"><button class="btn btn-primary" data-page="tables">⊕ Crear pedido</button><button class="btn admin-tables-action" data-page="tables">Ver mesas</button>${management.includes(user.role) ? '<button class="btn admin-product-action" data-action="new-product">Agregar producto</button>' : ''}<button class="btn admin-kitchen-action" data-page="kitchen">Ver cocina</button></div>
        <div class="dashboard-columns"><section class="panel"><div class="panel-header"><h3>Pedidos recientes</h3><button class="admin-panel-link" data-page="orders">Ver todos →</button></div>${orders.length ? `<div class="table-responsive"><table class="data-table"><thead><tr><th>PEDIDO</th><th>MESA</th><th>ESTADO</th><th>SUBTOTAL</th></tr></thead><tbody>${orders.slice(0,5).map(order => `<tr><td>#${order.id}</td><td>Mesa ${order.tableNumber}</td><td>${stateBadge(order.status)}</td><td>${money(order.subtotal)}</td></tr>`).join('')}</tbody></table></div>` : empty('Todavía no hay pedidos. Empieza desde Mesas.')}</section>
        <section class="panel"><div class="panel-header"><h3>Estado de las mesas</h3><button class="admin-panel-link" data-page="tables">Ver mesas →</button></div><div class="mini-tables">${tables.map(table => `<div class="mini-table ${table.status === 'disponible' ? 'available' : table.status === 'ocupada' ? 'occupied' : ''}"><strong>Mesa ${table.number}</strong>${escape(labels[table.status])}</div>`).join('')}</div><p class="section-note">Las mesas se ocupan automáticamente al crear un pedido.</p></section></div>
        ${orders.some(order => order.status === 'listo') ? `<div class="admin-ready-notice"><span>Pedido #${orders.find(order => order.status === 'listo').id} listo para servir</span><button class="btn btn-primary" data-page="orders">Ver pedidos →</button></div>` : ''}
        <div class="admin-food-gallery"><article><img src="/assets/images/admin-casado.svg" alt="Casado de pollo con arroz, frijoles y vegetales" loading="lazy"><div><h3>Casado de pollo</h3><p>Sabor natural de nuestra tierra</p></div></article><article><img src="/assets/images/admin-limonada.svg" alt="Limonada fresca con hierbabuena" loading="lazy"><div><h3>Limonada natural</h3><p>Refrescante, como la naturaleza</p></div></article><article><img src="/assets/images/admin-patacones.svg" alt="Patacones dorados" loading="lazy"><div><h3>Patacones</h3><p>En buena compañía</p></div></article></div>`;
    } else if (page === 'menu') {
      const [newProducts,categories] = await Promise.all([request('/products'),request('/categories')]);
      if (current !== revision) return; products = newProducts;
      html = heading('Nuestro menú','Los sabores de la casa, organizados para tu equipo.',management.includes(user.role) ? '<button class="btn btn-primary" data-action="new-product">+ Agregar producto</button>' : '')+
        `<label class="admin-menu-search" for="admin-menu-search"><span>Buscar en el menú</span><div>${icon('search')}<input id="admin-menu-search" type="search" placeholder="Nombre, ingrediente o categoría…" maxlength="120" value="${escape(menuSearch)}"></div></label><p id="admin-menu-results" class="muted" role="status" aria-live="polite"></p><div class="filters"><button class="filter ${category === 0 ? 'active' : ''}" data-category="0">Todo el menú</button>${categories.map(item => `<button class="filter ${category === item.id ? 'active' : ''}" data-category="${item.id}">${escape(item.name)}</button>`).join('')}</div><div class="product-grid">${products.filter(product => !category || product.categoryId === category).map(product => `<article data-menu-text="${escape(`${product.name} ${product.description} ${product.category}`)}" class="product-card ${product.available ? '' : 'unavailable'}">${productImage(product) ? `<img class="admin-product-photo" src="${escape(productImage(product))}" alt="${escape(product.name)}" loading="lazy">` : `<div class="product-symbol" aria-hidden="true">${icon(product.category === 'Bebidas' ? 'drink' : product.category === 'Postres' ? 'dessert' : 'menu')}</div>`}<p class="category mb-2">${escape(product.category)} · ${product.available ? 'Disponible' : 'Agotado'}</p><h3>${escape(product.name)}</h3><p>${escape(product.description)}</p><div class="product-bottom"><span class="price">${money(product.price)}</span><span class="minutes">${product.minutes} min</span></div>${management.includes(user.role) ? `<button class="btn btn-light w-100 mt-3" data-action="edit-product" data-id="${product.id}">Editar producto</button>` : ''}</article>`).join('') || empty('No hay productos en esta categoría.')}</div><nav id="admin-menu-pagination" class="admin-menu-pagination" aria-label="Páginas del menú" hidden></nav>`;
    } else if (page === 'tables') {
      const newTables = await request('/tables'); if (current !== revision) return; tables = newTables;
      html = heading('Mesas','Cada mesa, en el momento correcto.')+`<div class="table-grid">${tables.map(table => `<article class="table-card"><div class="table-card-icon" aria-hidden="true">${icon('tables')}</div>${stateBadge(table.status)}<div class="table-number">Mesa ${table.number}</div><p class="table-meta">${escape(table.zone)} · ${table.capacity} personas</p>${service.includes(user.role) ? (table.status === 'disponible' ? `<button class="btn btn-primary" data-action="new-order" data-id="${table.id}">Tomar pedido</button><button class="btn btn-light" data-action="table-status" data-id="${table.id}" data-status="fuera_servicio">Fuera de servicio</button>` : table.status === 'ocupada' ? `<button class="btn btn-light" data-action="table-status" data-id="${table.id}" data-status="limpieza">Pasar a limpieza</button>` : `<button class="btn btn-light" data-action="table-status" data-id="${table.id}" data-status="disponible">Marcar disponible</button>`) : ''}</article>`).join('')}</div><p class="section-note">Una mesa solo puede liberarse cuando su pedido esté entregado. El cobro se incorporará en el módulo de caja.</p>`;
    } else if (['orders','kitchen'].includes(page)) {
      const newOrders = await request('/orders'); if (current !== revision) return; orders = newOrders;
      const selected = page === 'kitchen' ? orders.filter(order => ['pendiente','preparando','listo'].includes(order.status)) : orders;
      html = heading(page === 'kitchen' ? 'En cocina' : 'Pedidos',page === 'kitchen' ? 'Cada orden, sus detalles y el siguiente paso.' : 'Del primer plato a la última entrega.','<button class="btn btn-light" data-action="refresh">↻ Actualizar</button>')+
        `<p class="refresh-note">Actualización automática cada 15 segundos.</p><div class="order-grid">${selected.map(order => {
          const transitions = { abierto:['pendiente','Enviar a cocina'],pendiente:['preparando','Iniciar preparación'],preparando:['listo','Marcar listo'],listo:['entregado','Entregar pedido'] };
          const action = transitions[order.status];
          const allowed = action && (['pendiente','entregado'].includes(action[0]) ? service.includes(user.role) : [...management,'cocinero'].includes(user.role));
          return `<article class="order-card"><div class="order-head"><div><h3>Pedido #${order.id}</h3><small>Mesa ${order.tableNumber} · ${escape(order.waiter)}</small></div>${stateBadge(order.status)}</div><p class="small muted">${dateTime(order.sentAt || order.createdAt)}</p><ul class="order-items">${order.items.map(item => `<li><strong>${item.quantity}×</strong> ${escape(item.name)}${item.notes ? `<small>${escape(item.notes)}</small>` : ''}</li>`).join('')}</ul><div class="order-total"><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div>${allowed ? `<button class="btn btn-primary" data-action="order-status" data-id="${order.id}" data-status="${action[0]}">${action[1]}</button>` : ''}${order.status === 'abierto' && service.includes(user.role) ? `<button class="btn btn-light" data-action="edit-order" data-id="${order.id}">Modificar pedido</button>` : ''}</article>`;
        }).join('') || empty(page === 'kitchen' ? 'No hay órdenes pendientes en cocina.' : 'Todavía no hay pedidos. Selecciona una mesa para comenzar.')}</div>`;
    } else if (page === 'users') {
      const users = await request('/users'); if (current !== revision) return;
      html = heading('Usuarios','Accesos individuales para cada responsabilidad.','<button class="btn btn-primary" data-action="new-user">+ Crear usuario</button>')+
        `<section class="panel table-responsive"><table class="data-table"><thead><tr><th>NOMBRE</th><th>CORREO</th><th>ROL</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead><tbody>${users.map(item => `<tr><td>${escape(item.name)}</td><td>${escape(item.email)}</td><td>${escape(item.role)}</td><td>${item.active ? 'Activo' : 'Inactivo'}</td><td>${item.id !== user.id ? `<button class="btn btn-light btn-sm" data-action="user-active" data-id="${item.id}" data-active="${!item.active}">${item.active ? 'Desactivar' : 'Activar'}</button>` : 'Tu cuenta'}</td></tr>`).join('')}</tbody></table></section><p class="section-note">Esta primera entrega incluye funciones para administración, gerencia, meseros y cocina. Los demás roles tienen acceso al menú mientras se desarrollan sus módulos.</p>`;
    } else if (page === 'audit') {
      const entries = await request('/audit'); if (current !== revision) return;
      html = heading('Actividad','Los últimos 100 cambios realizados por tu equipo.')+`<section class="panel table-responsive"><table class="data-table"><thead><tr><th>FECHA</th><th>PERSONA</th><th>ACCIÓN</th><th>REGISTRO</th></tr></thead><tbody>${entries.map(item => `<tr><td>${dateTime(item.createdAt)}</td><td>${escape(item.userName)}</td><td>${escape(item.action)}</td><td>${escape(item.entity)} #${item.entityId}</td></tr>`).join('')}</tbody></table>${entries.length ? '' : empty('Todavía no hay actividad registrada.')}</section>`;
    }
    if (current === revision) {
      $('#content').innerHTML = html;
      decorateActions($('#content'));
      if (page === 'menu') filterAdminMenu();
      $('#content').querySelectorAll('.panel-header h3').forEach(title => title.insertAdjacentHTML('afterbegin', icon(title.textContent.includes('mesa') ? 'tables' : 'orders')));
      $('#content').querySelectorAll('.mini-table').forEach(table => table.insertAdjacentHTML('afterbegin', icon('tables')));
      $('#content').querySelectorAll('.admin-ready-notice > span').forEach(message => message.insertAdjacentHTML('afterbegin', icon('bell')));
    }
  } catch (error) { if (current === revision) { if (!quiet) { $('#content').innerHTML = empty(`${escape(error.message)} <button class="btn btn-light ms-2" data-action="refresh">Reintentar</button>`); decorateActions($('#content')); } else notify(error.message,true); } }
}
function openEditor(title,html) { $('#editor-title').innerHTML = icon(title.includes('producto') ? 'product' : title.includes('integrante') ? 'users' : 'orders') + escape(title); $('#editor-body').innerHTML = html; decorateActions($('#editor')); $('#editor').showModal(); }
function formError(error) { const element = $('#editor .dialog-error'); if (element) element.textContent = error.message; else notify(error.message,true); }
async function openOrder(tableId,order = null) {
  products = await request('/products'); editingOrder = order;
  cart = order ? order.items.map(item => ({ productId:item.productId,quantity:item.quantity,notes:item.notes })) : [];
  openEditor(order ? `Modificar pedido #${order.id}` : `Pedido · Mesa ${tables.find(table => table.id === tableId)?.number || tableId}`,
    `<form id="order-form" data-table="${tableId}"><label for="cart-product" class="form-label">Agregar producto</label><div class="d-flex gap-2"><select id="cart-product" class="form-select">${products.filter(product => product.available).map(product => `<option value="${product.id}">${escape(product.name)} · ${money(product.price)}</option>`).join('')}</select><button type="button" class="btn btn-light" data-action="cart-add">Agregar</button></div><div id="cart-items"></div><div class="cart-summary"><span>Subtotal estimado</span><span id="cart-total"></span></div><p class="small muted">El precio y la disponibilidad se verifican al guardar.</p><button type="submit" class="btn btn-primary w-100">${order ? 'Guardar cambios' : 'Crear pedido'}</button><p class="dialog-error" role="alert"></p></form>`);
  renderCart();
}
function renderCart() {
  $('#cart-items').innerHTML = cart.map((item,index) => `<div class="item-row"><div class="small align-self-center">${escape(products.find(product => product.id === item.productId)?.name || 'Producto no disponible')}</div><input class="form-control" type="number" min="1" max="1000000" value="${item.quantity}" data-cart-quantity="${index}" aria-label="Cantidad"><button type="button" class="btn btn-light" data-action="cart-remove" data-index="${index}" aria-label="Eliminar producto">×</button><textarea class="form-control" maxlength="300" data-cart-notes="${index}" placeholder="Observaciones: sin cebolla, término medio…" aria-label="Observaciones">${escape(item.notes)}</textarea></div>`).join('') || '<p class="cart-empty">Agrega los productos que solicitó la mesa.</p>';
  updateCartTotal();
  decorateActions($('#cart-items'));
}
function updateCartTotal() { $('#cart-total').textContent = money(cart.reduce((sum,item) => sum + (products.find(product => product.id === item.productId)?.price || 0)*item.quantity,0)); }
async function openProduct(id) {
  const categories = await request('/categories'), product = products.find(item => item.id === id);
  openEditor(product ? 'Editar producto' : 'Agregar producto',`<form id="product-form" data-id="${id || ''}"><div class="mb-3"><label class="form-label" for="product-name">Nombre</label><input id="product-name" class="form-control" name="name" maxlength="120" value="${escape(product?.name)}" required></div><div class="mb-3"><label class="form-label" for="product-description">Descripción</label><textarea id="product-description" class="form-control" name="description" maxlength="500" required>${escape(product?.description)}</textarea></div><div class="row g-3"><div class="col-sm-6"><label class="form-label" for="product-category">Categoría</label><select id="product-category" name="categoryId" class="form-select">${categories.map(item => `<option value="${item.id}" ${product?.categoryId === item.id ? 'selected' : ''}>${escape(item.name)}</option>`).join('')}</select></div><div class="col-sm-6"><label class="form-label" for="product-price">Precio (₡)</label><input id="product-price" class="form-control" name="price" type="number" min="0.01" max="1000000" step="0.01" value="${product?.price || ''}" required></div><div class="col-sm-6"><label class="form-label" for="product-minutes">Preparación (minutos)</label><input id="product-minutes" class="form-control" name="minutes" type="number" min="1" max="240" value="${product?.minutes || 15}" required></div><div class="col-sm-6"><label class="form-label" for="product-available">Disponibilidad</label><select id="product-available" class="form-select" name="available"><option value="true">Disponible</option><option value="false" ${product && !product.available ? 'selected' : ''}>Agotado</option></select></div></div><button class="btn btn-primary w-100 mt-4" type="submit">Guardar producto</button><p class="dialog-error" role="alert"></p></form>`);
  const imageUrl = productImage(product || {});
  $('#product-form').insertAdjacentHTML('afterbegin',`<div class="product-image-editor"><label for="product-photo">Imagen de la comida</label><input type="hidden" name="imageUrl" id="product-image-url" value="${escape(imageUrl || '')}"><img id="product-photo-preview" class="product-image-preview" alt="Vista previa de la comida" ${imageUrl ? `src="${escape(imageUrl)}"` : 'hidden'}><input class="form-control" type="file" id="product-photo" accept="image/jpeg,image/png,image/webp"><p>Elige una foto JPG, PNG o WebP de máximo 5 MB. Se mostrará en el menú del cliente.</p><button type="button" class="btn btn-light" id="product-photo-remove" ${imageUrl ? '' : 'hidden'}>${icon('close')} Quitar imagen</button><p id="product-photo-error" class="text-danger" role="alert"></p></div>`);
}
let productPreviewRevision = 0;
function clearProductPreview() { productPreviewRevision++; }
$('#editor').addEventListener('close',clearProductPreview);
document.addEventListener('change',async event => {
  if (event.target.id !== 'product-photo') return;
  const file = event.target.files[0];
  $('#product-photo-error').textContent = '';
  if (!file) return;
  if (!photoMime(file) || file.size > 5*1024*1024) { event.target.value = ''; $('#product-photo-error').textContent = 'Usa una imagen JPG, PNG o WebP de máximo 5 MB.'; return; }
  clearProductPreview(); const currentPreview = productPreviewRevision;
  const preview = $('#product-photo-preview');
  try {
    const source = await photoPreview(file);
    if (currentPreview !== productPreviewRevision || !preview.isConnected) return;
    preview.src = source;
    await preview.decode();
    if (currentPreview !== productPreviewRevision) return;
    preview.hidden = false; $('#product-photo-remove').hidden = false;
  } catch {
    if (currentPreview !== productPreviewRevision || !preview.isConnected) return;
    event.target.value = ''; const previous = $('#product-image-url').value;
    if (previous) { preview.src = previous; preview.hidden = false; } else { preview.removeAttribute('src'); preview.hidden = true; }
    $('#product-photo-error').textContent = 'No se pudo abrir esta imagen. Selecciona otra foto.';
  }
});
document.addEventListener('click',event => {
  if (!event.target.closest('#product-photo-remove')) return;
  clearProductPreview(); $('#product-photo').value = ''; $('#product-image-url').value = ''; $('#product-photo-preview').hidden = true; $('#product-photo-preview').removeAttribute('src'); $('#product-photo-remove').hidden = true; $('#product-photo-error').textContent = '';
});
function openUser() {
  openEditor('Nuevo integrante',`<form id="user-form"><label for="new-name" class="form-label">Nombre</label><input class="form-control mb-3" id="new-name" name="name" maxlength="120" required><label for="new-email" class="form-label">Correo</label><input class="form-control mb-3" id="new-email" name="email" type="email" maxlength="254" required><label for="new-password" class="form-label">Contraseña inicial (mínimo 12 caracteres)</label><input class="form-control mb-3" id="new-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="200" required><label for="new-role" class="form-label">Rol</label><select id="new-role" class="form-select mb-4" name="role">${['mesero','cocinero','gerente','cajero','inventario','repartidor','cliente','administrador'].map(role => `<option value="${role}">${role}</option>`).join('')}</select><button class="btn btn-primary w-100" type="submit">Crear usuario</button><p class="dialog-error" role="alert"></p></form>`);
}
$('#login-form').addEventListener('submit',async event => {
  event.preventDefault(); const button = event.target.querySelector('button[type="submit"]'); button.disabled = true; $('#login-error').textContent = '';
  try { const session = await request('/auth/me'); csrf = session.csrf; const data = Object.fromEntries(new FormData(event.target)); const login = await request('/auth/login',{ method:'POST',body:JSON.stringify(data) }); csrf = login.csrf; user = (await request('/auth/me')).user; event.target.reset(); showApp(); }
  catch (error) { $('#login-error').textContent = error.message; } finally { button.disabled = false; }
});
$('#logout').addEventListener('click',async () => {
  try { await request('/auth/logout',{ method:'POST',body:'{}' }); user = null; showCustomer(); } catch (error) { notify(error.message,true); }
});
$('#close-editor').addEventListener('click',() => { if (!busy) $('#editor').close(); });
$('#editor').addEventListener('cancel',event => { if (busy) event.preventDefault(); });
document.addEventListener('click',async event => {
  const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.dataset.page) return loadPage(button.dataset.page);
  if (button.dataset.adminMenuPage) { adminMenuPage = Number(button.dataset.adminMenuPage); filterAdminMenu(); $('#admin-menu-search').scrollIntoView({behavior:'smooth',block:'start'}); return; }
  if (button.dataset.category) { adminMenuPage = 1; category = Number(button.dataset.category); return loadPage('menu'); }
  const action = button.dataset.action, id = Number(button.dataset.id); if (!action) return;
  button.disabled = true;
  try {
    if (action === 'refresh') await loadPage();
    if (action === 'new-product' || action === 'edit-product') await openProduct(id);
    if (action === 'new-user') openUser();
    if (action === 'new-order') await openOrder(id);
    if (action === 'edit-order') { const order = orders.find(item => item.id === id); await openOrder(order.tableId,order); }
    if (action === 'cart-add') {
      const productId = Number($('#cart-product').value); if (!productId) throw new Error('No hay productos disponibles.');
      if (cart.length >= 50) throw new Error('Máximo 50 líneas por pedido.');
      cart.push({ productId,quantity:1,notes:'' }); renderCart();
    }
    if (action === 'cart-remove') { cart.splice(Number(button.dataset.index),1); renderCart(); }
    if (action === 'order-status') { await request(`/orders/${id}/status`,{ method:'PATCH',body:JSON.stringify({ status:button.dataset.status }) }); notify('Pedido actualizado.'); await loadPage(); }
    if (action === 'table-status') { await request(`/tables/${id}/status`,{ method:'PATCH',body:JSON.stringify({ status:button.dataset.status }) }); notify('Mesa actualizada.'); await loadPage(); }
    if (action === 'user-active') { await request(`/users/${id}/active`,{ method:'PATCH',body:JSON.stringify({ active:button.dataset.active === 'true' }) }); notify('Acceso actualizado.'); await loadPage(); }
  } catch (error) { notify(error.message,true); } finally { button.disabled = false; }
});
document.addEventListener('input',event => {
  if (event.target.dataset.cartQuantity !== undefined) { cart[Number(event.target.dataset.cartQuantity)].quantity = Number(event.target.value); updateCartTotal(); }
  if (event.target.dataset.cartNotes !== undefined) cart[Number(event.target.dataset.cartNotes)].notes = event.target.value;
});
$('#editor').addEventListener('submit',async event => {
  event.preventDefault(); if (busy) return; busy = true;
  const form = event.target, button = form.querySelector('[type=submit]'); button.disabled = true;
  try {
    if (form.id === 'order-form') {
      if (!cart.length) throw new Error('Agrega al menos un producto.');
      await request(editingOrder ? `/orders/${editingOrder.id}/items` : '/orders',{ method:editingOrder ? 'PUT' : 'POST',body:JSON.stringify({ tableId:Number(form.dataset.table),items:cart }) });
    } else if (form.id === 'product-form') {
      const file = $('#product-photo').files[0];
      if (file) {
        const mime = photoMime(file);
        if (!mime || file.size > 5*1024*1024) throw new Error('Usa una imagen JPG, PNG o WebP de máximo 5 MB.');
        const response = await fetch('/api/product-images',{method:'POST',headers:{'Content-Type':mime,'X-CSRF-Token':csrf},body:file});
        const uploaded = await response.json();
        if (!response.ok) throw new Error(uploaded.error || 'No se pudo subir la imagen.');
        $('#product-image-url').value = uploaded.imageUrl; $('#product-photo').value = '';
      }
      const data = Object.fromEntries(new FormData(form)); data.categoryId = Number(data.categoryId); data.price = Number(data.price); data.minutes = Number(data.minutes); data.available = data.available === 'true';
      await request(form.dataset.id ? `/products/${form.dataset.id}` : '/products',{ method:form.dataset.id ? 'PUT' : 'POST',body:JSON.stringify(data) });
      document.dispatchEvent(new Event('products-updated'));
    } else if (form.id === 'user-form') await request('/users',{ method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form))) });
    $('#editor').close(); notify('Guardado correctamente.'); await loadPage();
  } catch (error) { formError(error); } finally { busy = false; button.disabled = false; }
});
setInterval(async () => {
  if (!user || refreshRunning || busy || document.hidden || $('#editor').open || !['orders','kitchen','dashboard'].includes(page)) return;
  refreshRunning = true; try { await loadPage(page,true); } finally { refreshRunning = false; }
},15000);
try { const data = await request('/auth/me'); user = data.user; csrf = data.csrf; if (user) showApp(); else if (location.hash === '#login') showLogin(); else showCustomer(); }
catch { showCustomer(); }


