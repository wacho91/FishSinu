# backend/src/models.py
"""
FishSinu - Modelos ORM asíncronos.

Capa: Infrastructure

Mapean el esquema PostgreSQL publicado en database/schema.sql.
Los nombres de columnas/tablas y las restricciones respetan el DDL original.

NOTA:
- Los triggers (`set_updated_at`, `apply_inventory_movement`,
  `prevent_inventory_movement_change`) viven en PostgreSQL.
- `products.stock`, `products.average_cost` e
  `inventory_movements.stock_after` son mantenidos por triggers.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Computed,
    Date,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# ---------------------------------------------------------------------------
# Mixins
# ---------------------------------------------------------------------------
class TimestampMixin:
    """Agrega created_at/updated_at a tablas que tienen ambas columnas."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class CreatedAtMixin:
    """Agrega solo created_at para tablas que no tienen updated_at."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


# ---------------------------------------------------------------------------
# 2. company_settings
# ---------------------------------------------------------------------------
class CompanySetting(TimestampMixin, Base):
    __tablename__ = "company_settings"
    __table_args__ = (
        CheckConstraint("id = 1", name="chk_company_settings_singleton"),
    )

    id: Mapped[int] = mapped_column(
        SmallInteger,
        primary_key=True,
        autoincrement=False,
        default=1,
        server_default=text("1"),
    )
    business_name: Mapped[str] = mapped_column(Text, nullable=False)
    tax_id: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="USD", server_default=text("'USD'")
    )
    invoice_prefix: Mapped[str] = mapped_column(
        Text, nullable=False, default="F", server_default=text("'F'")
    )
    invoice_sequence: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=1, server_default=text("1")
    )
    logo_url: Mapped[str | None] = mapped_column(Text)


# ---------------------------------------------------------------------------
# 3. profiles
# ---------------------------------------------------------------------------
class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"
    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'cashier', 'accountant')",
            name="chk_profiles_role",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)  # auth.users.id
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="cashier",
        server_default=text("'cashier'"),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )


# ---------------------------------------------------------------------------
# 4. product_categories
# ---------------------------------------------------------------------------
class ProductCategory(TimestampMixin, Base):
    __tablename__ = "product_categories"
    __table_args__ = (
        UniqueConstraint("name", name="uq_product_categories_name"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    products: Mapped[list[Product]] = relationship(
        back_populates="category"
    )


# ---------------------------------------------------------------------------
# 5. products
# ---------------------------------------------------------------------------
class Product(TimestampMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("code", name="uq_products_code"),
        CheckConstraint(
            "sale_unit IN ('KG', 'LB', 'UNIT')",
            name="chk_products_sale_unit",
        ),
        CheckConstraint("price >= 0", name="chk_products_price_nonnegative"),
        CheckConstraint(
            "average_cost >= 0",
            name="chk_products_average_cost_nonnegative",
        ),
        CheckConstraint("stock >= 0", name="chk_products_stock_nonnegative"),
        Index("idx_products_category_id", "category_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_categories.id", ondelete="SET NULL")
    )
    code: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sale_unit: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0"),
        server_default=text("0"),
    )
    average_cost: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0"),
        server_default=text("0"),
    )
    stock: Mapped[Decimal] = mapped_column(
        Numeric(12, 4),
        nullable=False,
        default=Decimal("0"),
        server_default=text("0"),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    category: Mapped[ProductCategory | None] = relationship(
        back_populates="products"
    )
    sale_items: Mapped[list[SaleItem]] = relationship(
        back_populates="product"
    )
    inventory_movements: Mapped[list[InventoryMovement]] = relationship(
        back_populates="product"
    )


# ---------------------------------------------------------------------------
# 6. customers
# ---------------------------------------------------------------------------
class Customer(TimestampMixin, Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("tax_id", name="uq_customers_tax_id"),
        CheckConstraint(
            "document_type IN ('RUC', 'DNI', 'CI', 'PASSPORT', 'NIT', 'OTHER')",
            name="chk_customers_document_type",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    document_type: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="NIT",
        server_default=text("'NIT'"),
    )
    tax_id: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    credit_account: Mapped[CreditAccount | None] = relationship(
        back_populates="customer",
        uselist=False,
    )
    sales: Mapped[list[Sale]] = relationship(back_populates="customer")


# ---------------------------------------------------------------------------
# 7. credit_accounts
# ---------------------------------------------------------------------------
class CreditAccount(TimestampMixin, Base):
    __tablename__ = "credit_accounts"
    __table_args__ = (
        UniqueConstraint("customer_id", name="uq_credit_accounts_customer_id"),
        CheckConstraint(
            "credit_limit >= 0",
            name="chk_credit_accounts_credit_limit_nonnegative",
        ),
        CheckConstraint(
            "balance >= 0",
            name="chk_credit_accounts_balance_nonnegative",
        ),
        CheckConstraint(
            "status IN ('ACTIVE', 'BLOCKED', 'PAID')",
            name="chk_credit_accounts_status",
        ),
        Index("idx_credit_accounts_status_balance", "status", "balance"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    credit_limit: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0"),
        server_default=text("0"),
    )
    balance: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0"),
        server_default=text("0"),
    )
    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="ACTIVE",
        server_default=text("'ACTIVE'"),
    )

    customer: Mapped[Customer] = relationship(back_populates="credit_account")
    sales: Mapped[list[Sale]] = relationship(back_populates="credit_account")
    payments: Mapped[list[Payment]] = relationship(
        back_populates="credit_account"
    )


# ---------------------------------------------------------------------------
# 8. sales
# ---------------------------------------------------------------------------
class Sale(TimestampMixin, Base):
    __tablename__ = "sales"
    __table_args__ = (
        CheckConstraint(
            "payment_type IN ('CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED')",
            name="chk_sales_payment_type",
        ),
        CheckConstraint(
            "status IN ('COMPLETED', 'CANCELLED')",
            name="chk_sales_status",
        ),
        CheckConstraint("total >= 0", name="chk_sales_total_nonnegative"),
        CheckConstraint(
            "(payment_type = 'CREDIT' AND credit_account_id IS NOT NULL "
            "AND customer_id IS NOT NULL) OR "
            "(payment_type <> 'CREDIT' AND credit_account_id IS NULL)",
            name="chk_sales_payment_credit",
        ),
        CheckConstraint(
            "(status = 'COMPLETED' AND cancelled_at IS NULL "
            "AND cancellation_reason IS NULL) OR "
            "(status = 'CANCELLED' AND cancelled_at IS NOT NULL "
            "AND cancellation_reason IS NOT NULL)",
            name="chk_sales_cancellation",
        ),
        Index("idx_sales_sale_date_status", "sale_date", "status"),
        Index("idx_sales_customer_id", "customer_id", "sale_date"),
        Index("idx_sales_credit_account_id", "credit_account_id"),
        Index("idx_sales_cashier_id", "cashier_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT")
    )
    cashier_id: Mapped[UUID] = mapped_column(
        ForeignKey("auth.users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    payment_type: Mapped[str] = mapped_column(Text, nullable=False)
    credit_account_id: Mapped[int | None] = mapped_column(
        ForeignKey("credit_accounts.id", ondelete="RESTRICT")
    )
    sale_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
        server_default=text("CURRENT_DATE"),
    )
    total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="COMPLETED",
        server_default=text("'COMPLETED'"),
    )
    notes: Mapped[str | None] = mapped_column(Text)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("auth.users.id", ondelete="SET NULL")
    )
    cancellation_reason: Mapped[str | None] = mapped_column(Text)

    customer: Mapped[Customer | None] = relationship(
        foreign_keys=[customer_id],
        back_populates="sales",
    )
    credit_account: Mapped[CreditAccount | None] = relationship(
        back_populates="sales"
    )
    items: Mapped[list[SaleItem]] = relationship(
        back_populates="sale",
    )


# ---------------------------------------------------------------------------
# 9. sale_items
# ---------------------------------------------------------------------------
class SaleItem(Base):
    __tablename__ = "sale_items"
    __table_args__ = (
        UniqueConstraint("sale_id", "line_number", name="uq_sale_items_line"),
        CheckConstraint("line_number > 0", name="chk_sale_items_line_number_positive"),
        CheckConstraint("quantity > 0", name="chk_sale_items_quantity_positive"),
        CheckConstraint(
            "unit IN ('KG', 'LB', 'UNIT')",
            name="chk_sale_items_unit",
        ),
        CheckConstraint(
            "unit_price >= 0",
            name="chk_sale_items_unit_price_nonnegative",
        ),
        CheckConstraint(
            "unit_cost >= 0",
            name="chk_sale_items_unit_cost_nonnegative",
        ),
        Index("idx_sale_items_product_id", "product_id", "sale_id"),
        Index("idx_sale_items_sale_id", "sale_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    line_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unit: Mapped[str] = mapped_column(Text, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        Computed("quantity * unit_price"),
        nullable=False,
    )

    sale: Mapped[Sale] = relationship(back_populates="items")
    product: Mapped[Product] = relationship(back_populates="sale_items")


# ---------------------------------------------------------------------------
# 10. inventory_movements
#     Tabla inmutable. Los triggers actualizan stock y stock_after.
# ---------------------------------------------------------------------------
class InventoryMovement(CreatedAtMixin, Base):
    __tablename__ = "inventory_movements"
    __table_args__ = (
        CheckConstraint(
            "movement_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SPOILAGE')",
            name="chk_inventory_movements_type",
        ),
        CheckConstraint(
            "quantity <> 0",
            name="chk_inventory_movements_quantity_nonzero",
        ),
        CheckConstraint(
            "unit_cost >= 0",
            name="chk_inventory_movements_unit_cost_nonnegative",
        ),
        CheckConstraint(
            "(movement_type = 'STOCK_IN' AND quantity > 0) OR "
            "(movement_type IN ('STOCK_OUT', 'SPOILAGE') AND quantity < 0) OR "
            "(movement_type = 'ADJUSTMENT')",
            name="chk_inventory_movement_type_quantity",
        ),
        Index(
            "idx_inventory_movements_product_created",
            "product_id",
            "created_at",
        ),
        Index("idx_inventory_movements_sale_id", "sale_id"),
        Index(
            "idx_inventory_movements_type_created",
            "movement_type",
            "created_at",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    sale_id: Mapped[int | None] = mapped_column(
        ForeignKey("sales.id", ondelete="RESTRICT")
    )
    movement_type: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    stock_after: Mapped[Decimal] = mapped_column(
        Numeric(12, 4),
        nullable=False,
    )
    reason: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("auth.users.id", ondelete="SET NULL")
    )

    product: Mapped[Product] = relationship(back_populates="inventory_movements")
    sale: Mapped[Sale | None] = relationship()


# ---------------------------------------------------------------------------
# 11. payments
# ---------------------------------------------------------------------------
class Payment(CreatedAtMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_payments_amount_positive"),
        CheckConstraint(
            "payment_type IN ('CASH', 'CARD', 'TRANSFER', 'MIXED')",
            name="chk_payments_payment_type",
        ),
        Index(
            "idx_payments_credit_account_date",
            "credit_account_id",
            "payment_date",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    credit_account_id: Mapped[int] = mapped_column(
        ForeignKey("credit_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_type: Mapped[str] = mapped_column(Text, nullable=False)
    payment_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
        server_default=text("CURRENT_DATE"),
    )
    reference: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    registered_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("auth.users.id", ondelete="SET NULL")
    )

    credit_account: Mapped[CreditAccount] = relationship(
        back_populates="payments"
    )


# ---------------------------------------------------------------------------
# 12. invoices
# ---------------------------------------------------------------------------
class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("sale_id", name="uq_invoices_sale_id"),
        UniqueConstraint("invoice_number", name="uq_invoices_invoice_number"),
        CheckConstraint(
            "status IN ('DRAFT', 'EMITTED', 'CANCELLED', 'REJECTED')",
            name="chk_invoices_status",
        ),
        CheckConstraint("subtotal >= 0", name="chk_invoices_subtotal_nonnegative"),
        CheckConstraint("tax_amount >= 0", name="chk_invoices_tax_amount_nonnegative"),
        CheckConstraint("total >= 0", name="chk_invoices_total_nonnegative"),
        CheckConstraint(
            "(status = 'DRAFT' AND invoice_number IS NULL AND issue_date IS NULL) OR "
            "(status IN ('EMITTED', 'CANCELLED', 'REJECTED') "
            "AND invoice_number IS NOT NULL AND issue_date IS NOT NULL)",
            name="chk_invoices_emission",
        ),
        Index("idx_invoices_status_issue_date", "status", "issue_date"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="RESTRICT"),
        nullable=False,
    )
    invoice_number: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="DRAFT",
        server_default=text("'DRAFT'"),
    )
    issue_date: Mapped[date | None] = mapped_column(Date)
    customer_name: Mapped[str] = mapped_column(Text, nullable=False)
    customer_tax_id: Mapped[str] = mapped_column(Text, nullable=False)
    customer_address: Mapped[str | None] = mapped_column(Text)
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0"),
        server_default=text("0"),
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0"),
        server_default=text("0"),
    )
    total: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0"),
        server_default=text("0"),
    )
    external_invoice_id: Mapped[str | None] = mapped_column(Text)
    xml_url: Mapped[str | None] = mapped_column(Text)
    pdf_url: Mapped[str | None] = mapped_column(Text)
    # La columna SQL se llama "metadata"; se renombra en Python para
    # no chocar con el atributo metadata del modelo declarativo.
    metadata_json: Mapped[dict | None] = mapped_column(JSONB)

    sale: Mapped[Sale] = relationship()
