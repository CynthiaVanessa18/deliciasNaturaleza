// Una misma familia de iconos para navegación, estados y acciones.
const paths = {
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  dashboard: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',
  menu: '<path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c-3 3-3 8 0 8h3V3"/>',
  tables: '<ellipse cx="12" cy="7" rx="9" ry="4"/><path d="m5 10-2 11m16-11 2 11M8 11v10m8-10v10"/>',
  orders: '<path d="M5 3v18l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2-3-2ZM9 9h6m-6 4h6m-6 4h4"/>',
  kitchen: '<path d="M8 5a4 4 0 0 1 8 0 4 4 0 1 1 3 7v9H5v-9a4 4 0 1 1 3-7ZM5 16h14"/>',
  users: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m2-8a5 5 0 0 1 6 5v3"/>',
  audit: '<path d="M4 21V11h4v10m4 0V6h4v15m4 0V3h2v18M2 21h21"/>',
  plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8m-4-4h8"/>',
  product: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v10l9 5 9-5V8M12 13v10m-5-18 9 5"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6ZM13 21h8"/>',
  refresh: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
  clean: '<path d="m17 2-5 11m-4-2 8 4-4 7-9-4 5-7Zm0 5-2 4m6-2-2 4"/>',
  blocked: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
  drink: '<path d="m7 3 2 18h8l2-18H7Zm7 0 3-2M8 8h10"/>',
  dessert: '<path d="M3 11h18v10H3V11Zm0 5h18M7 11V8h10v3m-5-3V3m-2 0 2-2 2 2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  save: '<path d="M4 3h14l3 3v15H3V3h1Zm3 0v6h10V3M7 21v-7h10v7"/>',
  logout: '<path d="M10 3H4v18h6m-1-9h12m-5-5 5 5-5 5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h2m4 0h2m-8 4h2"/>',
  bell: '<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 4h4M12 2v2"/>',
  leaf: '<path d="M5 20C3 7 13 4 21 3c-1 9-4 16-13 14m-4 5L17 8"/>'
};
export function icon(name, className = '') {
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.leaf}</svg>`;
}
export function decorateActions(root) {
  const actionIcons = { 'new-product':'product', 'edit-product':'edit', 'new-user':'users', 'user-active':'users', 'new-order':'plus', 'edit-order':'edit', 'cart-add':'plus', 'cart-remove':'close', refresh:'refresh' };
  const statusIcons = { disponible:'check', limpieza:'clean', fuera_servicio:'blocked', pendiente:'arrow', preparando:'kitchen', listo:'check', entregado:'check' };
  root.querySelectorAll('button').forEach(button => {
    if (button.querySelector('.ui-icon')) return;
    let name = actionIcons[button.dataset.action];
    if (button.dataset.status) name = statusIcons[button.dataset.status] || 'clock';
    if (button.dataset.page) name = button.textContent.includes('Crear pedido') ? 'plus' : button.dataset.page;
    if (button.type === 'submit') name = 'save';
    if (button.id === 'close-editor') name = 'close';
    if (button.id === 'logout') name = 'logout';
    if (!name) return;
    button.childNodes.forEach(node => {
      if (node.nodeType === 3) node.textContent = node.textContent.replace(/^[\s+⊕↻]+/, '').replace(/[→›×]\s*$/, '');
      if (node.nodeType === 1 && node.getAttribute('aria-hidden') === 'true') node.remove();
    });
    button.insertAdjacentHTML('afterbegin', icon(name));
    button.classList.add('icon-button');
  });
}
