# Página principal y fotos de las comidas

La dirección principal muestra el restaurante sin exigir inicio de sesión. Incluye Inicio, Menú con categorías y búsqueda, detalle del plato, Nuestro restaurante y Contacto. Las cuentas cuyo acceso es únicamente el menú utilizan esta presentación.

Los nombres, precios, descripciones, disponibilidad y categorías se consultan desde SQL Server. Los cuatro platos reconocibles de la referencia (casado de pollo, patacones, limonada natural y tres leches) tienen imágenes iniciales de esa referencia; los demás muestran un espacio para su foto hasta que se cargue una. Las fotos seleccionadas por el administrador tienen prioridad.

## Añadir o cambiar una foto

1. Iniciar sesión como administrador o gerente.
2. Abrir Menú y elegir Editar producto, o Agregar producto.
3. En Imagen de la comida, seleccionar una foto JPG, PNG o WebP de máximo 5 MB.
4. Revisar la vista previa y pulsar Guardar producto.

Quitar imagen elimina su asociación al guardar el producto. Cambiar otros campos mantiene la foto existente. La imagen aparece en el administrador, en la página pública y en el detalle del plato.

## Base de datos

Se necesita `Products.ImageUrl`, de tipo `nvarchar(300)` y nullable. El servidor comprueba si falta ese campo y lo añade al iniciar; no elimina ni recrea productos. La preparación de la base también ejecuta esa migración.

Si el usuario de conexión no tiene permiso para modificar tablas, ejecutar una sola vez `database/product-images.sql` en la base Restaurante desde SQL Server Management Studio, y reiniciar el servidor. El script comprueba si el campo existe antes de crearlo.

Las fotos subidas se conservan como archivos en `public/uploads/products/`; SQL Server guarda su ruta. Se debe incluir esa carpeta en los respaldos y conservarla al publicar o actualizar el proyecto. No se versionan las fotos de usuarios en Git. Una foto reemplazada permanece en la carpeta, aunque ya no se muestre.

Contacto incluye dirección, teléfono, correo y horarios ficticios, con una nota que identifica la página como demostración. La portada conserva una sola acción principal: Explorar el menú.

