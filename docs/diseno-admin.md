# Diseño administrativo de Mesa & Fuego

El diseño está aplicado. Conserva la paleta del restaurante y usa una composición de trabajo: fondo claro, superficies blancas, sidebar verde bosque, tipografía Manrope y cifras tabulares. La portada de cliente mantiene su identidad editorial.

## Archivos y orden de carga

1. Bootstrap: `/assets/bootstrap/css/bootstrap.min.css`.
2. Sistema compartido y cliente: `public/styles.css`.
3. Administración: `public/admin.css`, **después** de los anteriores.

El enlace a `admin.css` ya está colocado en `public/index.html`. No necesitas copiar el CSS ni hacer cambios manuales. Los iconos SVG están en `public/assets/icons/` y las fuentes permanecen en `public/assets/fonts/`.

La hoja administrativa completa es `public/admin.css`. Utiliza las variables de identidad compartidas de `styles.css`; ambas hojas deben conservarse. El proyecto es Node.js y no necesita cambios PHP.

## Cambios mínimos de HTML realizados

- Añadir el enlace a la hoja administrativa después de `styles.css`.
- Dos checkboxes de presentación, sin `name`, para activar el modo compacto y abrir el drawer. No participan en formularios ni se envían a la API.
- Etiquetas asociadas para abrir/cerrar el drawer, su fondo y el modo compacto. Usan controles nativos, sin JavaScript adicional.
- Clase `topbar-leading`, breadcrumb visual y avatar decorativo junto al nombre y rol existentes.
- Menú nativo `<details>` con atajos reales al contenido y a la navegación.

Los IDs y `name` existentes se conservaron. Los IDs nuevos son `admin-sidebar-compact` y `admin-mobile-menu`. El contenido sigue generándose con el mismo `public/app.js`.

## Componentes estilizados

| Componente | Resultado |
| --- | --- |
| Sidebar | Verde bosque, iconos SVG, hover suave y selección con barra dorada |
| Modo compacto | Botón superior; las etiquetas se despliegan al pasar el cursor o enfocar la navegación |
| Tablet | Sidebar compacta de 82 px; expansión temporal de etiquetas |
| Móvil | Drawer con botón de cierre y fondo que también permite cerrarlo |
| Topbar | Superficie blanca, breadcrumb, avatar, nombre, rol, cierre de sesión y dropdown de atajos |
| KPI | Tarjetas blancas, iconos con acentos, cifras tabulares; 4/2/1 columnas en escritorio/tablet/móvil |
| Tablas | Encabezado salvia claro, filas blancas, separadores suaves y acciones pequeñas |
| Estados | Verde, dorado, terracota y gris, con texto además del color |
| Menú | Tarjetas compactas de operación y filtros con acciones existentes |
| Mesas, pedidos y cocina | Cards de trabajo, botones coherentes y subtotales legibles |
| Formularios | Fondo blanco, borde beige, foco salvia y grid de usuario en dos columnas en escritorio |
| Modales | Superficie blanca, cabecera limpia, radios discretos y foco visible |
| Alertas | Paleta sobria para éxito, advertencias y errores |
| Dropdown | Atajos funcionales con `<details>` y estilos para dropdowns Bootstrap futuros |
| Paginación | Estilos preparados; no se añadió paginación funcional a la API |
| Reportes y gráficos | Contenedores, leyendas, filtros y barras de exportación preparados como clases reutilizables |
| Impresión | Se ocultan navegación y controles y se mantienen las tablas de datos |

Las clases `.admin-search`, `.admin-notification`, `.admin-report-filters`, `.admin-export-toolbar`, `.admin-chart-panel`, `.admin-chart-viewport`, `.admin-chart-legend` y `.admin-kpi-change` preparan el lenguaje visual de esos futuros componentes. No se mostraron controles sin función ni métricas sin datos.

## Variables CSS

Paleta compartida: `--forest`, `--olive`, `--sage`, `--sage-light`, `--ivory`, `--cream`, `--beige`, `--terracotta`, `--terracotta-light`, `--gold`, `--gold-light`, `--charcoal`, `--gray`, `--wood`.

Superficies administrativas: `--white`, `--admin-canvas`, `--admin-line`, `--admin-soft`, `--admin-gold-text`, `--admin-danger-text`.

Layout y detalles: `--admin-sidebar-width`, `--admin-radius`, `--admin-shadow`, junto con `--radius-sm`, `--radius-md`, `--radius-lg`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--transition` y `--font-body`.

Gráficos: `--chart-forest`, `--chart-sage`, `--chart-terracotta`, `--chart-gold`, `--chart-beige`. Las leyendas pueden usar `--legend-color`.

## Aplicación por rol y compatibilidad

`admin.css` utiliza `@scope` y `:has()` para aplicar el diseño solo cuando una cuenta autenticada tiene más de un módulo de navegación. Esto incluye administración, gerencia, meseros, cocina y caja. Las cuentas limitadas al menú conservan la presentación de cliente. **Esto es una decisión visual, no un mecanismo de autorización**: los permisos siguen verificándose en la API.

Utiliza una versión moderna de Edge, Chrome, Firefox o Safari con soporte de `@scope` y `:has()`. En un navegador sin `@scope`, se conserva el diseño compartido anterior como respaldo. La comprobación se realizó en Edge.

## Qué se conservó y qué sigue pendiente

Se mantuvieron intactos el JavaScript funcional, consultas SQL, sesiones, permisos, validaciones, rutas y CRUD. Se compararon las huellas de los archivos funcionales antes y después.

Los accesos existentes siguen siendo Vista general, Menú, Mesas, Pedidos, Cocina, Equipo y Actividad según el rol. Reservaciones, categorías administrables, inventario, promociones, facturación, reportes y configuración todavía requieren su implementación.

El dashboard muestra los datos actuales: consumo, pedidos, mesas ocupadas y órdenes en cocina. El consumo sigue siendo subtotal de pedidos, **no ventas cobradas**. No se inventaron reservas, ingresos mensuales, clientes, variaciones porcentuales ni series históricas. Chart.js no estaba instalado y no se agregó una librería sin gráficos respaldados por datos.

El buscador y las notificaciones funcionales quedan pendientes; se prepararon sus estilos. Los atajos existentes sí funcionan. El rediseño no modifica la conexión con SQL Server ni resuelve credenciales pendientes.

## Verificación visual

Revisión en navegador con el JavaScript real y respuestas de API simuladas, sin lecturas ni escrituras a SQL Server:

- Los siete módulos en 1440, 1280, 1024, 768, 390 y 320 píxeles.
- Menú compacto, expansión por foco y drawer con cierre.
- Dropdown de atajos.
- Modales de producto y usuario en escritorio y móvil, y cierre con Escape.
- Roles administrador, gerente, mesero, cocinero, cajero y cliente.
- Portada de cliente y pantalla de acceso conservadas.
- Recursos locales y ausencia de errores de navegador o desbordamiento horizontal de la página.

Las tablas grandes de usuarios pueden desplazarse horizontalmente dentro de su contenedor en móvil. La página completa no presenta desplazamiento horizontal.

Las capturas y el registro están en `docs/previews/admin/`. Contienen datos de prueba. La revisión de interfaz no sustituye una prueba de conexión y operaciones con SQL Server.

Para verlo con tu servidor iniciado, ingresa con una cuenta de administrador en `http://localhost:3000` y pulsa **Ctrl + F5**.
