export function productImage(product) {
  if (/^\/uploads\/products\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(product.imageUrl || '')) return product.imageUrl;
  if (/^\/assets\/images\/customer-(entradas|platos|bebidas|postres)\.svg$/.test(product.imageUrl || '')) return product.imageUrl;
  if (product.imageUrl == null) {
    const defaults = { 'casado de pollo':'platos',patacones:'entradas','limonada natural':'bebidas','tres leches':'postres' };
    const image = defaults[product.name?.trim().toLocaleLowerCase('es')];
    if (image) return `/assets/images/customer-${image}.svg`;
  }
  return null;
}
export function categoryImage(name = '') {
  const normalized = name.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const key = /bebida|refresco|jugo/.test(normalized) ? 'bebidas' : /postre|dulce/.test(normalized) ? 'postres' : /entrada|aperitivo/.test(normalized) ? 'entradas' : 'platos';
  return `/assets/images/customer-${key}.svg`;
}
