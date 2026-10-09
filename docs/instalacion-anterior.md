# Mesa & Fuego — Sistema de restaurante

Primera entrega del proyecto solicitado: JavaScript, Node.js, SQL Server, Bootstrap y CSS. El nombre visual **Mesa & Fuego** es provisional y se puede cambiar.

## Funciones creadas

- Inicio y cierre de sesión con contraseñas protegidas con scrypt y sal aleatoria.
- Sesiones persistentes en SQL Server; verificación del usuario activo y del rol en cada solicitud.
- Panel con pedidos de hoy, consumo registrado, mesas y órdenes en cocina. **Consumo no significa venta cobrada**: esta entrega no registra pagos, impuestos ni facturas.
- Consulta del menú por categoría; creación y edición de productos; precio, descripción, disponibilidad y preparación.
- Ocho mesas iniciales con capacidad, zona y estado.
- Creación de pedidos con cantidades y observaciones; modificación mientras están abiertos.
- Flujo: abierto → pendiente → preparando → listo → entregado.
- Vista de cocina y actualización automática cada 15 segundos.
- Creación y activación/desactivación de usuarios por el administrador.
- Bitácora de cambios de productos, pedidos, mesas y usuarios.
- Operaciones de pedidos transaccionales: los precios se consultan en la base de datos y una misma mesa no se puede ocupar dos veces simultáneamente.

## Requisitos

1. Node.js 22.9 o posterior.
2. npm o pnpm.
3. SQL Server con la instancia `CYNTHIA\MSSQLSERVERSA` disponible.
4. Una base de datos llamada `Restaurante`.
5. Un usuario de autenticación SQL con acceso a esa base. La implementación actual usa usuario y contraseña de SQL Server; no usa la sesión de Windows.

En SQL Server Management Studio, abre la instancia y ejecuta una sola vez:

```sql
CREATE DATABASE Restaurante;
```

La cuenta empleada por `db:setup` debe poder crear tablas e índices e insertar los datos iniciales. Para el uso diario conviene una cuenta limitada a SELECT, INSERT, UPDATE y DELETE sobre las tablas de la aplicación.

## Configuración y arranque

Se incluye `.env.example`. El archivo local `.env` contiene la instancia facilitada; completa los valores pendientes. No compartas ese archivo ni tus contraseñas.

```dotenv
DB_SERVER=CYNTHIA
DB_INSTANCE=MSSQLSERVERSA
DB_DATABASE=Restaurante
DB_USER=TU_USUARIO_SQL
DB_PASSWORD=TU_CONTRASENA_SQL
ADMIN_EMAIL=admin@restaurante.local
ADMIN_PASSWORD=TU_CONTRASENA_ADMIN_DE_AL_MENOS_12_CARACTERES
```

`SESSION_SECRET` debe contener un secreto aleatorio de al menos 32 caracteres. El archivo local generado ya incluye uno. El ejemplo contiene un marcador que debe reemplazarse.

```powershell
npm install
npm run db:setup
npm run dev
```

También puedes usar `pnpm install`, `pnpm db:setup` y `pnpm dev`. Se incluye el archivo de bloqueo de pnpm si la instalación se completa.

Abre **http://localhost:3000** e ingresa con el correo y la contraseña definidos en `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

`db:setup` crea las tablas si no existen, carga productos y mesas de ejemplo y crea al administrador. Si su correo ya existe, conserva su contraseña. No elimina datos. No es un sistema de migraciones para modificar tablas existentes en futuras entregas.

### Instancias con nombre

La configuración separa `CYNTHIA` como servidor y `MSSQLSERVERSA` como instancia. También admite `DB_SERVER=CYNTHIA\MSSQLSERVERSA` sin `DB_INSTANCE`. Para localizar la instancia por nombre se necesita SQL Server Browser y TCP/IP habilitados. Si prefieres un puerto fijo, elimina `DB_INSTANCE`, utiliza `DB_SERVER=CYNTHIA` y define `DB_PORT` con el puerto real de la instancia.

En la revisión inicial de este equipo, el servicio `MSSQL$MSSQLSERVERSA` estaba activo, **TCP/IP estaba deshabilitado y SQL Server Browser estaba detenido**. Antes de iniciar, habilita TCP/IP para esta instancia en SQL Server Configuration Manager y reinicia la instancia en un momento apropiado. Para conexión por nombre, inicia también SQL Server Browser; como alternativa, configura un puerto TCP fijo. Estos servicios y protocolos no fueron modificados automáticamente.

Los valores locales `DB_ENCRYPT=true` y `DB_TRUST_CERTIFICATE=true` permiten conectarse con un certificado local. En un despliegue con certificado válido, utiliza `DB_TRUST_CERTIFICATE=false`.

El servidor escucha únicamente en `127.0.0.1` para desarrollo local. Para producción se requiere configurar HTTPS, cookies seguras y el proxy antes de exponerlo. No se ha desplegado públicamente.

## Prueba del flujo principal

1. Inicia sesión como administrador y crea un usuario mesero y otro cocinero en **Equipo**.
2. En **Mesas**, toma un pedido en una mesa disponible. Agrega productos y una observación.
3. En **Pedidos**, modifica el pedido si hace falta y envíalo a cocina.
4. En otra sesión de navegador, entra como cocinero: inicia la preparación y marca el pedido listo.
5. Como mesero o administrador, marca el pedido entregado.
6. Pasa la mesa a limpieza y luego a disponible.
7. Consulta **Actividad** para ver quién realizó los cambios.

Una mesa ocupada no se puede liberar con un pedido activo. En esta entrega, entregarlo permite pasar la mesa a limpieza, porque aún no existe caja. La siguiente etapa incorporará el cobro como condición para cerrar la cuenta.

```powershell
npm test
```

Las pruebas automáticas actuales validan cantidades, observaciones, transiciones de cocina y contraseñas. La integración con SQL Server y el flujo en navegador necesitan la conexión configurada; no deben considerarse verificados hasta realizar la prueba anterior.

## Roles disponibles

| Rol | Funciones en esta entrega |
| --- | --- |
| Administrador | Panel, menú, mesas, pedidos, cocina, equipo y bitácora |
| Gerente | Panel, menú, mesas, pedidos y cocina |
| Mesero | Menú, mesas, creación/modificación/envío y entrega de pedidos |
| Cocinero | Menú y preparación de pedidos |
| Cajero | Consulta del menú, mesas y pedidos; sin cobros todavía |
| Inventario, repartidor, cliente | Consulta del menú; sus módulos siguen pendientes |

## Estructura

```text
database/       Tablas y datos iniciales de SQL Server
public/         Pantallas en JavaScript, Bootstrap y CSS
scripts/        Preparación de base de datos y administrador
src/            API, permisos, sesiones, validaciones y conexión
test/           Pruebas de reglas del sistema
docs/           Seguimiento de las historias de usuario
```

Consulta `docs/alcance.md` para conocer el estado de las 100 historias. La entrega actual es una base inicial y no representa las 100 historias terminadas.

## Diseño de la interfaz

Se aplicó un sistema visual natural y editorial con marfil, verdes y detalles dorados, tipografías locales y una imagen ambiental. El acceso y los paneles conservan sus funciones. La presentación completa del restaurante se muestra al ingresar con una cuenta de cliente. Consulta `docs/diseno.md` para ver los cambios de HTML, la hoja de estilo completa, las capturas y los límites de la revisión visual.

La parte administrativa tiene su hoja `public/admin.css`, con sidebar verde bosque, modo compacto, drawer móvil y superficies blancas orientadas a datos. Consulta `docs/diseno-admin.md` para conocer los componentes, variables, cambios mínimos de HTML y comprobaciones. Se carga después de la hoja compartida y no cambia JavaScript, SQL ni permisos.

## Página pública y fotos de comidas

La página principal se abre sin iniciar sesión y usa el menú real de SQL Server. Las cuentas de cliente ven Inicio, Menú, Nuestro restaurante y Contacto con el mismo diseño.

En Administración → Menú → Editar producto puedes seleccionar, reemplazar o quitar una foto JPG, PNG o WebP (máximo 5 MB), revisar la vista previa y guardar.

El servidor añade automáticamente `Products.ImageUrl` al reiniciar si el campo no existe. Si la cuenta SQL no tiene permiso para añadir columnas, ejecutar `database/product-images.sql` una vez en la base Restaurante. Conservar y respaldar `public/uploads/products/`, donde se guardan las fotos. Más detalles en `docs/pagina-cliente-imagenes.md`.
