import { Router, raw } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { imageExtension, imagePath, MAX_IMAGE_BYTES } from './product-images.js';
import { getPool, sql } from './db.js';
import { AppError, text, positiveInteger, normalizeItems, assertTransition, hashPassword, verifyPassword } from './domain.js';
export const api = Router();
const service = ['administrador','gerente','mesero'];
const management = ['administrador','gerente'];
const operations = [...service,'cocinero','cajero'];
const roles = [...operations,'inventario','repartidor','cliente'];
const uniqueRoles = [...new Set(roles)];
const idOf = req => positiveInteger(Number(req.params.id), 'Identificador');
async function audit(transaction, userId, action, entity, entityId) {
  await new sql.Request(transaction).input('user', sql.Int, userId).input('action', sql.NVarChar(100), action)
    .input('entity', sql.NVarChar(80), entity).input('id', sql.Int, entityId)
    .query('INSERT INTO AuditLog(UserId,Action,Entity,EntityId) VALUES(@user,@action,@entity,@id)');
}
async function transact(work) {
  const transaction = new sql.Transaction(await getPool());
  await transaction.begin();
  try { const value = await work(transaction); await transaction.commit(); return value; }
  catch (error) { try { await transaction.rollback(); } catch {} throw error; }
}
api.use(async (req, res, next) => {
  if (!req.session.csrf) req.session.csrf = randomBytes(32).toString('hex');
  if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers['x-csrf-token'] !== req.session.csrf) {
    return res.status(403).json({ error: 'La sesión expiró. Actualiza la página e intenta de nuevo.' });
  }
  if (req.session.userId) {
    const result = await (await getPool()).request().input('id', sql.Int, req.session.userId)
      .query('SELECT Id AS id,Name AS name,Email AS email,Role AS role FROM Users WHERE Id=@id AND Active=1');
    req.user = result.recordset[0];
    if (!req.user) { delete req.session.userId; }
  }
  next();
});
function permit(allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Tu rol no tiene permiso para esta operación.' });
    next();
  };
}
api.get('/auth/me', (req, res) => res.json({ user: req.user || null, csrf: req.session.csrf }));
api.post('/auth/login', rateLimit({ windowMs: 15*60*1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' } }), async (req, res) => {
  const email = text(req.body.email, 'Correo', 254).toLowerCase();
  const password = req.body.password;
  if (typeof password !== 'string' || !password.length || password.length > 200) throw new AppError('Contraseña inválida.');
  const result = await (await getPool()).request().input('email', sql.NVarChar(254), email)
    .query('SELECT Id,PasswordHash,Active FROM Users WHERE Email=@email');
  const user = result.recordset[0];
  // También ejecutar scrypt cuando no existe el usuario para reducir diferencias de tiempo.
  const valid = await verifyPassword(password, user?.PasswordHash || `${'0'.repeat(32)}:${'0'.repeat(128)}`);
  if (!user?.Active || !valid) throw new AppError('Correo o contraseña incorrectos.', 401);
  await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
  req.session.userId = user.Id;
  req.session.csrf = randomBytes(32).toString('hex');
  await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
  res.json({ csrf: req.session.csrf });
});
api.post('/auth/logout', (req, res, next) => req.session.destroy(error => {
  if (error) return next(error);
  res.clearCookie('restaurante.sid'); res.json({ ok: true });
}));
api.get('/categories', async (req, res) => {
  res.json((await (await getPool()).request().query('SELECT Id AS id,Name AS name FROM Categories WHERE Active=1 ORDER BY Name')).recordset);
});
api.get('/products', async (req, res) => {
  res.json((await (await getPool()).request().query(`SELECT p.Id AS id,p.Name AS name,p.Description AS description,
    p.Price AS price,p.Available AS available,p.PreparationMinutes AS minutes,p.ImageUrl AS imageUrl,c.Id AS categoryId,c.Name AS category
    FROM Products p JOIN Categories c ON c.Id=p.CategoryId WHERE c.Active=1 ORDER BY c.Name,p.Name`)).recordset);
});
function productBody(body) {
  const price = body.price;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 1000000 || Math.abs(price*100-Math.round(price*100)) > 0.00001) throw new AppError('El precio debe ser positivo y tener máximo dos decimales.');
  if (typeof body.available !== 'boolean') throw new AppError('Disponibilidad inválida.');
  const minutes = positiveInteger(body.minutes, 'Tiempo de preparación');
  if (minutes > 240) throw new AppError('El tiempo máximo es de 240 minutos.');
  return { name: text(body.name,'Nombre'), description: text(body.description,'Descripción',500),
    categoryId: positiveInteger(body.categoryId,'Categoría'), price, available: body.available, minutes, imageUrl: imagePath(body.imageUrl) };
}
async function saveProduct(req, res, update) {
  const data = productBody(req.body);
  const id = await transact(async transaction => {
    const request = new sql.Request(transaction);
    request.input('imageUrl',sql.NVarChar(300),data.imageUrl);
    request.input('imageProvided',sql.Bit,Object.hasOwn(req.body,'imageUrl'));
    for (const [name,type] of [['name',sql.NVarChar(120)],['description',sql.NVarChar(500)],['categoryId',sql.Int],['price',sql.Decimal(12,2)],['available',sql.Bit],['minutes',sql.Int]]) request.input(name,type,data[name]);
    const category = await new sql.Request(transaction).input('id',sql.Int,data.categoryId).query('SELECT Id FROM Categories WHERE Id=@id AND Active=1');
    if (!category.recordset.length) throw new AppError('Categoría no disponible.');
    if (update) request.input('id',sql.Int,idOf(req));
    const result = await request.query(update ? `UPDATE Products SET Name=@name,Description=@description,CategoryId=@categoryId,Price=@price,
      Available=@available,PreparationMinutes=@minutes,ImageUrl=CASE WHEN @imageProvided=1 THEN @imageUrl ELSE ImageUrl END,UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.Id WHERE Id=@id`
      : `INSERT INTO Products(Name,Description,CategoryId,Price,Available,PreparationMinutes,ImageUrl) OUTPUT INSERTED.Id VALUES(@name,@description,@categoryId,@price,@available,@minutes,@imageUrl)`);
    if (!result.recordset.length) throw new AppError('Producto no encontrado.',404);
    const productId = result.recordset[0].Id;
    await audit(transaction,req.user.id,update ? 'Modificar producto' : 'Crear producto','Products',productId);
    return productId;
  });
  res.status(update ? 200 : 201).json({ id });
}
api.post('/products',permit(management), (req,res) => saveProduct(req,res,false));
api.put('/products/:id',permit(management), (req,res) => saveProduct(req,res,true));
api.post('/product-images',permit(management),raw({ type:['image/png','image/jpeg','image/webp'],limit:MAX_IMAGE_BYTES }),async (req,res) => {
  const extension = imageExtension(req.body,req.get('content-type')?.split(';')[0]);
  const directory = new URL('../public/uploads/products/',import.meta.url);
  await mkdir(directory,{ recursive:true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(new URL(filename,directory),req.body,{ flag:'wx' });
  res.status(201).json({ imageUrl:`/uploads/products/${filename}` });
});
api.get('/tables',permit(operations),async (req,res) => res.json((await (await getPool()).request()
  .query('SELECT Id AS id,Number AS number,Capacity AS capacity,Zone AS zone,Status AS status FROM RestaurantTables ORDER BY Number')).recordset));
api.patch('/tables/:id/status',permit(service),async (req,res) => {
  const id = idOf(req);
  const status = req.body.status;
  if (!['disponible','limpieza','fuera_servicio'].includes(status)) throw new AppError('Estado inválido. La ocupación se registra al crear el pedido.');
  await transact(async transaction => {
    const table = await new sql.Request(transaction).input('id',sql.Int,id).query('SELECT Id FROM RestaurantTables WITH(UPDLOCK,HOLDLOCK) WHERE Id=@id');
    if (!table.recordset.length) throw new AppError('Mesa no encontrada.',404);
    const active = await new sql.Request(transaction).input('id',sql.Int,id).query("SELECT Id FROM Orders WHERE TableId=@id AND Status<>'entregado'");
    if (active.recordset.length) throw new AppError('La mesa tiene un pedido activo.',409);
    await new sql.Request(transaction).input('id',sql.Int,id).input('status',sql.VarChar(30),status)
      .query('UPDATE RestaurantTables SET Status=@status,OccupiedAt=NULL WHERE Id=@id');
    await audit(transaction,req.user.id,'Cambiar estado de mesa','RestaurantTables',id);
  }); res.json({ ok: true });
});
async function insertItems(transaction, orderId, items) {
  for (const item of items) {
    const result = await new sql.Request(transaction).input('id',sql.Int,item.productId)
      .query('SELECT p.Id,p.Name,p.Price FROM Products p WITH(HOLDLOCK) JOIN Categories c ON c.Id=p.CategoryId WHERE p.Id=@id AND p.Available=1 AND c.Active=1');
    const product = result.recordset[0];
    if (!product) throw new AppError('Uno de los productos ya no está disponible.',409);
    await new sql.Request(transaction).input('order',sql.Int,orderId).input('product',sql.Int,product.Id)
      .input('name',sql.NVarChar(120),product.Name).input('price',sql.Decimal(12,2),product.Price)
      .input('quantity',sql.Int,item.quantity).input('notes',sql.NVarChar(300),item.notes)
      .query('INSERT INTO OrderItems(OrderId,ProductId,ProductName,Quantity,UnitPrice,Notes) VALUES(@order,@product,@name,@quantity,@price,@notes)');
  }
  await new sql.Request(transaction).input('id',sql.Int,orderId).query(`UPDATE Orders SET
    Subtotal=(SELECT SUM(Quantity*UnitPrice) FROM OrderItems WHERE OrderId=@id),UpdatedAt=SYSUTCDATETIME() WHERE Id=@id`);
}
api.post('/orders',permit(service),async (req,res) => {
  const tableId = positiveInteger(req.body.tableId,'Mesa');
  const items = normalizeItems(req.body.items);
  const id = await transact(async transaction => {
    const table = (await new sql.Request(transaction).input('id',sql.Int,tableId)
      .query('SELECT Status FROM RestaurantTables WITH(UPDLOCK,HOLDLOCK) WHERE Id=@id')).recordset[0];
    if (!table) throw new AppError('Mesa no encontrada.',404);
    if (table.Status !== 'disponible') throw new AppError('La mesa ya no está disponible.',409);
    const result = await new sql.Request(transaction).input('table',sql.Int,tableId).input('user',sql.Int,req.user.id)
      .query('INSERT INTO Orders(TableId,WaiterId,Subtotal) OUTPUT INSERTED.Id VALUES(@table,@user,0)');
    const orderId = result.recordset[0].Id;
    await insertItems(transaction,orderId,items);
    await new sql.Request(transaction).input('id',sql.Int,tableId)
      .query("UPDATE RestaurantTables SET Status='ocupada',OccupiedAt=SYSUTCDATETIME() WHERE Id=@id");
    await audit(transaction,req.user.id,'Crear pedido','Orders',orderId);
    return orderId;
  }); res.status(201).json({ id });
});
api.put('/orders/:id/items',permit(service),async (req,res) => {
  const id = idOf(req), items = normalizeItems(req.body.items);
  await transact(async transaction => {
    const order = (await new sql.Request(transaction).input('id',sql.Int,id)
      .query('SELECT Status FROM Orders WITH(UPDLOCK,HOLDLOCK) WHERE Id=@id')).recordset[0];
    if (!order) throw new AppError('Pedido no encontrado.',404);
    if (order.Status !== 'abierto') throw new AppError('Solo se pueden modificar pedidos antes de enviarlos a cocina.',409);
    await new sql.Request(transaction).input('id',sql.Int,id).query('DELETE FROM OrderItems WHERE OrderId=@id');
    await insertItems(transaction,id,items);
    await audit(transaction,req.user.id,'Modificar pedido','Orders',id);
  }); res.json({ ok: true });
});
api.get('/orders',permit(operations),async (req,res) => {
  const kitchen = req.user.role === 'cocinero';
  const result = await (await getPool()).request().input('kitchen',sql.Bit,kitchen).query(`
    SELECT TOP(100) o.Id AS id,t.Number AS tableNumber,o.TableId AS tableId,u.Name AS waiter,o.Status AS status,
    o.Subtotal AS subtotal,o.CreatedAt AS createdAt,o.SentAt AS sentAt
    FROM Orders o JOIN RestaurantTables t ON t.Id=o.TableId JOIN Users u ON u.Id=o.WaiterId
    WHERE @kitchen=0 OR o.Status IN ('pendiente','preparando','listo') ORDER BY o.Id DESC;
    SELECT i.OrderId AS orderId,i.ProductId AS productId,i.ProductName AS name,i.Quantity AS quantity,i.UnitPrice AS price,i.Notes AS notes
    FROM OrderItems i WHERE i.OrderId IN (SELECT TOP(100) Id FROM Orders WHERE @kitchen=0 OR Status IN ('pendiente','preparando','listo') ORDER BY Id DESC);`);
  res.json(result.recordsets[0].map(order => ({ ...order, items: result.recordsets[1].filter(item => item.orderId === order.id) })));
});
api.patch('/orders/:id/status',permit([...service,'cocinero']),async (req,res) => {
  const id = idOf(req), status = req.body.status;
  if (['preparando','listo'].includes(status) && ![...management,'cocinero'].includes(req.user.role)) throw new AppError('Esta acción corresponde a cocina.',403);
  if (['pendiente','entregado'].includes(status) && !service.includes(req.user.role)) throw new AppError('Esta acción corresponde al servicio de mesas.',403);
  await transact(async transaction => {
    const order = (await new sql.Request(transaction).input('id',sql.Int,id)
      .query('SELECT Status FROM Orders WITH(UPDLOCK,HOLDLOCK) WHERE Id=@id')).recordset[0];
    if (!order) throw new AppError('Pedido no encontrado.',404);
    assertTransition(order.Status,status);
    await new sql.Request(transaction).input('id',sql.Int,id).input('status',sql.VarChar(30),status)
      .query(`UPDATE Orders SET Status=@status,UpdatedAt=SYSUTCDATETIME(),SentAt=CASE WHEN @status='pendiente' THEN SYSUTCDATETIME() ELSE SentAt END WHERE Id=@id`);
    await audit(transaction,req.user.id,`Pedido: ${status}`,'Orders',id);
  }); res.json({ ok: true });
});
api.get('/dashboard',permit(management),async (req,res) => {
  res.json((await (await getPool()).request().query(`SELECT
    (SELECT COUNT(*) FROM RestaurantTables WHERE Status='ocupada') AS occupiedTables,
    (SELECT COUNT(*) FROM RestaurantTables WHERE Status='disponible') AS availableTables,
    (SELECT COUNT(*) FROM Orders WHERE Status IN ('pendiente','preparando','listo')) AS pendingOrders,
    (SELECT COUNT(*) FROM Orders WHERE CreatedAt>=DATEADD(hour,6,CONVERT(datetime2,CONVERT(date,DATEADD(hour,-6,SYSUTCDATETIME()))))) AS todayOrders,
    (SELECT COALESCE(SUM(Subtotal),0) FROM Orders WHERE CreatedAt>=DATEADD(hour,6,CONVERT(datetime2,CONVERT(date,DATEADD(hour,-6,SYSUTCDATETIME()))))) AS todayConsumption`)).recordset[0]);
});
api.get('/users',permit(['administrador']),async (req,res) => res.json((await (await getPool()).request()
  .query('SELECT Id AS id,Name AS name,Email AS email,Role AS role,Active AS active FROM Users ORDER BY Name')).recordset));
api.post('/users',permit(['administrador']),async (req,res) => {
  const name = text(req.body.name,'Nombre'), email = text(req.body.email,'Correo',254).toLowerCase();
  const password = req.body.password, role = req.body.role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Correo inválido.');
  if (typeof password !== 'string' || password.length < 12 || password.length > 200) throw new AppError('La contraseña debe tener entre 12 y 200 caracteres.');
  if (!uniqueRoles.includes(role)) throw new AppError('Rol inválido.');
  const hash = await hashPassword(password);
  const id = await transact(async transaction => {
    const result = await new sql.Request(transaction).input('name',sql.NVarChar(120),name).input('email',sql.NVarChar(254),email)
      .input('hash',sql.VarChar(200),hash).input('role',sql.VarChar(30),role)
      .query('INSERT INTO Users(Name,Email,PasswordHash,Role) OUTPUT INSERTED.Id VALUES(@name,@email,@hash,@role)');
    const userId = result.recordset[0].Id;
    await audit(transaction,req.user.id,'Crear usuario','Users',userId); return userId;
  }); res.status(201).json({ id });
});
api.patch('/users/:id/active',permit(['administrador']),async (req,res) => {
  const id = idOf(req), active = req.body.active;
  if (typeof active !== 'boolean') throw new AppError('Estado inválido.');
  if (id === req.user.id) throw new AppError('No puedes desactivar tu propia cuenta.');
  await transact(async transaction => {
    const result = await new sql.Request(transaction).input('id',sql.Int,id).input('active',sql.Bit,active)
      .query('UPDATE Users SET Active=@active OUTPUT INSERTED.Id WHERE Id=@id');
    if (!result.recordset.length) throw new AppError('Usuario no encontrado.',404);
    await audit(transaction,req.user.id,active ? 'Activar usuario' : 'Desactivar usuario','Users',id);
  }); res.json({ ok: true });
});
api.get('/audit',permit(['administrador']),async (req,res) => res.json((await (await getPool()).request()
  .query(`SELECT TOP(100) a.Id AS id,u.Name AS userName,a.Action AS action,a.Entity AS entity,a.EntityId AS entityId,a.CreatedAt AS createdAt
    FROM AuditLog a JOIN Users u ON u.Id=a.UserId ORDER BY a.Id DESC`)).recordset));
