# backend/src/routes.py
"""
FishSinu - Controladores HTTP / Routers.

Capa: Infrastructure / Application
Expone los endpoints REST consumiendo directamente los modelos ORM
con manejo de errores HTTP y commits transaccionales asíncronos.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# === IMPORTACIONES CORREGIDAS CON PUNTITO ===
from .database import get_db
from .models import (
    CompanySetting,
    CreditAccount,
    Customer,
    InventoryMovement,
    Invoice,
    Payment,
    Product,
    ProductCategory,
    Profile,
    Sale,
    SaleItem,
)
from .schemas import (
    CompanySettingRead,
    CompanySettingUpdate,
    CreditAccountCreate,
    CreditAccountRead,
    CreditAccountUpdate,
    CustomerCreate,
    CustomerDetail,
    CustomerRead,
    CustomerUpdate,
    InventoryMovementCreate,
    InventoryMovementRead,
    InvoiceCreate,
    InvoiceRead,
    PaymentCreate,
    PaymentRead,
    ProductCategoryCreate,
    ProductCategoryRead,
    ProductCategoryUpdate,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    ProfileCreate,
    ProfileRead,
    ProfileUpdate,
    SaleCreate,
    SaleRead,
    SaleSummary,
)
# ============================================

router = APIRouter(prefix="/api/v1")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def _get_or_404(
    db: AsyncSession,
    model,
    record_id: int | UUID,
    detail: str = "Recurso no encontrado.",
):
    obj = await db.get(model, record_id)
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return obj


async def _commit_or_conflict(db: AsyncSession) -> None:
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La operación viola una restricción de integridad.",
        ) from exc


# ---------------------------------------------------------------------------
# Company settings
# ---------------------------------------------------------------------------
@router.get("/company-settings", response_model=CompanySettingRead)
async def get_company_settings(db: AsyncSession = Depends(get_db)):
    settings = await db.get(CompanySetting, 1)
    if settings is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company settings no inicializados.",
        )
    return settings


@router.put("/company-settings", response_model=CompanySettingRead)
async def update_company_settings(
    payload: CompanySettingUpdate,
    db: AsyncSession = Depends(get_db),
):
    settings = await db.get(CompanySetting, 1)
    data = payload.model_dump(exclude_unset=True)

    if settings is None:
        if not data.get("business_name") or not data.get("tax_id"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para inicializar company settings se requieren business_name y tax_id.",
            )
        settings = CompanySetting(id=1, **data)
        db.add(settings)
    else:
        for field, value in data.items():
            setattr(settings, field, value)

    await _commit_or_conflict(db)
    await db.refresh(settings)
    return settings


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------
@router.get("/profiles", response_model=list[ProfileRead])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(Profile).order_by(Profile.full_name))
    return result.all()


@router.post("/profiles", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
async def create_profile(payload: ProfileCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(Profile, payload.id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un perfil para este usuario.",
        )

    profile = Profile(**payload.model_dump())
    db.add(profile)
    await _commit_or_conflict(db)
    await db.refresh(profile)
    return profile


@router.patch("/profiles/{profile_id}", response_model=ProfileRead)
async def update_profile(
    profile_id: UUID,
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_or_404(
        db, Profile, profile_id, detail="Perfil no encontrado."
    )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await _commit_or_conflict(db)
    await db.refresh(profile)
    return profile


# ---------------------------------------------------------------------------
# Product categories
# ---------------------------------------------------------------------------
@router.get("/categories", response_model=list[ProductCategoryRead])
async def list_categories(
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ProductCategory).order_by(ProductCategory.name)
    if is_active is not None:
        stmt = stmt.where(ProductCategory.is_active.is_(is_active))
    result = await db.scalars(stmt)
    return result.all()


@router.post(
    "/categories",
    response_model=ProductCategoryRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    payload: ProductCategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    duplicate = await db.scalar(
        select(ProductCategory).where(
            func.lower(ProductCategory.name) == payload.name.lower()
        )
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una categoría con ese nombre.",
        )

    category = ProductCategory(**payload.model_dump())
    db.add(category)
    await _commit_or_conflict(db)
    await db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=ProductCategoryRead)
async def update_category(
    category_id: int,
    payload: ProductCategoryUpdate,
    db: AsyncSession = Depends(get_db),
):
    category = await _get_or_404(
        db, ProductCategory, category_id, detail="Categoría no encontrada."
    )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    await _commit_or_conflict(db)
    await db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    category = await _get_or_404(
        db, ProductCategory, category_id, detail="Categoría no encontrada."
    )
    product_count = await db.scalar(
        select(func.count(Product.id)).where(Product.category_id == category_id)
    )
    if product_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar: la categoría tiene productos asociados.",
        )

    await db.delete(category)
    await _commit_or_conflict(db)
    return None


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
@router.get("/products", response_model=list[ProductRead])
async def list_products(
    category_id: int | None = None,
    is_active: bool | None = None,
    search: str | None = Query(default=None, max_length=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).order_by(Product.name, Product.code)
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if is_active is not None:
        stmt = stmt.where(Product.is_active.is_(is_active))
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            Product.name.ilike(pattern) | Product.code.ilike(pattern)
        )
    result = await db.scalars(stmt)
    return result.all()


@router.post(
    "/products",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    if payload.category_id is not None:
        await _get_or_404(
            db, ProductCategory, payload.category_id, detail="Categoría no encontrada."
        )

    duplicate = await db.scalar(
        select(Product).where(Product.code == payload.code)
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un producto con ese código.",
        )

    product = Product(**payload.model_dump())
    db.add(product)
    await _commit_or_conflict(db)
    await db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    product = await _get_or_404(
        db, Product, product_id, detail="Producto no encontrado."
    )
    data = payload.model_dump(exclude_unset=True)

    if data.get("category_id") is not None:
        await _get_or_404(
            db, ProductCategory, data["category_id"], detail="Categoría no encontrada."
        )

    for field, value in data.items():
        setattr(product, field, value)

    await _commit_or_conflict(db)
    await db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await _get_or_404(
        db, Product, product_id, detail="Producto no encontrado."
    )

    sale_item_count = await db.scalar(
        select(func.count(SaleItem.id)).where(SaleItem.product_id == product_id)
    )
    movement_count = await db.scalar(
        select(func.count(InventoryMovement.id)).where(
            InventoryMovement.product_id == product_id
        )
    )
    if sale_item_count or movement_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar el producto porque tiene movimientos o ventas asociadas.",
        )

    await db.delete(product)
    await _commit_or_conflict(db)
    return None


# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------
@router.get("/customers", response_model=list[CustomerRead])
async def list_customers(
    is_active: bool | None = None,
    search: str | None = Query(default=None, max_length=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Customer).order_by(Customer.name)
    if is_active is not None:
        stmt = stmt.where(Customer.is_active.is_(is_active))
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            Customer.name.ilike(pattern) | Customer.tax_id.ilike(pattern)
        )
    result = await db.scalars(stmt)
    return result.all()


@router.post(
    "/customers",
    response_model=CustomerRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_customer(payload: CustomerCreate, db: AsyncSession = Depends(get_db)):
    duplicate = await db.scalar(
        select(Customer).where(Customer.tax_id == payload.tax_id)
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un cliente con ese tax_id.",
        )

    customer = Customer(**payload.model_dump())
    db.add(customer)
    await _commit_or_conflict(db)
    await db.refresh(customer)
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerDetail)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    customer = await _get_or_404(
        db, Customer, customer_id, detail="Cliente no encontrado."
    )
    credit_account = await db.scalar(
        select(CreditAccount).where(CreditAccount.customer_id == customer.id)
    )
    return CustomerDetail(
        **CustomerRead.model_validate(customer).model_dump(),
        credit_account=credit_account,
    )


@router.patch("/customers/{customer_id}", response_model=CustomerRead)
async def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
):
    customer = await _get_or_404(
        db, Customer, customer_id, detail="Cliente no encontrado."
    )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)

    await _commit_or_conflict(db)
    await db.refresh(customer)
    return customer


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    customer = await _get_or_404(
        db, Customer, customer_id, detail="Cliente no encontrado."
    )

    sales_count = await db.scalar(
        select(func.count(Sale.id)).where(Sale.customer_id == customer_id)
    )
    credit_count = await db.scalar(
        select(func.count(CreditAccount.id)).where(
            CreditAccount.customer_id == customer_id
        )
    )
    if sales_count or credit_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar el cliente porque tiene ventas o cuenta de crédito.",
        )

    await db.delete(customer)
    await _commit_or_conflict(db)
    return None


# ---------------------------------------------------------------------------
# Credit accounts
# ---------------------------------------------------------------------------
@router.get("/credit-accounts", response_model=list[CreditAccountRead])
async def list_credit_accounts(
    credit_status: CreditAccountStatus | None = Query(default=None, alias="status"),
    customer_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CreditAccount).order_by(CreditAccount.id)
    if credit_status is not None:
        stmt = stmt.where(CreditAccount.status == credit_status)
    if customer_id is not None:
        stmt = stmt.where(CreditAccount.customer_id == customer_id)
    result = await db.scalars(stmt)
    return result.all()


@router.post(
    "/credit-accounts",
    response_model=CreditAccountRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_credit_account(
    payload: CreditAccountCreate,
    db: AsyncSession = Depends(get_db),
):
    await _get_or_404(
        db, Customer, payload.customer_id, detail="Cliente no encontrado."
    )
    existing = await db.scalar(
        select(CreditAccount).where(CreditAccount.customer_id == payload.customer_id)
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El cliente ya tiene una cuenta de crédito.",
        )

    account = CreditAccount(
        customer_id=payload.customer_id,
        credit_limit=payload.credit_limit,
        status=payload.status,
        balance=Decimal("0"),
    )
    db.add(account)
    await _commit_or_conflict(db)
    await db.refresh(account)
    return account


@router.patch("/credit-accounts/{credit_account_id}", response_model=CreditAccountRead)
async def update_credit_account(
    credit_account_id: int,
    payload: CreditAccountUpdate,
    db: AsyncSession = Depends(get_db),
):
    account = await _get_or_404(
        db, CreditAccount, credit_account_id, detail="Cuenta de crédito no encontrada."
    )
    data = payload.model_dump(exclude_unset=True)

    if (
        "credit_limit" in data
        and data["credit_limit"] is not None
        and data["credit_limit"] < account.balance
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nuevo límite de crédito no puede ser menor al saldo actual.",
        )

    for field, value in data.items():
        setattr(account, field, value)

    await _commit_or_conflict(db)
    await db.refresh(account)
    return account


@router.delete(
    "/credit-accounts/{credit_account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_credit_account(
    credit_account_id: int,
    db: AsyncSession = Depends(get_db),
):
    account = await _get_or_404(
        db, CreditAccount, credit_account_id, detail="Cuenta de crédito no encontrada."
    )

    sales_count = await db.scalar(
        select(func.count(Sale.id)).where(
            Sale.credit_account_id == credit_account_id
        )
    )
    payments_count = await db.scalar(
        select(func.count(Payment.id)).where(
            Payment.credit_account_id == credit_account_id
        )
    )
    if sales_count or payments_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar la cuenta porque tiene ventas o pagos asociados.",
        )

    await db.delete(account)
    await _commit_or_conflict(db)
    return None


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------
@router.get("/payments", response_model=list[PaymentRead])
async def list_payments(
    credit_account_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Payment).order_by(Payment.payment_date.desc(), Payment.id.desc())
    if credit_account_id is not None:
        stmt = stmt.where(Payment.credit_account_id == credit_account_id)
    if start_date is not None:
        stmt = stmt.where(Payment.payment_date >= start_date)
    if end_date is not None:
        stmt = stmt.where(Payment.payment_date <= end_date)
    result = await db.scalars(stmt)
    return result.all()


@router.post(
    "/payments",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_payment(payload: PaymentCreate, db: AsyncSession = Depends(get_db)):
    account = await _get_or_404(
        db, CreditAccount, payload.credit_account_id,
        detail="Cuenta de crédito no encontrada.",
    )

    if payload.amount > account.balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El pago supera el saldo pendiente ({account.balance}).",
        )

    payment = Payment(
        credit_account_id=account.id,
        amount=payload.amount,
        payment_type=payload.payment_type,
        payment_date=payload.payment_date or date.today(),
        reference=payload.reference,
        notes=payload.notes,
        registered_by=payload.registered_by,
    )
    db.add(payment)

    account.balance -= payment.amount
    if account.balance == 0:
        account.status = "PAID"
    elif account.status in ("PAID", "BLOCKED"):
        account.status = "ACTIVE"

    await _commit_or_conflict(db)
    await db.refresh(payment)
    return payment


# ---------------------------------------------------------------------------
# Inventory movements
# ---------------------------------------------------------------------------
@router.get("/inventory-movements", response_model=list[InventoryMovementRead])
async def list_inventory_movements(
    product_id: int | None = None,
    movement_type: MovementType | None = Query(default=None, alias="type"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(InventoryMovement)
        .options(selectinload(InventoryMovement.product))
        .order_by(InventoryMovement.created_at.desc(), InventoryMovement.id.desc())
    )
    if product_id is not None:
        stmt = stmt.where(InventoryMovement.product_id == product_id)
    if movement_type is not None:
        stmt = stmt.where(InventoryMovement.movement_type == movement_type)
    result = await db.scalars(stmt)
    return result.all()


@router.post(
    "/inventory-movements",
    response_model=InventoryMovementRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_inventory_movement(
    payload: InventoryMovementCreate,
    db: AsyncSession = Depends(get_db),
):
    product = await _get_or_404(
        db, Product, payload.product_id, detail="Producto no encontrado."
    )

    quantity = payload.quantity

    # Normaliza movimientos de salida/merma para que el DDL reciba signo negativo.
    if quantity > 0 and payload.movement_type in ("STOCK_OUT", "SPOILAGE"):
        quantity = -quantity

    if payload.movement_type == "STOCK_IN" and quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un movimiento STOCK_IN debe tener cantidad positiva.",
        )

    if quantity < 0 and product.stock + quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock insuficiente para realizar el movimiento.",
        )

    # === MAGIA: Actualizamos el stock y calculamos el stock_after ===
    product.stock = product.stock + quantity
    
    # Si es compra (STOCK_IN), actualizamos el costo promedio
    if payload.movement_type == "STOCK_IN" and payload.unit_cost is not None:
        if product.stock == quantity: # Si es el primer ingreso
            product.average_cost = Decimal(str(payload.unit_cost))
        else: # Promedio ponderado
            total_cost = (product.average_cost * (product.stock - quantity)) + (Decimal(str(payload.unit_cost)) * quantity)
            product.average_cost = total_cost / product.stock
    # =================================================================

    movement = InventoryMovement(
        product_id=product.id,
        sale_id=None,
        movement_type=payload.movement_type,
        quantity=quantity,
        unit_cost=(
            payload.unit_cost
            if payload.unit_cost is not None
            else product.average_cost
        ),
        stock_after=product.stock, # <--- AQUÍ ESTÁ EL ARREGLO
        reason=payload.reason,
        created_by=payload.created_by,
    )
    db.add(movement)
    await _commit_or_conflict(db)
    await db.refresh(movement)
    return movement


# ---------------------------------------------------------------------------
# Sales
# ---------------------------------------------------------------------------
@router.get("/sales", response_model=list[SaleSummary])
async def list_sales(
    sale_status: SaleStatus | None = Query(default=None, alias="status"),
    customer_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Sale).order_by(Sale.sale_date.desc(), Sale.id.desc())
    if sale_status is not None:
        stmt = stmt.where(Sale.status == sale_status)
    if customer_id is not None:
        stmt = stmt.where(Sale.customer_id == customer_id)
    if start_date is not None:
        stmt = stmt.where(Sale.sale_date >= start_date)
    if end_date is not None:
        stmt = stmt.where(Sale.sale_date <= end_date)
    result = await db.scalars(stmt)
    return result.all()


@router.post(
    "/sales",
    response_model=SaleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_sale(payload: SaleCreate, db: AsyncSession = Depends(get_db)):
    # Validación de cliente
    customer = None
    if payload.customer_id is not None:
        customer = await _get_or_404(
            db, Customer, payload.customer_id, detail="Cliente no encontrado."
        )

    # Validación de cuenta de crédito
    credit_account = None
    if payload.payment_type == "CREDIT":
        credit_account = await _get_or_404(
            db,
            CreditAccount,
            payload.credit_account_id,
            detail="Cuenta de crédito no encontrada.",
        )
        if credit_account.customer_id != payload.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cuenta de crédito no pertenece al cliente indicado.",
            )
        if credit_account.status == "BLOCKED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cuenta de crédito está bloqueada.",
            )
    elif payload.credit_account_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="credit_account_id solo se permite en ventas CREDIT.",
        )

    # Preparar líneas y validar existencias en memoria
    prepared_items = []
    sale_total = Decimal("0")
    available_stock: dict[int, Decimal] = {}

    for item in payload.items:
        product = await _get_or_404(
            db, Product, item.product_id, detail=f"Producto {item.product_id} no encontrado."
        )
        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El producto {product.code} está inactivo.",
            )

        unit = item.unit or product.sale_unit
        if unit != product.sale_unit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El producto {product.code} se vende en {product.sale_unit}, no en {unit}.",
            )

        unit_price = item.unit_price if item.unit_price is not None else product.price
        unit_cost = item.unit_cost if item.unit_cost is not None else product.average_cost
        line_total = item.quantity * unit_price
        available = available_stock.get(product.id, product.stock)

        if item.quantity > available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para el producto {product.code}.",
            )

        available_stock[product.id] = available - item.quantity
        prepared_items.append(
            {
                "product": product,
                "quantity": item.quantity,
                "unit": unit,
                "unit_price": unit_price,
                "unit_cost": unit_cost,
                "description": item.description or product.name,
                "line_total": line_total,
            }
        )
        sale_total += line_total

    # Validar límite de crédito después de calcular el total
    if credit_account is not None:
        if credit_account.balance + sale_total > credit_account.credit_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La venta supera el límite de crédito disponible.",
            )

    # Crear encabezado de venta
    sale = Sale(
        customer_id=payload.customer_id,
        cashier_id=payload.cashier_id,
        payment_type=payload.payment_type,
        credit_account_id=credit_account.id if credit_account else None,
        sale_date=payload.sale_date or date.today(),
        total=sale_total,
        status="COMPLETED",
        notes=payload.notes,
    )
    db.add(sale)
    await db.flush()

    # Crear ítems y movimientos de inventario (salida de mercancía)
    for idx, info in enumerate(prepared_items, start=1):
        product = info["product"]
        quantity = info["quantity"]

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            line_number=idx,
            description=info["description"],
            quantity=quantity,
            unit=info["unit"],
            unit_price=info["unit_price"],
            unit_cost=info["unit_cost"],
        )
        db.add(sale_item)

        # === FIX: Actualizar stock y calcular stock_after en la venta ===
        product.stock -= quantity
        # =================================================================

        inventory_movement = InventoryMovement(
            product_id=product.id,
            sale_id=sale.id,
            movement_type="STOCK_OUT",
            quantity=-quantity,
            unit_cost=info["unit_cost"],
            stock_after=product.stock, # <--- FIX APLICADO AQUÍ TAMBIÉN
            created_by=payload.cashier_id,
        )
        db.add(inventory_movement)

    # Si es crédito, aumentar el saldo deudor de la cuenta.
    if credit_account is not None:
        credit_account.balance += sale_total
        if credit_account.status == "PAID":
            credit_account.status = "ACTIVE"

    await _commit_or_conflict(db)

    sale = await db.scalar(
        select(Sale)
        .options(selectinload(Sale.items).selectinload(SaleItem.product))
        .where(Sale.id == sale.id)
    )
    if sale is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venta creada pero no pudo recuperarse.",
        )
    return sale


@router.get("/sales/{sale_id}", response_model=SaleRead)
async def get_sale(sale_id: int, db: AsyncSession = Depends(get_db)):
    sale = await db.scalar(
        select(Sale)
        .options(selectinload(Sale.items).selectinload(SaleItem.product))
        .where(Sale.id == sale_id)
    )
    if sale is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venta no encontrada.",
        )
    return sale


# ---------------------------------------------------------------------------
# Invoices
# ---------------------------------------------------------------------------
@router.get("/invoices", response_model=list[InvoiceRead])
async def list_invoices(
    invoice_status: InvoiceStatus | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Invoice).order_by(Invoice.id.desc())
    if invoice_status is not None:
        stmt = stmt.where(Invoice.status == invoice_status)
    result = await db.scalars(stmt)
    return result.all()


@router.post(
    "/invoices",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_invoice(payload: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    sale = await _get_or_404(db, Sale, payload.sale_id, detail="Venta no encontrada.")
    if sale.status != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden facturar ventas completadas.",
        )
    if sale.customer_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La venta no tiene cliente asociado para facturar.",
        )

    existing = await db.scalar(select(Invoice).where(Invoice.sale_id == sale.id))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La venta ya tiene una factura asociada.",
        )

    customer = await _get_or_404(
        db, Customer, sale.customer_id, detail="Cliente no encontrado."
    )

    invoice = Invoice(
        sale_id=sale.id,
        status="DRAFT",
        customer_name=customer.name,
        customer_tax_id=customer.tax_id,
        customer_address=customer.address,
        subtotal=sale.total,
        tax_amount=Decimal("0"),
        total=sale.total,
    )
    db.add(invoice)
    await _commit_or_conflict(db)
    await db.refresh(invoice)
    return invoice


@router.get("/invoices/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    invoice = await _get_or_404(
        db, Invoice, invoice_id, detail="Factura no encontrada."
    )
    return invoice


@router.post("/invoices/{invoice_id}/emit", response_model=InvoiceRead)
async def emit_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    invoice = await _get_or_404(
        db, Invoice, invoice_id, detail="Factura no encontrada."
    )
    if invoice.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Solo se puede emitir una factura en estado DRAFT.",
        )

    settings = await db.get(CompanySetting, 1)
    if settings is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Company settings no configurados para emitir facturas.",
        )

    invoice.status = "EMITTED"
    invoice.issue_date = date.today()
    invoice.invoice_number = (
        f"{settings.invoice_prefix}{settings.invoice_sequence:06d}"
    )
    settings.invoice_sequence += 1

    await _commit_or_conflict(db)
    await db.refresh(invoice)
    return invoice


@router.post("/invoices/{invoice_id}/cancel", response_model=InvoiceRead)
async def cancel_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    invoice = await _get_or_404(
        db, Invoice, invoice_id, detail="Factura no encontrada."
    )
    if invoice.status != "EMITTED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Solo se puede anular una factura EMITTED.",
        )

    invoice.status = "CANCELLED"
    await _commit_or_conflict(db)
    await db.refresh(invoice)
    return invoice