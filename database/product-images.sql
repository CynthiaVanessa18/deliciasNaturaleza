-- Cambio compatible con los productos existentes. No elimina datos.
IF COL_LENGTH('Products','ImageUrl') IS NULL
  ALTER TABLE Products ADD ImageUrl nvarchar(300) NULL;
GO
