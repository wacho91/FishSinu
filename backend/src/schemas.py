# backend/src/schemas.py
"""
FishSinu - Schemas Pydantic (DTOs).

Capa: Application
Define contratos de entrada/salida para las rutas HTTP.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Tipos literales
# ---------------------------------------------------------------------------
ProfileRole = Literal["admin", "cashier", "accountant"]
SalesUnit = Literal["KG", "LB", "UNIT"]
DocumentType = Literal["CC", "NIT", "PASSPORT", "OTHER"]
CreditAccountStatus = Literal["ACTIVE", "BLOCKED", "PAID"]
SalePaymentType = Literal["CASH", "CARD", "TRANSFER", "CREDIT", "MIXED"]
SaleStatus = Literal["COMPLETED", "CANCELLED"]
MovementType = Literal["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "SPOILAGE"]
InvoiceStatus = Literal["DRAFT", "EMITTED", "CANCELLED", "REJECTED"]
PaymentType = Literal["CASH", "CARD", "TRANSFER", "MIXED"]


# ---------------------------------------------------------------------------
# Company settings
# ---------------------------------------------------------------------------
class CompanySettingUpdate(BaseModel):
    business_name: str | None = Field(default=None, min_length=1)
    tax_id: str | None = Field(default=None, min_length=1)
    address: str | None = None
    email: str | None = None
    phone: str | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    invoice_prefix: str | None = Field(default=None, min_length=1)
    logo_url: str | None = None


class CompanySettingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    tax_id: str
    address: str | None
    email: str | None
    phone: str | None
    currency: str
    invoice_prefix: str
    invoice_sequence: int
    logo_url: str | None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------
class ProfileCreate(BaseModel):
    id: UUID
    full_name: str = Field(min_length=1)
    role: ProfileRole = "cashier"
    is_active: bool = True


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1)
    role: ProfileRole | None = None
    is_active: bool | None = None


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    role: ProfileRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Product categories
# ---------------------------------------------------------------------------
class ProductCategoryCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    is_active: bool = True


class ProductCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    is_active: bool | None = None


class ProductCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
class ProductCreate(BaseModel):
    category_id: int | None = None
    code: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    sale_unit: SalesUnit
    price: Decimal = Field(default=Decimal("0"), ge=0)
    is_active: bool = True


class ProductUpdate(BaseModel):
    category_id: int | None = None
    code: str | None = Field(default=None, min_length=1)
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    sale_unit: SalesUnit | None = None
    price: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int | None
    code: str
    name: str
    description: str | None
    sale_unit: SalesUnit
    price: Decimal
    average_cost: Decimal
    stock: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------
class CustomerBase(BaseModel):
    document_type: DocumentType = "NIT"
    tax_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    is_active: bool = True


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    document_type: DocumentType | None = None
    tax_id: str | None = Field(default=None, min_length=1)
    name: str | None = Field(default=None, min_length=1)
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    is_active: bool | None = None


class CustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_type: DocumentType
    tax_id: str
    name: str
    email: str | None
    phone: str | None
    address: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Credit accounts
# ---------------------------------------------------------------------------
class CreditAccountCreate(BaseModel):
    customer_id: int
    credit_limit: Decimal = Field(default=Decimal("0"), ge=0)
    status: CreditAccountStatus = "ACTIVE"


class CreditAccountUpdate(BaseModel):
    credit_limit: Decimal | None = Field(default=None, ge=0)
    status: CreditAccountStatus | None = None


class CreditAccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    credit_limit: Decimal
    balance: Decimal
    status: CreditAccountStatus
    created_at: datetime
    updated_at: datetime


class CustomerDetail(CustomerRead):
    credit_account: CreditAccountRead | None = None


# ---------------------------------------------------------------------------
# Sale items
# ---------------------------------------------------------------------------
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: Decimal = Field(gt=0)
    unit: SalesUnit | None = None
    unit_price: Decimal | None = Field(default=None, ge=0)
    unit_cost: Decimal | None = Field(default=None, ge=0)
    description: str | None = None


class SaleItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sale_id: int
    product_id: int
    line_number: int
    description: str
    quantity: Decimal
    unit: SalesUnit
    unit_price: Decimal
    unit_cost: Decimal
    line_total: Decimal
    product: ProductRead | None = None


# ---------------------------------------------------------------------------
# Sales
# ---------------------------------------------------------------------------
class SaleCreate(BaseModel):
    customer_id: int | None = None
    cashier_id: UUID
    payment_type: SalePaymentType
    credit_account_id: int | None = None
    sale_date: date | None = None
    notes: str | None = None
    items: list[SaleItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def _validate_payment(self):
        if self.payment_type == "CREDIT":
            if not self.credit_account_id:
                raise ValueError("credit_account_id es obligatorio en ventas a crédito.")
            if not self.customer_id:
                raise ValueError("customer_id es obligatorio en ventas a crédito.")
        elif self.credit_account_id is not None:
            raise ValueError(
                "credit_account_id solo puede usarse cuando payment_type es CREDIT."
            )
        return self


class SaleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int | None
    cashier_id: UUID
    payment_type: SalePaymentType
    credit_account_id: int | None
    sale_date: date
    total: Decimal
    status: SaleStatus
    notes: str | None
    cancelled_at: datetime | None
    cancelled_by: UUID | None
    cancellation_reason: str | None
    created_at: datetime
    updated_at: datetime


class SaleRead(SaleSummary):
    items: list[SaleItemRead] = []


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------
class PaymentCreate(BaseModel):
    credit_account_id: int
    amount: Decimal = Field(gt=0)
    payment_type: PaymentType = "CASH"
    payment_date: date | None = None
    reference: str | None = None
    notes: str | None = None
    registered_by: UUID | None = None


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    credit_account_id: int
    amount: Decimal
    payment_type: PaymentType
    payment_date: date
    reference: str | None
    notes: str | None
    registered_by: UUID | None
    created_at: datetime


# ---------------------------------------------------------------------------
# Inventory movements
# ---------------------------------------------------------------------------
class InventoryMovementCreate(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: Decimal
    unit_cost: Decimal | None = Field(default=None, ge=0)
    reason: str | None = None
    created_by: UUID | None = None

    @field_validator("quantity")
    @classmethod
    def quantity_not_zero(cls, value: Decimal) -> Decimal:
        if value == 0:
            raise ValueError("La cantidad no puede ser cero.")
        return value


class InventoryMovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    sale_id: int | None
    movement_type: MovementType
    quantity: Decimal
    unit_cost: Decimal
    stock_after: Decimal
    reason: str | None
    created_by: UUID | None
    created_at: datetime
    product: ProductRead | None = None


# ---------------------------------------------------------------------------
# Invoices
# ---------------------------------------------------------------------------
class InvoiceCreate(BaseModel):
    sale_id: int


class InvoiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sale_id: int
    invoice_number: str | None = None
    status: InvoiceStatus
    issue_date: date | None = None
    customer_name: str
    customer_tax_id: str
    customer_address: str | None = None
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    external_invoice_id: str | None = None
    xml_url: str | None = None
    pdf_url: str | None = None
    # La columna SQL se llama "metadata"; en el ORM es metadata_json.
    metadata: dict | None = Field(default=None, validation_alias="metadata_json")
    created_at: datetime
    updated_at: datetime
