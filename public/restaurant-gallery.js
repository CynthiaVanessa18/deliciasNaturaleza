import { icon } from './icons.js';
const photos = [
  {src:'/assets/images/restaurant-terrace-hd.png',title:'Nuestra terraza',description:'Mesas entre jardines para compartir sin prisa.'},
  {src:'/assets/images/restaurant-nature.webp',title:'Un espacio para encontrarnos',description:'Madera, vegetación y luz natural alrededor de la mesa.'},
  {src:'/assets/images/restaurant-garden-hd.png',title:'El jardín tropical',description:'Colores y naturaleza que acompañan cada visita.'},
  {src:'/assets/images/restaurant-citrus-hd.png',title:'Frescura desde el jardín',description:'Pequeños detalles que conectan nuestra cocina con la naturaleza.'}
];
const $ = selector => document.querySelector(selector);
const gallery = $('#restaurant-gallery');
const dialog = $('#restaurant-gallery-dialog');
let current = 0;
$('#restaurant-gallery-close').innerHTML = icon('close');
document.querySelectorAll('[data-restaurant-direction]').forEach(button => button.insertAdjacentHTML('afterbegin',icon('arrow',button.dataset.restaurantDirection === '-1' ? 'pagination-back' : '')));
$('#restaurant-gallery-expand-icon').innerHTML = icon('plus');
function render() {
  const photo = photos[current];
  for (const id of ['#restaurant-gallery-image','#restaurant-gallery-large-image']) {
    const image = $(id); image.src = photo.src; image.alt = `${photo.title}. ${photo.description}`;
    image.width = 1672; image.height = 941; image.decoding = 'async';
  }
  $('#restaurant-gallery-open').setAttribute('aria-label',`Ampliar foto del restaurante: ${photo.title}`);
  $('#restaurant-gallery-title').textContent = photo.title;
  $('#restaurant-gallery-description').textContent = photo.description;
  $('#restaurant-gallery-dialog-title').textContent = photo.title;
  $('#restaurant-gallery-dialog-description').textContent = photo.description;
  for (const id of ['#restaurant-gallery-counter','#restaurant-gallery-dialog-counter']) $(id).textContent = `Foto ${current+1} de ${photos.length}`;
  $('#restaurant-gallery-dots').innerHTML = photos.map((photo,index) => `<button type="button" data-restaurant-photo="${index}" aria-label="Ver foto ${index+1}: ${photo.title}" aria-pressed="${index === current}" ${index === current ? 'class="active"' : ''}></button>`).join('');
}
function change(direction) { current = (current+direction+photos.length)%photos.length; render(); }
document.addEventListener('click',event => {
  const direction = event.target.closest('[data-restaurant-direction]');
  if (direction) change(Number(direction.dataset.restaurantDirection));
  const photo = event.target.closest('[data-restaurant-photo]');
  if (photo) { current = Number(photo.dataset.restaurantPhoto); render(); $(`[data-restaurant-photo="${current}"]`).focus({preventScroll:true}); }
});
$('#restaurant-gallery-open').addEventListener('click',() => dialog.showModal());
$('#restaurant-gallery-close').addEventListener('click',() => dialog.close());
for (const root of [gallery,dialog]) root.addEventListener('keydown',event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); change(event.key === 'ArrowLeft' ? -1 : 1); }
});
render();
