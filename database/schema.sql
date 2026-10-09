-- Ejecutar dentro de una base de datos vacía de SQL Server.
IF OBJECT_ID('Users','U') IS NULL
CREATE TABLE Users (
  Id int IDENTITY PRIMARY KEY, Name nvarchar(120) NOT NULL,
  Email nvarchar(254) NOT NULL UNIQUE, PasswordHash varchar(200) NOT NULL,
  Role varchar(30) NOT NULL CHECK(Role IN ('administrador','gerente','cajero','mesero','cocinero','inventario','repartidor','cliente')),
  Active bit NOT NULL DEFAULT 1, CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID('Sessions','U') IS NULL
CREATE TABLE Sessions (Id varchar(128) PRIMARY KEY, Data nvarchar(max) NOT NULL, ExpiresAt datetime2 NOT NULL);
GO
IF OBJECT_ID('Categories','U') IS NULL
CREATE TABLE Categories (Id int IDENTITY PRIMARY KEY, Name nvarchar(80) NOT NULL UNIQUE, Active bit NOT NULL DEFAULT 1);
GO
IF OBJECT_ID('Products','U') IS NULL
CREATE TABLE Products (
  Id int IDENTITY PRIMARY KEY, CategoryId int NOT NULL REFERENCES Categories(Id),
  Name nvarchar(120) NOT NULL, Description nvarchar(500) NOT NULL DEFAULT '',
  Price decimal(12,2) NOT NULL CHECK(Price>0), Available bit NOT NULL DEFAULT 1,
  PreparationMinutes int NOT NULL DEFAULT 15 CHECK(PreparationMinutes BETWEEN 1 AND 240),
  ImageUrl nvarchar(300) NULL,
  UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID('RestaurantTables','U') IS NULL
CREATE TABLE RestaurantTables (
  Id int IDENTITY PRIMARY KEY, Number int NOT NULL UNIQUE CHECK(Number>0),
  Capacity int NOT NULL CHECK(Capacity>0), Zone nvarchar(80) NOT NULL,
  Status varchar(30) NOT NULL DEFAULT 'disponible' CHECK(Status IN ('disponible','ocupada','reservada','limpieza','fuera_servicio')),
  OccupiedAt datetime2 NULL
);
GO
IF OBJECT_ID('Orders','U') IS NULL
CREATE TABLE Orders (
  Id int IDENTITY PRIMARY KEY, TableId int NOT NULL REFERENCES RestaurantTables(Id),
  WaiterId int NOT NULL REFERENCES Users(Id),
  Status varchar(30) NOT NULL DEFAULT 'abierto' CHECK(Status IN ('abierto','pendiente','preparando','listo','entregado')),
  Subtotal decimal(12,2) NOT NULL CHECK(Subtotal>=0),
  CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), SentAt datetime2 NULL, UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID('OrderItems','U') IS NULL
CREATE TABLE OrderItems (
  Id int IDENTITY PRIMARY KEY, OrderId int NOT NULL REFERENCES Orders(Id), ProductId int NOT NULL REFERENCES Products(Id),
  ProductName nvarchar(120) NOT NULL, Quantity int NOT NULL CHECK(Quantity>0),
  UnitPrice decimal(12,2) NOT NULL CHECK(UnitPrice>0), Notes nvarchar(300) NOT NULL DEFAULT ''
);
GO
IF OBJECT_ID('AuditLog','U') IS NULL
CREATE TABLE AuditLog (
  Id bigint IDENTITY PRIMARY KEY, UserId int NOT NULL REFERENCES Users(Id), Action nvarchar(100) NOT NULL,
  Entity nvarchar(80) NOT NULL, EntityId int NOT NULL, Detail nvarchar(500) NOT NULL DEFAULT '',
  CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_Orders_Status' AND object_id=OBJECT_ID('Orders'))
CREATE INDEX IX_Orders_Status ON Orders(Status,CreatedAt);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_Sessions_Expires' AND object_id=OBJECT_ID('Sessions'))
CREATE INDEX IX_Sessions_Expires ON Sessions(ExpiresAt);
