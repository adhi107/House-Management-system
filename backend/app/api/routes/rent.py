from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.rent import (
    RentInvoiceCreate, MonthlyRentGenerate, PaymentCreate,
    RentInvoiceResponse, PaymentResponse, RentSummaryResponse,
    PaymentClaimCreate, PaymentClaimVerify, InvoiceUpdate,
    PaymentReminderRequest
)
from app.database.connection import get_db
from app.api.dependencies.auth import get_current_user, require_owner, require_tenant
from app.utils.helpers import utcnow, serialize_doc
from app.models.enums import RentStatus, PaymentMethod, UserRole, NotificationType
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
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 100,
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
                if t:
                    data["tenant_name"] = t.get("full_name")
                    data["tenant_phone"] = t.get("phone")
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

        # Check search term filtering if provided
        if search:
            st = search.lower()
            tname = (data.get("tenant_name") or "").lower()
            unumber = (data.get("unit_number") or "").lower()
            invnum = (data.get("invoice_number") or "").lower()
            if st not in tname and st not in unumber and st not in invnum:
                continue

        result.append(data)

    # Summary
    summary_query = {k: v for k, v in query.items() if k != "status"}
    all_invoices = await db.rent_invoices.find(summary_query).to_list(None)
    expected = sum(i.get("total_amount", 0) for i in all_invoices)
    collected = sum(i.get("paid_amount", 0) for i in all_invoices)
    pending = sum(i.get("pending_amount", 0) for i in all_invoices if i.get("status") in [RentStatus.PENDING, RentStatus.PARTIALLY_PAID])
    overdue = sum(i.get("pending_amount", 0) for i in all_invoices if i.get("status") == RentStatus.OVERDUE)
    under_review_invoices = [i for i in all_invoices if i.get("status") == RentStatus.UNDER_REVIEW]
    under_review_amount = sum(i.get("pending_amount", 0) for i in under_review_invoices)
    under_review_count = len(under_review_invoices)

    summary = {
        "expected": expected,
        "collected": collected,
        "pending": pending,
        "overdue": overdue,
        "under_review": under_review_amount,
        "under_review_count": under_review_count,
        "collection_rate": round((collected / expected * 100) if expected else 0, 1),
    }

    return {"success": True, "data": result, "total": total, "summary": summary}


@router.get("/invoices/{invoice_id}", response_model=dict)
async def get_invoice(
    invoice_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        inv = await db.rent_invoices.find_one({"_id": ObjectId(invoice_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Scope validation
    if current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if inv.get("organization_id") != org_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant or inv.get("tenant_id") != str(tenant["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")

    data = serialize_doc(inv)
    data["id"] = str(data.pop("_id", data.get("id")))

    if inv.get("tenant_id"):
        t = await db.tenants.find_one({"_id": ObjectId(inv["tenant_id"])})
        if t:
            data["tenant_name"] = t.get("full_name")
            data["tenant_phone"] = t.get("phone")
            data["tenant_email"] = t.get("email")
    if inv.get("unit_id"):
        u = await db.units.find_one({"_id": ObjectId(inv["unit_id"])})
        data["unit_number"] = u.get("unit_number") if u else None
    if inv.get("property_id"):
        p = await db.properties.find_one({"_id": ObjectId(inv["property_id"])})
        data["property_name"] = p.get("name") if p else None
        data["property_address"] = p.get("address") if p else None

    payments_raw = await db.payments.find({"invoice_id": invoice_id}).sort("payment_date", -1).to_list(None)
    data["payments"] = [serialize_doc(p) for p in payments_raw]

    return {"success": True, "data": data}


@router.post("/invoices", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_single_invoice(
    data: RentInvoiceCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    # Check existing invoice for this unit + month
    existing = await db.rent_invoices.find_one({
        "organization_id": org_id,
        "unit_id": data.unit_id,
        "billing_month": data.billing_month,
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An invoice for this unit for {data.billing_month} already exists (Invoice #{existing.get('invoice_number')})"
        )

    # Sequence counter
    seq = await db.counters.find_one_and_update(
        {"_id": f"invoice_{org_id}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    invoice_number = f"INV-{(seq.get('seq', 0)):04d}"

    total_amount = max(0.0, data.rent_amount + data.maintenance_amount + data.utility_amount + data.other_charges - data.discount)

    invoice_doc = {
        "organization_id": org_id,
        "invoice_number": invoice_number,
        "property_id": data.property_id,
        "unit_id": data.unit_id,
        "tenant_id": data.tenant_id,
        "billing_month": data.billing_month,
        "rent_amount": data.rent_amount,
        "maintenance_amount": data.maintenance_amount,
        "utility_amount": data.utility_amount,
        "other_charges": data.other_charges,
        "discount": data.discount,
        "total_amount": total_amount,
        "paid_amount": 0,
        "pending_amount": total_amount,
        "status": RentStatus.PENDING,
        "due_date": data.due_date,
        "notes": data.notes,
        "payment_claimed": False,
        "claimed_payment": None,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    res = await db.rent_invoices.insert_one(invoice_doc)
    invoice_id = str(res.inserted_id)

    # Notify tenant
    if data.tenant_id:
        await db.notifications.insert_one({
            "organization_id": org_id,
            "tenant_id": data.tenant_id,
            "type": NotificationType.RENT_DUE,
            "title": f"Rent Invoice Generated ({data.billing_month})",
            "message": f"Your customized rent invoice of ₹{total_amount:,.0f} for {data.billing_month} has been generated. Due on {data.due_date}.",
            "read": False,
            "created_at": utcnow(),
        })

    invoice_doc["id"] = invoice_id
    invoice_doc.pop("_id", None)
    return {
        "success": True,
        "message": f"Invoice {invoice_number} created successfully!",
        "data": serialize_doc(invoice_doc),
    }


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
    if data.tenant_id:
        flt["tenant_id"] = data.tenant_id
    if data.unit_ids:
        flt["unit_id"] = {"$in": data.unit_ids}

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
        utility_amount = data.utility_surcharge or 0.0
        total_amount = rent_amount + maint_amount + utility_amount

        # Sequence counter
        seq = await db.counters.find_one_and_update(
            {"_id": f"invoice_{org_id}"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True,
        )
        invoice_number = f"INV-{(seq.get('seq', 0)):04d}"

        due_day = data.due_day or a.get("rent_due_day", 5)
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
            "utility_amount": utility_amount,
            "other_charges": 0,
            "discount": 0,
            "total_amount": total_amount,
            "paid_amount": 0,
            "pending_amount": total_amount,
            "status": RentStatus.PENDING,
            "due_date": due_date,
            "notes": data.notes,
            "payment_claimed": False,
            "claimed_payment": None,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        await db.rent_invoices.insert_one(invoice_doc)
        created_count += 1

        # Send notification to tenant if enabled
        if data.notify_tenants and tenant_id:
            await db.notifications.insert_one({
                "organization_id": org_id,
                "tenant_id": tenant_id,
                "type": NotificationType.RENT_DUE,
                "title": f"Rent Invoice Generated ({data.billing_month})",
                "message": f"Your rent invoice of ₹{total_amount:,.0f} for {data.billing_month} is now generated. Due on {due_date}.",
                "read": False,
                "created_at": utcnow(),
            })

    return {
        "success": True,
        "message": f"Generated {created_count} rent invoices ({skipped_count} already existed)",
        "data": {"created": created_count, "skipped": skipped_count}
    }


# ================================================
# TENANT: REPORT PAYMENT ("ALREADY PAID")
# ================================================

@router.post("/invoices/{invoice_id}/report-payment", response_model=dict)
async def report_tenant_payment(
    invoice_id: str,
    data: PaymentClaimCreate,
    current_tenant=Depends(require_tenant),
    db=Depends(get_db),
):
    tenant_id = current_tenant["tenant_id"]

    try:
        inv = await db.rent_invoices.find_one({"_id": ObjectId(invoice_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if inv.get("tenant_id") != tenant_id:
        raise HTTPException(status_code=403, detail="You can only report payment for your own invoices")

    claim_record = {
        "amount": data.amount,
        "payment_method": data.payment_method,
        "transaction_reference": data.transaction_reference,
        "payment_date": data.payment_date or utcnow().strftime("%Y-%m-%d"),
        "proof_url": data.proof_url,
        "notes": data.notes,
        "reported_at": utcnow().isoformat(),
        "status": "pending_verification",
    }

    await db.rent_invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": {
            "status": RentStatus.UNDER_REVIEW,
            "payment_claimed": True,
            "claimed_payment": claim_record,
            "updated_at": utcnow(),
        }}
    )

    # Notify Owner organization
    tenant_name = current_tenant.get("full_name") or "Resident"
    org_id = inv.get("organization_id")
    if org_id:
        await db.notifications.insert_one({
            "organization_id": org_id,
            "type": "payment_claimed",
            "title": f"Payment Claimed: ₹{data.amount:,.0f} by {tenant_name}",
            "message": f"Tenant {tenant_name} reported a payment of ₹{data.amount:,.0f} ({data.payment_method.upper()} Ref: {data.transaction_reference or 'N/A'}) for {inv.get('billing_month')} rent. Please review and verify.",
            "read": False,
            "created_at": utcnow(),
        })

    return {
        "success": True,
        "message": "Payment reported successfully. It will be verified by the owner shortly.",
        "data": claim_record,
    }


# ================================================
# OWNER: VERIFY PAYMENT CLAIM
# ================================================

@router.post("/invoices/{invoice_id}/verify-payment", response_model=dict)
async def verify_payment_claim(
    invoice_id: str,
    data: PaymentClaimVerify,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    try:
        inv = await db.rent_invoices.find_one({"_id": ObjectId(invoice_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found in your organization")

    claimed = inv.get("claimed_payment") or {}

    if not data.approved:
        # Rejection flow
        rejection_reason = data.rejection_reason or "Payment could not be verified in bank records"
        new_status = RentStatus.OVERDUE if inv.get("status") == RentStatus.OVERDUE else RentStatus.PENDING
        await db.rent_invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            {"$set": {
                "status": new_status,
                "payment_claimed": False,
                "claimed_payment": {
                    **claimed,
                    "status": "rejected",
                    "rejection_reason": rejection_reason,
                    "rejected_at": utcnow().isoformat(),
                },
                "updated_at": utcnow(),
            }}
        )

        if inv.get("tenant_id"):
            await db.notifications.insert_one({
                "organization_id": org_id,
                "tenant_id": inv["tenant_id"],
                "type": "payment_rejected",
                "title": "Payment Verification Update",
                "message": f"Your payment claim for {inv['billing_month']} rent was not verified: {rejection_reason}. Please recheck or contact the manager.",
                "read": False,
                "created_at": utcnow(),
            })

        return {
            "success": True,
            "message": "Payment claim marked as rejected.",
            "data": {"status": new_status, "approved": False}
        }

    # Approval flow: Record official payment
    amount_to_record = data.verified_amount or claimed.get("amount") or inv.get("pending_amount", 0)
    method = claimed.get("payment_method") or PaymentMethod.UPI
    ref = claimed.get("transaction_reference")
    pdate = claimed.get("payment_date") or utcnow().strftime("%Y-%m-%d")

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
        "invoice_id": invoice_id,
        "tenant_id": inv["tenant_id"],
        "unit_id": inv["unit_id"],
        "property_id": inv["property_id"],
        "billing_month": inv["billing_month"],
        "amount": amount_to_record,
        "payment_method": method,
        "transaction_reference": ref,
        "payment_date": pdate,
        "notes": data.notes or f"Verified tenant claim (Ref: {ref or 'N/A'})",
        "recorded_by": current_owner["id"],
        "created_at": utcnow(),
    }
    pay_res = await db.payments.insert_one(payment_doc)

    new_paid = inv.get("paid_amount", 0) + amount_to_record
    new_pending = max(0, inv.get("total_amount", 0) - new_paid)
    new_status = RentStatus.PAID if new_pending == 0 else RentStatus.PARTIALLY_PAID

    await db.rent_invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": {
            "paid_amount": new_paid,
            "pending_amount": new_pending,
            "status": new_status,
            "payment_claimed": False,
            "claimed_payment": {
                **claimed,
                "status": "approved",
                "verified_at": utcnow().isoformat(),
                "receipt_number": receipt_number,
            },
            "updated_at": utcnow(),
        }}
    )

    if inv.get("tenant_id"):
        await db.notifications.insert_one({
            "organization_id": org_id,
            "tenant_id": inv["tenant_id"],
            "type": NotificationType.PAYMENT_RECEIVED,
            "title": "Payment Verified & Receipt Generated",
            "message": f"Your payment of ₹{amount_to_record:,.0f} for {inv['billing_month']} rent has been verified! Receipt #{receipt_number} is ready.",
            "read": False,
            "created_at": utcnow(),
        })

    return {
        "success": True,
        "message": f"Payment verified successfully! Receipt #{receipt_number} issued.",
        "data": {
            "payment_id": str(pay_res.inserted_id),
            "receipt_number": receipt_number,
            "status": new_status,
            "paid_amount": new_paid,
            "pending_amount": new_pending,
        }
    }


# ================================================
# OWNER: UPDATE INVOICE CHARGES / ADJUSTMENTS
# ================================================

@router.patch("/invoices/{invoice_id}", response_model=dict)
async def update_invoice(
    invoice_id: str,
    data: InvoiceUpdate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    try:
        inv = await db.rent_invoices.find_one({"_id": ObjectId(invoice_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    updates = {}
    if data.rent_amount is not None:
        updates["rent_amount"] = data.rent_amount
    if data.maintenance_amount is not None:
        updates["maintenance_amount"] = data.maintenance_amount
    if data.utility_amount is not None:
        updates["utility_amount"] = data.utility_amount
    if data.other_charges is not None:
        updates["other_charges"] = data.other_charges
    if data.discount is not None:
        updates["discount"] = data.discount
    if data.due_date is not None:
        updates["due_date"] = data.due_date
    if data.notes is not None:
        updates["notes"] = data.notes
    if data.status is not None:
        updates["status"] = data.status

    # Recalculate total & pending amount if charges changed
    rent_val = updates.get("rent_amount", inv.get("rent_amount", 0))
    maint_val = updates.get("maintenance_amount", inv.get("maintenance_amount", 0))
    util_val = updates.get("utility_amount", inv.get("utility_amount", 0))
    other_val = updates.get("other_charges", inv.get("other_charges", 0))
    disc_val = updates.get("discount", inv.get("discount", 0))

    new_total = max(0, rent_val + maint_val + util_val + other_val - disc_val)
    paid_so_far = inv.get("paid_amount", 0)
    new_pending = max(0, new_total - paid_so_far)

    updates["total_amount"] = new_total
    updates["pending_amount"] = new_pending
    if "status" not in updates:
        if new_pending == 0 and paid_so_far > 0:
            updates["status"] = RentStatus.PAID
        elif paid_so_far > 0:
            updates["status"] = RentStatus.PARTIALLY_PAID

    updates["updated_at"] = utcnow()

    await db.rent_invoices.update_one({"_id": ObjectId(invoice_id)}, {"$set": updates})

    return {"success": True, "message": "Invoice updated successfully", "data": updates}


# ================================================
# OWNER: DELETE INVOICE
# ================================================

@router.delete("/invoices/{invoice_id}", response_model=dict)
async def delete_invoice(
    invoice_id: str,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    try:
        inv = await db.rent_invoices.find_one({"_id": ObjectId(invoice_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if inv.get("paid_amount", 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete invoice with recorded payments")

    await db.rent_invoices.delete_one({"_id": ObjectId(invoice_id)})
    return {"success": True, "message": "Invoice deleted"}


# ================================================
# OWNER: SEND PAYMENT REMINDER
# ================================================

@router.post("/remind", response_model=dict)
async def send_rent_reminders(
    data: PaymentReminderRequest,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    flt = {"organization_id": org_id}

    if data.invoice_ids:
        flt["_id"] = {"$in": [ObjectId(i) for i in data.invoice_ids]}
    elif data.all_overdue:
        flt["status"] = RentStatus.OVERDUE
    else:
        flt["status"] = {"$in": [RentStatus.PENDING, RentStatus.OVERDUE, RentStatus.PARTIALLY_PAID]}

    if data.property_id:
        flt["property_id"] = data.property_id

    invoices = await db.rent_invoices.find(flt).to_list(None)
    sent_count = 0

    for inv in invoices:
        tid = inv.get("tenant_id")
        if not tid:
            continue

        msg = data.custom_message or f"Friendly reminder: Rent payment of ₹{inv.get('pending_amount', 0):,.0f} for {inv.get('billing_month')} is pending (Due: {inv.get('due_date')}). Please clear at your earliest convenience."

        await db.notifications.insert_one({
            "organization_id": org_id,
            "tenant_id": tid,
            "type": NotificationType.RENT_OVERDUE if inv.get("status") == RentStatus.OVERDUE else NotificationType.RENT_DUE,
            "title": "Rent Payment Reminder",
            "message": msg,
            "read": False,
            "created_at": utcnow(),
        })
        sent_count += 1

    return {
        "success": True,
        "message": f"Sent payment reminders to {sent_count} tenant(s).",
        "data": {"reminders_sent": sent_count}
    }


# ================================================
# PAYMENTS: RECORD & LIST
# ================================================

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

    new_paid = invoice.get("paid_amount", 0) + data.amount
    new_pending = max(0, invoice.get("total_amount", 0) - new_paid)
    new_status = RentStatus.PAID if new_pending == 0 else RentStatus.PARTIALLY_PAID

    await db.rent_invoices.update_one(
        {"_id": ObjectId(data.invoice_id)},
        {"$set": {
            "paid_amount": new_paid,
            "pending_amount": new_pending,
            "status": new_status,
            "payment_claimed": False,
            "updated_at": utcnow(),
        }}
    )

    # Trigger notification for tenant
    if invoice.get("tenant_id"):
        await db.notifications.insert_one({
            "organization_id": org_id,
            "tenant_id": invoice["tenant_id"],
            "type": NotificationType.PAYMENT_RECEIVED,
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
    billing_month: Optional[str] = None,
    payment_method: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 100,
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

    if billing_month:
        query["billing_month"] = billing_month
    if payment_method:
        query["payment_method"] = payment_method

    total = await db.payments.count_documents(query)
    payments_raw = await db.payments.find(query).sort("payment_date", -1).skip((page - 1) * per_page).limit(per_page).to_list(None)

    result = []
    for p in payments_raw:
        data = serialize_doc(p)
        data["id"] = str(data.pop("_id", data.get("id")))
        if p.get("tenant_id"):
            try:
                t = await db.tenants.find_one({"_id": ObjectId(p["tenant_id"])})
                data["tenant_name"] = t.get("full_name") if t else None
                data["tenant_phone"] = t.get("phone") if t else None
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

        if search:
            st = search.lower()
            tname = (data.get("tenant_name") or "").lower()
            recnum = (data.get("receipt_number") or "").lower()
            unumber = (data.get("unit_number") or "").lower()
            txref = (data.get("transaction_reference") or "").lower()
            if st not in tname and st not in recnum and st not in unumber and st not in txref:
                continue

        result.append(data)

    return {"success": True, "data": result, "total": total}
