-- ============================================
-- MIGRACIÓN: Corregir políticas RLS para usuario multi-país
-- El usuario multi-país ahora respeta el country_code seleccionado en su perfil
-- ============================================

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS PARA PRODUCTS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view products in their organization and country" ON public.products;
DROP POLICY IF EXISTS "Users can insert products in their organization and country" ON public.products;
DROP POLICY IF EXISTS "Users can update products in their organization and country" ON public.products;
DROP POLICY IF EXISTS "Users can delete products in their organization and country" ON public.products;

-- Política SELECT: usuarios ven productos de su organización Y su país (incluyendo usuario multi-país)
CREATE POLICY "Users can view products in their organization and country"
ON public.products FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

-- Política INSERT: usuarios insertan productos en su organización Y su país
CREATE POLICY "Users can insert products in their organization and country"
ON public.products FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

-- Política UPDATE: usuarios actualizan productos de su organización Y su país
CREATE POLICY "Users can update products in their organization and country"
ON public.products FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

-- Política DELETE: usuarios eliminan productos de su organización Y su país
CREATE POLICY "Users can delete products in their organization and country"
ON public.products FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS PARA SUPPLIERS
-- ============================================

DROP POLICY IF EXISTS "Users can view suppliers in their organization and country" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers in their organization and country" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in their organization and country" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers in their organization and country" ON public.suppliers;

CREATE POLICY "Users can view suppliers in their organization and country"
ON public.suppliers FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert suppliers in their organization and country"
ON public.suppliers FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update suppliers in their organization and country"
ON public.suppliers FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete suppliers in their organization and country"
ON public.suppliers FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS PARA MOVEMENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view movements in their organization and country" ON public.movements;
DROP POLICY IF EXISTS "Users can insert movements in their organization and country" ON public.movements;
DROP POLICY IF EXISTS "Users can update movements in their organization and country" ON public.movements;
DROP POLICY IF EXISTS "Users can delete movements in their organization and country" ON public.movements;

CREATE POLICY "Users can view movements in their organization and country"
ON public.movements FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert movements in their organization and country"
ON public.movements FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update movements in their organization and country"
ON public.movements FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete movements in their organization and country"
ON public.movements FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS PARA CATEGORIES
-- ============================================

DROP POLICY IF EXISTS "Users can view categories in their organization and country" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories in their organization and country" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories in their organization and country" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories in their organization and country" ON public.categories;

CREATE POLICY "Users can view categories in their organization and country"
ON public.categories FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert categories in their organization and country"
ON public.categories FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update categories in their organization and country"
ON public.categories FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete categories in their organization and country"
ON public.categories FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
);

-- ============================================
-- ACTUALIZAR FUNCIÓN RPC: get_top_supplier_last_month
-- ============================================

DROP FUNCTION IF EXISTS get_top_supplier_last_month(UUID);

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
    AND m.country_code = (SELECT country_code FROM public.profiles WHERE id = auth.uid())
  GROUP BY s.id, s.name
  ORDER BY total_quantity DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
