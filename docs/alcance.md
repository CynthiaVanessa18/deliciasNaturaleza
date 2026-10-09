# Seguimiento del alcance

Fuente: documento proporcionado por la usuaria, con 100 historias de usuario. Esta primera etapa implementa el flujo de atención en mesa; los módulos siguientes se construirán sobre la misma API y base de datos.

| Módulo | Historias | Estado en la primera entrega |
| --- | --- | --- |
| Usuarios y seguridad | HU-01–04 | Acceso por correo, cierre, roles fijos, creación y activación; pendiente usuario alternativo, identificación, teléfono, edición y permisos configurables |
| Clientes | HU-05–07 | Pendiente registro público, perfil y direcciones |
| Menú | HU-08–12 | Categorías iniciales, filtro, registro/edición de productos y agotados; pendientes CRUD de categorías y fotografías |
| Mesas | HU-13–16 | Mesas iniciales, disponibilidad, ocupación automática y liberación; pendiente CRUD de mesas y asignación sin pedido |
| Reservaciones | HU-17–21 | Pendiente |
| Pedidos en mesa | HU-22–26 | Implementados con observaciones, modificación antes de envío y subtotales |
| Cocina | HU-27–30 | Vista, preparación y orden lista; pendiente marcar platos individualmente |
| Pedidos en línea | HU-31–36 | Pendiente; el formulario actual corresponde al mesero |
| Delivery | HU-37–40 | Pendiente |
| Facturación | HU-41–46 | Pendiente; los subtotales de pedidos no son facturas |
| Inventario | HU-47–53 | Pendiente |
| Recetas | HU-54–55 | Pendiente |
| Proveedores | HU-56–57 | Pendiente |
| Compras | HU-58–60 | Pendiente |
| Empleados | HU-61–64 | Accesos de empleados; pendientes ficha laboral, puestos, turnos y asistencia |
| Promociones | HU-65–67 | Pendiente |
| Fidelización | HU-68–70 | Pendiente |
| Opiniones | HU-71–72 | Pendiente |
| Caja | HU-73–75 | Pendiente |
| Reportes | HU-76–83 | Pendiente |
| Dashboard | HU-84 | Parcial: pedidos, mesas, consumo y cocina; pendientes ventas cobradas, reservas, inventario y gráficos |
| Notificaciones | HU-85–87 | Actualización visual de pedidos cada 15 s; pendientes avisos de listo, reservas e inventario |
| Auditoría | HU-88 | Cambios actuales registrados con usuario, acción, entidad, registro y fecha UTC; pendientes motivos/detalles y módulos futuros |
| Configuración | HU-89–91 | Pendiente |
| Cancelaciones/devoluciones | HU-92–94 | Pendiente |
| Historial del cliente | HU-95–96 | Pendiente |
| Sucursales | HU-97–99 | Pendiente |
| Control de acceso | HU-100 | Restricciones en servidor y navegación por rol; funcionalidades adicionales se habilitarán al construir cada módulo |

## Orden de trabajo propuesto

1. **Primera entrega:** acceso, menú, mesas, pedidos, cocina y auditoría.
2. **Caja y facturación:** configuración de impuestos/servicio, apertura/cierre de caja, pagos, cuentas divididas, comprobantes, cancelaciones y devoluciones. Mantener cálculos monetarios en SQL Server con decimales y transacciones.
3. **Clientes y reservas:** registro, perfil, direcciones, agenda, capacidad, horarios y conflictos de reservas.
4. **Abastecimiento:** ingredientes, lotes y vencimientos, recetas, movimientos, desperdicios, proveedores y compras.
5. **Pedidos en línea y entrega:** carrito, retiro/domicilio, asignación de repartidores y seguimiento.
6. **Gestión y crecimiento:** turnos, asistencia, promociones, fidelización, opiniones, reportes, notificaciones y sucursales.

## Decisiones pendientes

- Nombre, datos empresariales y aspecto definitivo del restaurante.
- Cuenta SQL y permisos para conectar a `CYNTHIA\MSSQLSERVERSA`.
- Reglas de impuestos, servicio, descuentos y delivery antes de programar caja.
- Política de cancelación, duración de reservas y horario de atención.
- Alcance de sucursales antes de diseñar inventario, compras y caja definitivos.

La primera base trabaja con un restaurante. La estructura por sucursal se incorporará cuando se confirme esa necesidad; no está implementada actualmente.
