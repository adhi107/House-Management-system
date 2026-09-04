from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.rent import (
    MonthlyRentGenerate, PaymentCreate,
    RentInvoiceResponse, PaymentResponse, RentSummaryResponse
)
from app.database.connection import get_db
from app.api.dependencies.auth import get_current_user, require_owner
from app.utils.helpers import utcnow, serialize_doc
from app.models.enums import RentStatus, PaymentMethod, UserRole
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List

router = APIRouter(prefix="/rent", tags=["Rent"])


@router.get("/invoices", response_model=dict)
async def list_invoices(
    property_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    billing_month: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    query = {}
    if current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if not org_id:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            org_id = str(org["_id"]) if org else None
        query["organization_id"] = org_id
        if property_id:
            query["property_id"] = property_id
        if tenant_id:
            query["tenant_id"] = tenant_id
    elif current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant profile not found")
        query["tenant_id"] = str(tenant["_id"])
    elif current_user["role"] == UserRole.SUPER_ADMIN:
        if property_id:
            query["property_id"] = property_id
        if tenant_id:
            query["tenant_id"] = tenant_id

    if billing_month:
        query["billing_month"] = billing_month
    if status:
        query["status"] = status

    total = await db.rent_invoices.count_documents(query)
    invoices_raw = await db.rent_invoices.find(query).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page).to_list(None)

    result = []
    for inv in invoices_raw:
        data = serialize_doc(inv)
        inv_id = str(data.pop("_id", data.get("id")))
        data["id"] = inv_id

        if inv.get("tenant_id"):
            try:
                t = await db.tenants.find_one({"_id": ObjectId(inv["tenant_id"])})
                data["tenant_name"] = t.get("full_name") if t else None
            except Exception:
                pass
        if inv.get("unit_id"):
            try:
                u = await db.units.find_one({"_id": ObjectId(inv["unit_id"])})
                data["unit_number"] = u.get("unit_number") if u else None
            except Exception:
                pass
        if inv.get("property_id"):
            try:
                p = await db.properties.find_one({"_id": ObjectId(inv["property_id"])})
                data["property_name"] = p.get("name") if p else None
            except Exception:
                pass

        # Payments attached to this invoice
        payments_raw = await db.payments.find({"invoice_id": inv_id}).sort("payment_date", -1).to_list(None)
        data["payments"] = [serialize_doc(p) for p in payments_raw]

        result.append(data)

    # Summary
    all_invoices = await db.rent_invoices.find(query).to_list(None)
    expected = sum(i.get("total_amount", 0) for i in all_invoices)
    collected = sum(i.get("paid_amount", 0) for i in all_invoices)
    pending = sum(i.get("pending_amount", 0) for i in all_invoices if i.get("status") in ["pending", "partially_paid"])
    overdue = sum(i.get("pending_amount", 0) for i in all_invoices if i.get("status") == "overdue")

    summary = {
        "expected": expected,
        "collected": collected,
        "pending": pending,
        "overdue": overdue,
        "collection_rate": round((collected / expected * 100) if expected else 0, 1),
    }

    return {"success": True, "data": result, "total": total, "summary": summary}


@router.post("/generate", response_model=dict)
async def generate_monthly_rent(
    data: MonthlyRentGenerate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    # Active tenant assignments in this organization
    flt = {"organization_id": org_id, "is_active": True}
    if data.property_id:
        flt["property_id"] = data.property_id

    assignments = await db.tenant_assignments.find(flt).to_list(None)

    created_count = 0
    skipped_count = 0

    for a in assignments:
        unit_id = a["unit_id"]
        tenant_id = a["tenant_id"]
        prop_id = a["property_id"]

        # Check existing invoice for this unit + month
        existing = await db.rent_invoices.find_one({
            "organization_id": org_id,
            "unit_id": unit_id,
            "billing_month": data.billing_month,
        })
        if existing:
            skipped_count += 1
            continue

        unit = await db.units.find_one({"_id": ObjectId(unit_id)})
        rent_amount = a.get("monthly_rent") or (unit.get("monthly_rent") if unit else 0)
        maint_amount = a.get("maintenance_charge") or (unit.get("maintenance_charge") if unit else 0)
        total_amount = rent_amount + maint_amount

        # Get sequence counter for invoice
        seq = await db.counters.find_one_and_update(
            {"_id": f"invoice_{org_id}"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True,
        )
        invoice_number = f"INV-{(seq.get('seq', 0)):04d}"

        due_day = a.get("rent_due_day", 5)
        due_date = f"{data.billing_month}-{due_day:02d}"

        invoice_doc = {
            "organization_id": org_id,
            "invoice_number": invoice_number,
            "property_id": prop_id,
            "unit_id": unit_id,
            "tenant_id": tenant_id,
            "billing_month": data.billing_month,
            "rent_amount": rent_amount,
            "maintenance_amount": maint_amount,
            "utility_amount": 0,
            "other_charges": 0,
            "discount": 0,
            "total_amount": total_amount,
            "paid_amount": 0,
            "pending_amount": total_amount,
            "status": RentStatus.PENDING,
            "due_date": due_date,
            "notes": None,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        await db.rent_invoices.insert_one(invoice_doc)
        created_count += 1

    return {
        "success": True,
        "message": f"Generated {created_count} rent invoices ({skipped_count} already existed)",
        "data": {"created": created_count, "skipped": skipped_count}
    }


@router.post("/payments", response_model=dict, status_code=status.HTTP_201_CREATED)
async def record_payment(
    data: PaymentCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    try:
        invoice = await db.rent_invoices.find_one({"_id": ObjectId(data.invoice_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found in your organization")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")

    if data.amount > (invoice.get("pending_amount", 0) + 0.01):
        raise HTTPException(status_code=400, detail=f"Amount exceeds remaining balance of ₹{invoice.get('pending_amount')}")

    # Generate receipt number
    seq = await db.counters.find_one_and_update(
        {"_id": f"payment_{org_id}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    receipt_number = f"REC-{(seq.get('seq', 0)):04d}"

    payment_doc = {
        "organization_id": org_id,
        "receipt_number": receipt_number,
        "invoice_id": data.invoice_id,
        "tenant_id": invoice["tenant_id"],
        "unit_id": invoice["unit_id"],
        "property_id": invoice["property_id"],
        "billing_month": invoice["billing_month"],
        "amount": data.amount,
        "payment_method": data.payment_method,
        "transaction_reference": data.transaction_reference,
        "payment_date": data.payment_date or utcnow().strftime("%Y-%m-%d"),
        "notes": data.notes,
        "recorded_by": current_owner["id"],
        "created_at": utcnow(),
    }
    result = await db.payments.insert_one(payment_doc)

    # Update invoice paid & pending amounts
    new_paid = invoice.get("paid_amount", 0) + data.amount
    new_pending = max(0, invoice.get("total_amount", 0) - new_paid)
    new_status = RentStatus.PAID if new_pending == 0 else RentStatus.PARTIALLY_PAID

    await db.rent_invoices.update_one(
        {"_id": ObjectId(data.invoice_id)},
        {"$set": {
            "paid_amount": new_paid,
            "pending_amount": new_pending,
            "status": new_status,
            "updated_at": utcnow(),
        }}
    )

    # Trigger notification for tenant
    if invoice.get("tenant_id"):
        await db.notifications.insert_one({
            "organization_id": org_id,
            "tenant_id": invoice["tenant_id"],
            "type": "payment_received",
            "title": "Payment Confirmed",
            "message": f"Payment of ₹{data.amount:,.0f} received for {invoice['billing_month']} rent (Receipt #{receipt_number}).",
            "read": False,
            "created_at": utcnow(),
        })

    return {
        "success": True,
        "message": "Payment recorded successfully",
        "data": {
            "id": str(result.inserted_id),
            "receipt_number": receipt_number,
            "status": new_status,
            "pending_amount": new_pending,
        }
    }


@router.get("/payments", response_model=dict)
async def list_payments(
    property_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    query = {}
    if current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if not org_id:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            org_id = str(org["_id"]) if org else None
        query["organization_id"] = org_id
        if property_id:
            query["property_id"] = property_id
        if tenant_id:
            query["tenant_id"] = tenant_id
    elif current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant profile not found")
        query["tenant_id"] = str(tenant["_id"])

    total = await db.payments.count_documents(query)
    payments_raw = await db.payments.find(query).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page).to_list(None)

    result = []
    for p in payments_raw:
        data = serialize_doc(p)
        data["id"] = data.pop("_id", data.get("id"))
        if p.get("tenant_id"):
            try:
                t = await db.tenants.find_one({"_id": ObjectId(p["tenant_id"])})
                data["tenant_name"] = t.get("full_name") if t else None
            except Exception:
                pass
        if p.get("unit_id"):
            try:
                u = await db.units.find_one({"_id": ObjectId(p["unit_id"])})
                data["unit_number"] = u.get("unit_number") if u else None
            except Exception:
                pass
        if p.get("property_id"):
            try:
                prop = await db.properties.find_one({"_id": ObjectId(p["property_id"])})
                data["property_name"] = prop.get("name") if prop else None
            except Exception:
                pass
        result.append(data)

    return {"success": True, "data": result, "total": total}
