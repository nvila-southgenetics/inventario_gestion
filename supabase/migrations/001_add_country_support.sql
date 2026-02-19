-- ============================================
-- MIGRACIÓN: Soporte Multi-País
-- Agrega country_code a todas las tablas principales
-- ============================================

-- Agregar columna country_code a profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'MX';

-- Agregar columna country_code a products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'MX';

-- Agregar columna country_code a suppliers
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'MX';

-- Agregar columna country_code a movements
ALTER TABLE public.movements
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'MX';

-- Agregar columna country_code a categories
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'MX';

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_products_country_code ON public.products(country_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_country_code ON public.suppliers(country_code);
CREATE INDEX IF NOT EXISTS idx_movements_country_code ON public.movements(country_code);
CREATE INDEX IF NOT EXISTS idx_categories_country_code ON public.categories(country_code);

-- Índices compuestos para queries comunes (organization_id + country_code)
CREATE INDEX IF NOT EXISTS idx_products_org_country ON public.products(organization_id, country_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_org_country ON public.suppliers(organization_id, country_code);
CREATE INDEX IF NOT EXISTS idx_movements_org_country ON public.movements(organization_id, country_code);
CREATE INDEX IF NOT EXISTS idx_categories_org_country ON public.categories(organization_id, country_code);

-- ============================================
-- FUNCIÓN: Obtener country_code del usuario actual
-- ============================================

CREATE OR REPLACE FUNCTION get_user_country_code(user_id UUID)
RETURNS VARCHAR(2) AS $$
DECLARE
  user_email TEXT;
  country_code VARCHAR(2);
BEGIN
  -- Obtener email del usuario
  SELECT email INTO user_email
  FROM public.profiles
  WHERE id = user_id;
  
  -- Si es el usuario multi-país, retornar NULL para permitir ver todos los países
  IF user_email = 'nvila@southgenetics.com' THEN
    RETURN NULL;
  END IF;
  
  -- Obtener country_code del perfil
  SELECT p.country_code INTO country_code
  FROM public.profiles p
  WHERE p.id = user_id;
  
  RETURN COALESCE(country_code, 'MX');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS PARA PRODUCTS
-- ============================================

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;
DROP POLICY IF EXISTS "Users can insert products in their organization" ON public.products;
DROP POLICY IF EXISTS "Users can update products in their organization" ON public.products;
DROP POLICY IF EXISTS "Users can delete products in their organization" ON public.products;

-- Política SELECT: usuarios ven productos de su organización Y su país (o todos si son multi-país)
CREATE POLICY "Users can view products in their organization and country"
ON public.products FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    -- Usuario multi-país puede ver todos los países
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
    OR
    -- Usuario normal solo ve su país
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
  )
);

-- Política INSERT: usuarios insertan productos en su organización Y su país
CREATE POLICY "Users can insert products in their organization and country"
ON public.products FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

-- Política UPDATE: usuarios actualizan productos de su organización Y su país
CREATE POLICY "Users can update products in their organization and country"
ON public.products FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

-- Política DELETE: usuarios eliminan productos de su organización Y su país
CREATE POLICY "Users can delete products in their organization and country"
ON public.products FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS PARA SUPPLIERS
-- ============================================

DROP POLICY IF EXISTS "Users can view suppliers in their organization" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers in their organization" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in their organization" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers in their organization" ON public.suppliers;

CREATE POLICY "Users can view suppliers in their organization and country"
ON public.suppliers FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
    OR
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert suppliers in their organization and country"
ON public.suppliers FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

CREATE POLICY "Users can update suppliers in their organization and country"
ON public.suppliers FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

CREATE POLICY "Users can delete suppliers in their organization and country"
ON public.suppliers FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS PARA MOVEMENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view movements in their organization" ON public.movements;
DROP POLICY IF EXISTS "Users can insert movements in their organization" ON public.movements;
DROP POLICY IF EXISTS "Users can update movements in their organization" ON public.movements;
DROP POLICY IF EXISTS "Users can delete movements in their organization" ON public.movements;

CREATE POLICY "Users can view movements in their organization and country"
ON public.movements FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
    OR
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert movements in their organization and country"
ON public.movements FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

CREATE POLICY "Users can update movements in their organization and country"
ON public.movements FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

CREATE POLICY "Users can delete movements in their organization and country"
ON public.movements FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS PARA CATEGORIES
-- ============================================

DROP POLICY IF EXISTS "Users can view categories in their organization" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories in their organization" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories in their organization" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories in their organization" ON public.categories;

CREATE POLICY "Users can view categories in their organization and country"
ON public.categories FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
    OR
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert categories in their organization and country"
ON public.categories FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

CREATE POLICY "Users can update categories in their organization and country"
ON public.categories FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

CREATE POLICY "Users can delete categories in their organization and country"
ON public.categories FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND (
    country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
  )
);

-- ============================================
-- ACTUALIZAR FUNCIÓN RPC: get_top_supplier_last_month
-- ============================================

-- Primero eliminar la función existente si existe
DROP FUNCTION IF EXISTS get_top_supplier_last_month(UUID);

-- Recrear la función con soporte para country_code
CREATE OR REPLACE FUNCTION get_top_supplier_last_month(org_id UUID)
RETURNS TABLE (
  supplier_id UUID,
  supplier_name TEXT,
  total_quantity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS supplier_id,
    s.name AS supplier_name,
    SUM(m.quantity) AS total_quantity
  FROM public.movements m
  INNER JOIN public.suppliers s ON m.supplier_id = s.id
  WHERE 
    m.organization_id = org_id
    AND m.type = 'Entrada'
    AND m.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND m.created_at < DATE_TRUNC('month', CURRENT_DATE)
    AND (
      -- Si el usuario es multi-país, ver todos los países
      (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'nvila@southgenetics.com'
      OR
      -- Si no, filtrar por país del usuario
      m.country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
    )
  GROUP BY s.id, s.name
  ORDER BY total_quantity DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON COLUMN public.profiles.country_code IS 'Código de país (MX, UY, etc.) para multi-tenancy';
COMMENT ON COLUMN public.products.country_code IS 'Código de país del producto';
COMMENT ON COLUMN public.suppliers.country_code IS 'Código de país del proveedor';
COMMENT ON COLUMN public.movements.country_code IS 'Código de país del movimiento';
COMMENT ON COLUMN public.categories.country_code IS 'Código de país de la categoría';
