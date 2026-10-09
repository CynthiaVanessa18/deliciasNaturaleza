export const MENU_PAGE_SIZE = 6;
export function menuPage(items, requested = 1) {
  const total = items.length;
  const count = Math.max(1,Math.ceil(total / MENU_PAGE_SIZE));
  const current = Math.min(count,Math.max(1,Number.isInteger(requested) ? requested : 1));
  const offset = (current-1)*MENU_PAGE_SIZE;
  return { items:items.slice(offset,offset+MENU_PAGE_SIZE),current,count,total,start:total ? offset+1 : 0,end:Math.min(offset+MENU_PAGE_SIZE,total) };
}
