-- ============================================================================
-- FishSinu ERP — PostgreSQL / Supabase Schema
-- Version: 1.0
-- Descripcion: SaaS ERP para distribucion de pescados y mariscos.
--              Inventario fraccionario, POS, creditos con abonos,
--              metricas financieras y facturacion electronica.
--
-- Stack objetivo: PostgreSQL 15+ en Supabase.
-- Notas:
--   - Cantidades: NUMERIC(12,4)
--   - Dinero:     NUMERIC(14,2)
--   - Nunca se usa FLOAT para dinero/cantidades.
--   - Las ventas canceladas no se eliminan; se marcan.
--   - El stock de products es mantenido por un trigger sobre inventory_movements.
--   - El backend (SQLAlchemy async / asyncpg) usa una cuenta con bypass RLS.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. Extensiones
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. Funciones base
-- ============================================================================

-- Actualiza updated_at en tablas que lo requieren.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Evita UPDATE/DELETE sobre movimientos contables inmutables.
CREATE OR REPLACE FUNCTION public.prevent_inventory_movement_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'inventory_movements are immutable: update/delete is not allowed';
END;
$$;

-- ============================================================================
-- 2. Configuracion de la empresa emisora (datos fiscales)
-- ============================================================================

CREATE TABLE public.company_settings (
    id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    business_name   TEXT NOT NULL,
    tax_id          TEXT NOT NULL,
    address         TEXT,
    email           TEXT,
    phone           TEXT,
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    invoice_prefix  TEXT NOT NULL DEFAULT 'F',
    invoice_sequence BIGINT NOT NULL DEFAULT 1,
    logo_url        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Profiles (empleados / usuarios del negocio)
--    Se vincula con Supabase Auth.
-- ============================================================================

CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'cashier'
                CHECK (role IN ('admin', 'cashier', 'accountant')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. Productos / categorias
-- ============================================================================

CREATE TABLE public.product_categories (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_categories_name UNIQUE (name)
);

CREATE TRIGGER trg_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id   BIGINT REFERENCES public.product_categories(id) ON DELETE SET NULL,
    code          TEXT NOT NULL,
    name          TEXT NOT NULL,
    description   TEXT,
    sale_unit     TEXT NOT NULL CHECK (sale_unit IN ('KG', 'LB', 'UNIT')),
    price         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    average_cost  NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (average_cost >= 0),
    stock         NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_products_code UNIQUE (code),
    CONSTRAINT chk_products_price_nonnegative CHECK (price >= 0),
    CONSTRAINT chk_products_average_cost_nonnegative CHECK (average_cost >= 0),
    CONSTRAINT chk_products_stock_nonnegative CHECK (stock >= 0)
);

CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_name_trgm ON public.products USING gin (lower(name) gin_trgm_ops);

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. Clientes
-- ============================================================================

CREATE TABLE public.customers (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_type TEXT NOT NULL DEFAULT 'NIT'
                  CHECK (document_type IN ('RUC', 'DNI', 'CI', 'PASSPORT', 'NIT', 'OTHER')),
    tax_id        TEXT NOT NULL,
    name          TEXT NOT NULL,
    email         TEXT,
    phone         TEXT,
    address       TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customers_tax_id UNIQUE (tax_id)
);

CREATE INDEX idx_customers_name_trgm ON public.customers USING gin (lower(name) gin_trgm_ops);

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 6. Cuentas de credito
-- ============================================================================

CREATE TABLE public.credit_accounts (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id    BIGINT NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE RESTRICT,
    credit_limit   NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
    balance        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    status         TEXT NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE', 'BLOCKED', 'PAID')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_accounts_status_balance ON public.credit_accounts(status, balance);

CREATE TRIGGER trg_credit_accounts_updated_at
BEFORE UPDATE ON public.credit_accounts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. Ventas (cabecera POS)
-- ============================================================================

CREATE TABLE public.sales (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id        BIGINT REFERENCES public.customers(id) ON DELETE RESTRICT,
    cashier_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    payment_type       TEXT NOT NULL CHECK (payment_type IN ('CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED')),
    credit_account_id  BIGINT REFERENCES public.credit_accounts(id) ON DELETE RESTRICT,
    sale_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    total              NUMERIC(14,2) NOT NULL CHECK (total >= 0),
    status             TEXT NOT NULL DEFAULT 'COMPLETED'
                       CHECK (status IN ('COMPLETED', 'CANCELLED')),
    notes              TEXT,
    cancelled_at       TIMESTAMPTZ,
    cancelled_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sales_payment_credit CHECK (
        (payment_type = 'CREDIT' AND credit_account_id IS NOT NULL AND customer_id IS NOT NULL) OR
        (payment_type <> 'CREDIT' AND credit_account_id IS NULL)
    ),
    CONSTRAINT chk_sales_cancellation CHECK (
        (status = 'COMPLETED' AND cancelled_at IS NULL AND cancellation_reason IS NULL) OR
        (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL)
    )
);

CREATE INDEX idx_sales_sale_date_status ON public.sales(sale_date DESC, status);
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id, sale_date DESC);
CREATE INDEX idx_sales_credit_account_id ON public.sales(credit_account_id);
CREATE INDEX idx_sales_cashier_id ON public.sales(cashier_id);

CREATE TRIGGER trg_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 8. Sale items / lineas de venta
--    unit_cost se congela en el momento de la venta para utilidad historica.
-- ============================================================================

CREATE TABLE public.sale_items (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id     BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE RESTRICT,
    product_id  BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    line_number SMALLINT NOT NULL CHECK (line_number > 0),
    description TEXT NOT NULL,
    quantity    NUMERIC(12,4) NOT NULL CHECK (quantity > 0),
    unit        TEXT NOT NULL CHECK (unit IN ('KG', 'LB', 'UNIT')),
    unit_price  NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost   NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
    line_total  NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    CONSTRAINT uq_sale_items_line UNIQUE (sale_id, line_number)
);

CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id, sale_id);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);

-- ============================================================================
-- 9. Inventory movements (ledger de inventario)
--    quantity es algebraica:
--      STOCK_IN   > 0
--      STOCK_OUT  < 0
--      SPOILAGE   < 0
--      ADJUSTMENT > 0 o < 0
--    El trigger actualiza products.stock y products.average_cost automaticamente.
-- ============================================================================

CREATE TABLE public.inventory_movements (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id    BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sale_id       BIGINT REFERENCES public.sales(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SPOILAGE')),
    quantity      NUMERIC(12,4) NOT NULL CHECK (quantity <> 0),
    unit_cost     NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
    stock_after   NUMERIC(12,4) NOT NULL,
    reason        TEXT,
    created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_inventory_movement_type_quantity CHECK (
        (movement_type = 'STOCK_IN' AND quantity > 0) OR
        (movement_type IN ('STOCK_OUT', 'SPOILAGE') AND quantity < 0) OR
        (movement_type = 'ADJUSTMENT')
    )
);

CREATE INDEX idx_inventory_movements_product_created ON public.inventory_movements(product_id, created_at DESC);
CREATE INDEX idx_inventory_movements_sale_id ON public.inventory_movements(sale_id);
CREATE INDEX idx_inventory_movements_type_created ON public.inventory_movements(movement_type, created_at DESC);

CREATE TRIGGER trg_inventory_movements_apply
BEFORE INSERT ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

CREATE TRIGGER trg_inventory_movements_immutable
BEFORE UPDATE OR DELETE ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION public.prevent_inventory_movement_change();

-- ============================================================================
-- Funcion/trigger de inventario
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock NUMERIC(12,4);
    v_current_cost  NUMERIC(14,2);
    v_new_cost      NUMERIC(14,2);
BEGIN
    -- Bloquea la fila del producto para evitar condiciones de carrera entre cajas.
    SELECT stock, average_cost
      INTO v_current_stock, v_current_cost
      FROM public.products
     WHERE id = NEW.product_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % does not exist', NEW.product_id;
    END IF;

    NEW.stock_after := v_current_stock + NEW.quantity;

    IF NEW.stock_after < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product %: current=%, requested=%.',
            NEW.product_id, v_current_stock, NEW.quantity;
    END IF;

    -- Actualiza stock y costo promedio ponderado solo en entradas de compra.
    IF NEW.quantity > 0 AND NEW.movement_type = 'STOCK_IN' THEN
        v_new_cost := ((v_current_stock * v_current_cost) + (NEW.quantity * NEW.unit_cost)) / NEW.stock_after;

        UPDATE public.products
           SET stock        = NEW.stock_after,
               average_cost = v_new_cost,
               updated_at   = NOW()
         WHERE id = NEW.product_id;
    ELSE
        UPDATE public.products
           SET stock      = NEW.stock_after,
               updated_at = NOW()
         WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 10. Abonos / pagos a creditos
-- ============================================================================

CREATE TABLE public.payments (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    credit_account_id  BIGINT NOT NULL REFERENCES public.credit_accounts(id) ON DELETE RESTRICT,
    amount             NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_type       TEXT NOT NULL CHECK (payment_type IN ('CASH', 'CARD', 'TRANSFER', 'MIXED')),
    payment_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    reference          TEXT,
    notes              TEXT,
    registered_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_credit_account_date ON public.payments(credit_account_id, payment_date DESC);

-- ============================================================================
-- 11. Facturas
-- ============================================================================

CREATE TABLE public.invoices (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id             BIGINT NOT NULL UNIQUE REFERENCES public.sales(id) ON DELETE RESTRICT,
    invoice_number      TEXT UNIQUE,
    status              TEXT NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'EMITTED', 'CANCELLED', 'REJECTED')),
    issue_date          DATE,
    customer_name       TEXT NOT NULL,
    customer_tax_id     TEXT NOT NULL,
    customer_address    TEXT,
    subtotal            NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount          NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total               NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    external_invoice_id TEXT,
    xml_url             TEXT,
    pdf_url             TEXT,
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_invoices_emission CHECK (
        (status = 'DRAFT' AND invoice_number IS NULL AND issue_date IS NULL) OR
        (status IN ('EMITTED', 'CANCELLED', 'REJECTED') AND invoice_number IS NOT NULL AND issue_date IS NOT NULL)
    )
);

CREATE INDEX idx_invoices_status_issue_date ON public.invoices(status, issue_date DESC);

CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 12. Row Level Security (Supabase)
--     El backend usa un rol con bypass RLS (service_role/postgres).
--     Los usuarios autenticados solo pueden LEER datos de su negocio.
--     No se exponen escrituras directas al cliente; la API REST las controla.
-- ============================================================================

ALTER TABLE public.company_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices              ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_authenticated" ON public.company_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.product_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.credit_accounts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.sales
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.sale_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.inventory_movements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_authenticated" ON public.invoices
    FOR SELECT TO authenticated USING (true);

COMMIT;
