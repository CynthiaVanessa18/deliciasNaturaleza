# Rediseño natural y editorial

El rediseño está aplicado en `public/styles.css` y `public/index.html`. Bootstrap se conserva. La hoja de estilo está completa y puede consultarse o reutilizarse directamente.

## Código conservado

No se modificaron `public/app.js`, la API, las rutas, SQL Server, las validaciones ni los permisos. Se conservaron todos los IDs originales y los `name` del formulario de acceso. Los controles dinámicos siguen generándose desde el mismo JavaScript.

La aplicación actual es Node.js, no PHP. No hace falta modificar archivos PHP.

## Sistema visual

- Paleta solicitada: bosque, oliva, salvia, marfil, beige, terracota y dorado.
- Fondos principalmente claros; verde en acciones, imagen principal y pie.
- Cormorant Garamond para títulos y Manrope para interfaz, servidas localmente en WOFF2.
- Dorado usado como detalle. El texto pequeño dorado se oscurece para mejorar el contraste en fondos claros.
- Variables para colores, fuentes, sombras, radios y transiciones.
- Interacciones de 280–350 ms y alternativa sin movimiento con `prefers-reduced-motion`.
- Foco visible, enlace para saltar al contenido, etiquetas originales y navegación nativa por teclado.
- Diálogos, filtros, estados, mesas, pedidos, tablas y avisos con la misma identidad.

## Cambios mínimos de HTML ya aplicados

1. Metadatos de color/descripcion y precarga de dos fuentes locales.
2. Enlace «Saltar al contenido».
3. Textos editoriales en el panel de acceso; se conserva exactamente el formulario.
4. `#navigation` se envuelve en un `<details open>` con `<summary>`: permite plegar/desplegar el menú móvil sin cambiar JavaScript.
5. Enlaces a Inicio, Menú y Experiencia, una sección hero y una sección de experiencia, todos con destinos existentes en el mismo documento.
6. Footer con marca y enlaces reales. No se inventaron horarios, direcciones ni cuentas sociales.

El hero y la sección editorial se muestran para cuentas cuyo único módulo disponible es el menú (cliente y los roles todavía limitados al menú). Las cuentas de administración, gerencia, servicio y cocina conservan su estructura de operación. La diferenciación visual utiliza `:has()` sobre la navegación que ya genera la aplicación; no concede permisos.

## Ver el resultado

Con el servidor iniciado, abre `http://localhost:3000` y pulsa **Ctrl + F5**. El acceso ya tiene la identidad nueva.

Para ver la presentación completa del cliente, desde una cuenta de administrador crea una cuenta de rol **cliente** en Equipo, cierra sesión e ingresa con esa cuenta. Administradores y personal mantienen los paneles operativos rediseñados.

## Funcionalidades que no existían antes

Reservaciones, promociones, carrito de cliente, checkout, favoritos, perfil y contacto todavía no tienen implementación funcional. No se añadieron botones que prometan esas operaciones. Se mantiene la planificación en `docs/alcance.md`.

Los productos actuales no tienen campo de fotografía en SQL Server ni renderizado de `<img>` en JavaScript. Las tarjetas conservan su icono, con una composición de cerámica y hojas. La clase reutilizable `.product-image` contiene el tratamiento de fotografías y el zoom de 1.04, para incorporarla al implementar las imágenes reales. No se asignaron fotografías arbitrarias a platos ni se cambió el modelo de datos.

## Recursos visuales

- `public/assets/images/restaurant-nature.webp`: imagen ambiental generada, optimizada para la web.
- `public/assets/images/restaurant-nature.png`: fuente de la imagen.
- `public/assets/fonts/`: cuatro fuentes WOFF2 y sus licencias.
- `docs/previews/`: capturas de acceso, menú de cliente, administración y formulario.

La imagen representa un concepto visual, no una fotografía de un establecimiento real. Las fuentes e imagen no requieren solicitudes a Google Fonts ni otros servidores externos. Es compatible con la política de seguridad existente de Helmet.

## Verificación realizada

Se ejecutó el JavaScript original en Edge con respuestas API simuladas, sin conexión ni escrituras a SQL Server. La revisión tuvo **26 comprobaciones** e incluyó:

- Acceso y menú en 1440, 1024, 768, 390 y 320 píxeles.
- Carga de fuentes y recursos locales.
- Ausencia de desbordamiento horizontal de la página.
- Apertura y cierre de navegación móvil.
- Filtro de bebidas.
- Panel, menú y cocina de administrador en escritorio y móvil.
- Apertura de edición de producto y cierre con Escape.
- Formulario de pedido, incorporación de producto y cambio de cantidad.
- Ausencia de errores de navegador y respuestas HTTP de recursos fallidas.

Las capturas contienen datos de prueba, no datos de producción. Esta revisión verifica la interfaz; no sustituye las pruebas de autenticación ni de transacciones con SQL Server.

El registro de comprobaciones está en `docs/previews/check-results.json`. Se compararon las huellas de los archivos funcionales antes y después para confirmar que no cambiaron.

## Prompt de la imagen

Generada con la herramienta integrada de imagegen, usando el siguiente prompt:

> Use case: photorealistic-natural. Asset type: restaurant website hero and atmospheric editorial photograph. Create a high-end architectural editorial photograph of an elegant contemporary boutique restaurant surrounded by nature in Costa Rica. Warm ivory limewash and pale natural stone, oak wood tables, understated brass details, artisanal cream ceramic place settings, refined forest green upholstery, a few carefully placed indoor plants and an indoor garden, tall windows opening to tropical vegetation, soft late afternoon natural light and warm pendant lighting. Sophisticated but welcoming, luminous rather than dark, restrained natural greenery not a jungle. Wide landscape 16:9 composition, real tactile material details, professionally photographed, subtle quiet luxury, no people, no lettering, no logos or watermarks. Darker natural foliage near left edge to support an eventual website overlay, bright beautiful dining architecture on right. This is an illustrative brand ambiance, not a photograph of an actual business.
