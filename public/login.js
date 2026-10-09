const passwordToggle = document.getElementById('password-toggle');
passwordToggle.addEventListener('click', () => {
  const input = document.getElementById('password');
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
  passwordToggle.setAttribute('aria-pressed', String(visible));
});

const helpDialog = document.getElementById('login-help');
document.querySelectorAll('[data-login-help]').forEach(button => {
  button.addEventListener('click', () => {
    const recovery = button.dataset.loginHelp === 'recovery';
    document.getElementById('login-help-title').textContent = recovery ? 'Recuperar acceso' : 'Crear una cuenta';
    document.getElementById('login-help-message').textContent = recovery
      ? 'Contacta al administrador del restaurante para restablecer tu contraseña.'
      : 'Solicita tu cuenta al administrador del restaurante para comenzar.';
    helpDialog.showModal();
  });
});
document.getElementById('login-help-close').addEventListener('click', () => helpDialog.close());
const restaurantInformation = {
  history: ['Nuestra Historia', 'Delicias de la Naturaleza: una buena mesa, sabores frescos y un espacio para compartir.'],
  menu: ['Menú', 'Inicia sesión para explorar el menú del restaurante.'],
  experience: ['Experiencias', 'Disfruta una experiencia entre naturaleza, cocina y encuentros alrededor de la mesa.'],
  contact: ['Contacto', 'Contacta al personal del restaurante para consultas y asistencia con tu cuenta.'],
  reserve: ['Reservar mesa', 'Contacta al personal del restaurante para consultar disponibilidad y reservar tu mesa.']
};
document.querySelectorAll('[data-login-info]').forEach(button => {
  button.addEventListener('click', () => {
    const [title, message] = restaurantInformation[button.dataset.loginInfo];
    document.getElementById('login-help-title').textContent = title;
    document.getElementById('login-help-message').textContent = message;
    helpDialog.showModal();
  });
});

// Recordar únicamente el correo; nunca guardar la contraseña.
const emailInput = document.getElementById('email');
const rememberInput = document.getElementById('login-remember');
try { emailInput.value = localStorage.getItem('restaurant-login-email') || ''; } catch {}
document.getElementById('login-form').addEventListener('submit', () => {
  try {
    if (rememberInput.checked) localStorage.setItem('restaurant-login-email', emailInput.value);
    else localStorage.removeItem('restaurant-login-email');
  } catch {}
});
rememberInput.addEventListener('change', () => {
  if (!rememberInput.checked) {
    try { localStorage.removeItem('restaurant-login-email'); } catch {}
  }
});
