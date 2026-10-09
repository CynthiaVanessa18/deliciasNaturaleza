IF NOT EXISTS(SELECT 1 FROM Categories)
BEGIN
  INSERT INTO Categories(Name) VALUES (N'Platos fuertes'),(N'Entradas'),(N'Bebidas'),(N'Postres');
  INSERT INTO Products(CategoryId,Name,Description,Price,PreparationMinutes)
  SELECT Id,N'Casado de pollo',N'Arroz, frijoles, ensalada, plátano maduro y pollo a la plancha.',4500,20 FROM Categories WHERE Name=N'Platos fuertes';
  INSERT INTO Products(CategoryId,Name,Description,Price,PreparationMinutes)
  SELECT Id,N'Hamburguesa de la casa',N'Carne a la parrilla, queso, vegetales y papas artesanales.',5800,18 FROM Categories WHERE Name=N'Platos fuertes';
  INSERT INTO Products(CategoryId,Name,Description,Price,PreparationMinutes)
  SELECT Id,N'Patacones',N'Plátano verde crujiente con frijoles molidos y pico de gallo.',2800,12 FROM Categories WHERE Name=N'Entradas';
  INSERT INTO Products(CategoryId,Name,Description,Price,PreparationMinutes)
  SELECT Id,N'Limonada natural',N'Limón fresco, agua y un toque de hierbabuena.',1500,5 FROM Categories WHERE Name=N'Bebidas';
  INSERT INTO Products(CategoryId,Name,Description,Price,PreparationMinutes)
  SELECT Id,N'Café de Costa Rica',N'Café recién preparado.',1200,5 FROM Categories WHERE Name=N'Bebidas';
  INSERT INTO Products(CategoryId,Name,Description,Price,PreparationMinutes)
  SELECT Id,N'Tres leches',N'Bizcocho suave con crema y canela.',2200,5 FROM Categories WHERE Name=N'Postres';
END;
IF NOT EXISTS(SELECT 1 FROM RestaurantTables)
INSERT INTO RestaurantTables(Number,Capacity,Zone) VALUES (1,2,N'Salón'),(2,4,N'Salón'),(3,4,N'Salón'),(4,6,N'Salón'),(5,2,N'Terraza'),(6,4,N'Terraza'),(7,4,N'Terraza'),(8,6,N'Terraza');
