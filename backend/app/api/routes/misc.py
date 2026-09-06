from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from app.database.connection import get_db
from app.api.dependencies.auth import get_current_user, require_owner, require_tenant
from app.utils.helpers import utcnow, serialize_doc
from app.config.settings import settings
from app.models.enums import UserRole
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import aiofiles

# ================================================
# DOCUMENTS
# ================================================

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/jpg", "image/png",
                 "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
MAX_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.get("")
async def list_documents(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    flt = {}
    if current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if not org_id:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            org_id = str(org["_id"]) if org else None
        flt["organization_id"] = org_id
        if entity_type:
            flt["entity_type"] = entity_type
        if entity_id:
            flt["entity_id"] = entity_id
    elif current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        t_id = str(tenant["_id"])
        flt["$or"] = [
            {"entity_type": "tenant", "entity_id": t_id},
            {"entity_type": "agreement", "tenant_id": t_id},
            {"entity_type": "payment", "tenant_id": t_id},
        ]

    docs = await db.documents.find(flt).sort("created_at", -1).to_list(100)
    result = [_serialize_doc_item(d) for d in docs]
    return {"success": True, "data": result}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    name: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    ext = os.path.splitext(file.filename or "")[1]
    filename = f"{uuid.uuid4()}{ext}"
    upload_dir = os.path.join(settings.UPLOAD_DIR, entity_type)
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    doc = {
        "name": name or file.filename,
        "filename": filename,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "organization_id": current_user.get("organization_id"),
        "content_type": file.content_type,
        "size": len(content),
        "uploaded_by": current_user["id"],
        "created_at": utcnow(),
    }
    result = await db.documents.insert_one(doc)

    return {
        "success": True,
        "message": "Document uploaded",
        "data": {
            "id": str(result.inserted_id),
            "filename": filename,
            "url": f"/uploads/{entity_type}/{filename}",
        }
    }


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user["role"] == UserRole.OWNER and doc.get("organization_id") != current_user.get("organization_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    upload_dir = os.path.join(settings.UPLOAD_DIR, doc["entity_type"])
    filepath = os.path.join(upload_dir, doc["filename"])
    if os.path.exists(filepath):
        os.remove(filepath)

    await db.documents.delete_one({"_id": ObjectId(doc_id)})
    return {"success": True, "message": "Document deleted"}


def _serialize_doc_item(d: dict) -> dict:
    data = serialize_doc(d)
    data["id"] = data.pop("_id", data.get("id"))
    return data


# ================================================
# EXPENSES
# ================================================

expense_router = APIRouter(prefix="/expenses", tags=["Expenses"])


class ExpenseCreate(BaseModel):
    property_id: str
    unit_id: Optional[str] = None
    category: str
    description: str
    amount: float
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    payment_method: Optional[str] = None
    date: str
    receipt: Optional[str] = None
    notes: Optional[str] = None


@expense_router.get("")
async def list_expenses(
    property_id: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    flt = {"organization_id": org_id}
    if property_id:
        flt["property_id"] = property_id
    if category:
        flt["category"] = category

    total = await db.expenses.count_documents(flt)
    expenses_raw = await db.expenses.find(flt).sort("date", -1).skip((page - 1) * per_page).limit(per_page).to_list(None)

    result = []
    for e in expenses_raw:
        data = serialize_doc(e)
        data["id"] = data.pop("_id", data.get("id"))
        result.append(data)

    all_exp = await db.expenses.find(flt).to_list(None)
    total_amount = sum(e.get("amount", 0) for e in all_exp)

    return {"success": True, "data": result, "total": total, "total_amount": total_amount}


@expense_router.post("")
async def create_expense(
    data: ExpenseCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        prop = await db.properties.find_one({"_id": ObjectId(data.property_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found in your organization")

    doc = {
        **data.model_dump(),
        "organization_id": org_id,
        "owner_id": current_owner["id"],
        "created_at": utcnow()
    }
    result = await db.expenses.insert_one(doc)
    return {"success": True, "message": "Expense recorded", "data": {"id": str(result.inserted_id)}}


@expense_router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        expense = await db.expenses.find_one({"_id": ObjectId(expense_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Expense not found")

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found in your organization")

    await db.expenses.delete_one({"_id": ObjectId(expense_id), "organization_id": org_id})
    return {"success": True, "message": "Expense deleted"}


# ================================================
# NOTIFICATIONS
# ================================================

notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _get_notification_filter(current_user: dict, org_id: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
    if current_user["role"] == UserRole.TENANT:
        if tenant_id:
            return {"$or": [{"tenant_id": tenant_id}, {"user_id": current_user["id"]}]}
        return {"user_id": current_user["id"]}
    elif current_user["role"] == UserRole.OWNER:
        flt_or = [{"user_id": current_user["id"]}]
        if org_id:
            flt_or.append({"organization_id": org_id, "tenant_id": None})
            flt_or.append({"organization_id": org_id, "tenant_id": {"$exists": False}})
        return {"$or": flt_or}
    else:
        return {
            "$or": [
                {"user_id": current_user["id"]},
                {"target": "super_admin"},
                {"type": "system_alert"},
            ]
        }


@notification_router.get("")
async def list_notifications(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    tenant_id = None
    org_id = None
    if current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if tenant:
            tenant_id = str(tenant["_id"])
    elif current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if not org_id:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            org_id = str(org["_id"]) if org else None

    flt = _get_notification_filter(current_user, org_id, tenant_id)

    notifications = await db.notifications.find(flt).sort("created_at", -1).limit(60).to_list(None)
    result = []
    for n in notifications:
        data = serialize_doc(n)
        data["id"] = data.pop("_id", data.get("id"))
        result.append(data)

    unread = await db.notifications.count_documents({**flt, "read": False})
    return {"success": True, "data": result, "unread_count": unread}


@notification_router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        await db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True}}
        )
    except Exception:
        pass
    return {"success": True}


@notification_router.put("/mark-all-read")
async def mark_all_read(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    tenant_id = None
    org_id = None
    if current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if tenant:
            tenant_id = str(tenant["_id"])
    elif current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if not org_id:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            org_id = str(org["_id"]) if org else None

    flt = _get_notification_filter(current_user, org_id, tenant_id)
    await db.notifications.update_many(flt, {"$set": {"read": True}})
    return {"success": True}


@notification_router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        await db.notifications.delete_one({"_id": ObjectId(notification_id)})
    except Exception:
        pass
    return {"success": True, "message": "Notification dismissed"}


@notification_router.delete("")
async def clear_all_notifications(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    tenant_id = None
    org_id = None
    if current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if tenant:
            tenant_id = str(tenant["_id"])
    elif current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if not org_id:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            org_id = str(org["_id"]) if org else None

    flt = _get_notification_filter(current_user, org_id, tenant_id)
    await db.notifications.delete_many(flt)
    return {"success": True, "message": "All notifications cleared"}


# ================================================
# AGREEMENTS
# ================================================

agreement_router = APIRouter(prefix="/agreements", tags=["Agreements"])


class AgreementCreate(BaseModel):
    tenant_id: str
    unit_id: str
    property_id: str
    start_date: str
    end_date: str
    monthly_rent: float
    security_deposit: float
    notice_period_days: int = 30
    document_path: Optional[str] = None
    notes: Optional[str] = None


@agreement_router.get("")
async def list_agreements(
    property_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    flt = {}
    if current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if not org_id:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            org_id = str(org["_id"]) if org else None
        flt["organization_id"] = org_id
        if property_id:
            flt["property_id"] = property_id
        if tenant_id:
            flt["tenant_id"] = tenant_id
    elif current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        flt["tenant_id"] = str(tenant["_id"])

    agreements = await db.rental_agreements.find(flt).sort("created_at", -1).to_list(None)
    result = []
    for a in agreements:
        data = serialize_doc(a)
        data["id"] = data.pop("_id", data.get("id"))
        if data.get("tenant_id"):
            try:
                t = await db.tenants.find_one({"_id": ObjectId(data["tenant_id"])})
                data["tenant_name"] = t.get("full_name") if t else None
            except Exception:
                pass
        if data.get("unit_id"):
            try:
                u = await db.units.find_one({"_id": ObjectId(data["unit_id"])})
                data["unit_number"] = u.get("unit_number") if u else None
            except Exception:
                pass
        if data.get("property_id"):
            try:
                p = await db.properties.find_one({"_id": ObjectId(data["property_id"])})
                data["property_name"] = p.get("name") if p else None
            except Exception:
                pass
        result.append(data)
    return {"success": True, "data": result}


@agreement_router.post("")
async def create_agreement(
    data: AgreementCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        tenant = await db.tenants.find_one({"_id": ObjectId(data.tenant_id), "organization_id": org_id})
        prop = await db.properties.find_one({"_id": ObjectId(data.property_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Tenant or property not found")

    if not tenant or not prop:
        raise HTTPException(status_code=404, detail="Tenant or property not found in your organization")

    seq = await db.counters.find_one_and_update(
        {"_id": f"agreement_{org_id}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    agreement_number = f"AGR-{(seq.get('seq', 0) + 1):04d}"

    doc = {
        "organization_id": org_id,
        "agreement_number": agreement_number,
        **data.model_dump(),
        "status": "active",
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = await db.rental_agreements.insert_one(doc)
    return {
        "success": True,
        "message": "Agreement created",
        "data": {"id": str(result.inserted_id), "agreement_number": agreement_number}
    }


# ================================================
# ANNOUNCEMENTS
# ================================================

announcement_router = APIRouter(prefix="/announcements", tags=["Announcements"])


class AnnouncementCreate(BaseModel):
    title: str
    message: str
    target: str = "all"  # all, building, tenant
    property_id: Optional[str] = None
    tenant_id: Optional[str] = None


@announcement_router.post("")
async def create_announcement(
    data: AnnouncementCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    doc = {
        **data.model_dump(),
        "organization_id": org_id,
        "owner_id": current_owner["id"],
        "created_at": utcnow(),
    }
    result = await db.announcements.insert_one(doc)

    # Fan out notifications within this organization
    if data.target == "all":
        tenants = await db.tenants.find({"organization_id": org_id}).to_list(None)
        for t in tenants:
            await db.notifications.insert_one({
                "organization_id": org_id,
                "tenant_id": str(t["_id"]),
                "type": "announcement",
                "title": data.title,
                "message": data.message,
                "read": False,
                "created_at": utcnow(),
            })
    elif data.target == "building" and data.property_id:
        assignments = await db.tenant_assignments.find({
            "organization_id": org_id,
            "property_id": data.property_id,
            "is_active": True
        }).to_list(None)
        for a in assignments:
            await db.notifications.insert_one({
                "organization_id": org_id,
                "tenant_id": a["tenant_id"],
                "type": "announcement",
                "title": data.title,
                "message": data.message,
                "read": False,
                "created_at": utcnow(),
            })
    elif data.target == "tenant" and data.tenant_id:
        await db.notifications.insert_one({
            "organization_id": org_id,
            "tenant_id": data.tenant_id,
            "type": "announcement",
            "title": data.title,
            "message": data.message,
            "read": False,
            "created_at": utcnow(),
        })

    return {"success": True, "message": "Announcement sent", "data": {"id": str(result.inserted_id)}}


@announcement_router.get("")
async def list_announcements(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        docs = await db.announcements.find({"organization_id": org_id}).sort("created_at", -1).to_list(50)
    else:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant:
            return {"success": True, "data": []}
        docs = await db.notifications.find({"tenant_id": str(tenant["_id"]), "type": "announcement"}).sort("created_at", -1).to_list(50)

    result = []
    for d in docs:
        data = serialize_doc(d)
        data["id"] = data.pop("_id", data.get("id"))
        result.append(data)
    return {"success": True, "data": result}


# ================================================
# TENANT DASHBOARD
# ================================================

tenant_dashboard_router = APIRouter(prefix="/tenant-dashboard", tags=["Tenant Dashboard"])


@tenant_dashboard_router.get("")
async def tenant_dashboard(
    current_user=Depends(require_tenant),
    db=Depends(get_db),
):
    tenant_id = current_user["tenant_id"]
    tenant = await db.tenants.find_one({"_id": ObjectId(tenant_id)})

    assignment = await db.tenant_assignments.find_one({"tenant_id": tenant_id, "is_active": True})

    unit_data = None
    prop_data = None
    current_invoice = None

    if assignment:
        unit = await db.units.find_one({"_id": ObjectId(assignment["unit_id"])})
        prop = await db.properties.find_one({"_id": ObjectId(assignment["property_id"])})
        if unit:
            unit_data = {
                "id": str(unit["_id"]),
                "unit_number": unit.get("unit_number"),
                "unit_type": unit.get("unit_type"),
                "monthly_rent": unit.get("monthly_rent", 0),
            }
        if prop:
            prop_data = {
                "id": str(prop["_id"]),
                "name": prop.get("name"),
                "address": prop.get("address"),
            }

        from datetime import datetime, timezone
        billing_month = datetime.now(timezone.utc).strftime("%Y-%m")
        invoice = await db.rent_invoices.find_one({"tenant_id": tenant_id, "billing_month": billing_month})
        if invoice:
            current_invoice = {
                "id": str(invoice["_id"]),
                "billing_month": invoice.get("billing_month"),
                "total_amount": invoice.get("total_amount", 0),
                "paid_amount": invoice.get("paid_amount", 0),
                "pending_amount": invoice.get("pending_amount", 0),
                "status": invoice.get("status"),
                "due_date": invoice.get("due_date"),
            }

    # Recent payments
    recent_payments = await db.payments.find({"tenant_id": tenant_id}).sort("payment_date", -1).limit(5).to_list(None)
    payments_data = [{
        "id": str(p["_id"]),
        "billing_month": p.get("billing_month"),
        "amount": p.get("amount"),
        "payment_date": p.get("payment_date"),
        "receipt_number": p.get("receipt_number"),
        "payment_method": p.get("payment_method"),
    } for p in recent_payments]

    # Maintenance
    maintenance = await db.maintenance_requests.find({"tenant_id": tenant_id}).sort("created_at", -1).limit(5).to_list(None)
    maint_data = [{
        "id": str(m["_id"]),
        "request_number": m.get("request_number"),
        "title": m.get("title"),
        "category": m.get("category"),
        "status": m.get("status"),
        "created_at": str(m.get("created_at", "")),
    } for m in maintenance]

    # Unread notifications
    unread = await db.notifications.count_documents({"tenant_id": tenant_id, "read": False})

    return {
        "success": True,
        "data": {
            "tenant": {
                "id": tenant_id,
                "full_name": tenant.get("full_name") if tenant else "Tenant",
                "phone": tenant.get("phone") if tenant else None,
                "email": tenant.get("email") if tenant else None,
            },
            "unit": unit_data,
            "property": prop_data,
            "current_invoice": current_invoice,
            "recent_payments": payments_data,
            "maintenance_requests": maint_data,
            "unread_notifications": unread,
            "is_org_suspended": current_user.get("is_org_suspended", False),
        }
    }
