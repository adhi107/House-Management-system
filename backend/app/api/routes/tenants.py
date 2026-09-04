from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.tenant import (
    TenantCreate, TenantUpdate, TenantResponse,
    TenantAssignmentCreate, TenantVacate
)
from app.schemas.base import BaseResponse
from app.database.connection import get_db
from app.api.dependencies.auth import require_owner
from app.core.security import hash_password
from app.utils.helpers import utcnow, serialize_doc
from app.models.enums import UserRole, UnitStatus, RentStatus
from bson import ObjectId
from typing import List, Optional

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.get("", response_model=dict)
async def list_tenants(
    property_id: Optional[str] = None,
    unassigned: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    query = {"organization_id": org_id}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    total = await db.tenants.count_documents(query)
    cursor = db.tenants.find(query).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page)
    tenants_raw = await cursor.to_list(None)

    result = []
    for t in tenants_raw:
        t_data = serialize_doc(t)
        t_id = str(t_data.pop("_id", t_data.get("id")))
        t_data["id"] = t_id

        # Get active assignment
        assignment = await db.tenant_assignments.find_one({
            "organization_id": org_id,
            "tenant_id": t_id,
            "is_active": True
        })

        if unassigned and assignment:
            continue

        if assignment:
            unit = await db.units.find_one({"_id": ObjectId(assignment["unit_id"])})
            prop = await db.properties.find_one({"_id": ObjectId(assignment["property_id"])})
            t_data["unit_id"] = assignment["unit_id"]
            t_data["unit_number"] = unit.get("unit_number") if unit else None
            t_data["unit_type"] = unit.get("unit_type") if unit else None
            t_data["property_id"] = assignment["property_id"]
            t_data["property_name"] = prop.get("name") if prop else None
            t_data["monthly_rent"] = assignment.get("monthly_rent")
            t_data["rent_due_day"] = assignment.get("rent_due_day")
            t_data["joining_date"] = assignment.get("joining_date")

            # Current rent status
            from datetime import datetime, timezone
            billing_month = datetime.now(timezone.utc).strftime("%Y-%m")
            inv = await db.rent_invoices.find_one({
                "organization_id": org_id,
                "tenant_id": t_id,
                "billing_month": billing_month
            })
            t_data["current_rent_status"] = inv.get("status") if inv else "pending"

        result.append(t_data)

    return {"success": True, "data": result, "total": len(result), "page": page, "per_page": per_page}


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    data: TenantCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    # Check phone duplicate within this organization
    existing = await db.tenants.find_one({"organization_id": org_id, "phone": data.phone.strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Tenant with this phone number already exists in your organization")

    user_id = None
    # If create portal access is requested
    if data.create_portal_access:
        if not data.portal_password:
            raise HTTPException(status_code=400, detail="Portal password required")

        login_email = (data.email or f"{data.phone}@tenant.propertyhub.dev").lower().strip()
        existing_user = await db.users.find_one({"email": login_email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User account with this email/phone already exists")

        new_user = {
            "_id": ObjectId(),
            "email": login_email,
            "hashed_password": hash_password(data.portal_password),
            "full_name": data.full_name,
            "phone": data.phone,
            "role": UserRole.TENANT,
            "organization_id": org_id,
            "is_active": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        await db.users.insert_one(new_user)
        user_id = str(new_user["_id"])

    tenant_doc = {
        "full_name": data.full_name,
        "phone": data.phone.strip(),
        "email": data.email.lower().strip() if data.email else None,
        "permanent_address": data.permanent_address,
        "emergency_contact_name": data.emergency_contact_name,
        "emergency_contact_phone": data.emergency_contact_phone,
        "id_type": data.id_type,
        "id_number": data.id_number,
        "occupation": data.occupation,
        "notes": data.notes,
        "profile_photo": None,
        "owner_id": current_owner["id"],
        "organization_id": org_id,
        "has_portal_access": data.create_portal_access,
        "user_id": user_id,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = await db.tenants.insert_one(tenant_doc)
    return {
        "success": True,
        "message": "Tenant created successfully",
        "data": {"id": str(result.inserted_id)}
    }


@router.get("/{tenant_id}", response_model=dict)
async def get_tenant(
    tenant_id: str,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        tenant = await db.tenants.find_one({"_id": ObjectId(tenant_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    data = serialize_doc(tenant)
    data["id"] = str(data.pop("_id", data.get("id")))

    # Assignment
    assignment = await db.tenant_assignments.find_one({"organization_id": org_id, "tenant_id": tenant_id, "is_active": True})
    if assignment:
        unit = await db.units.find_one({"_id": ObjectId(assignment["unit_id"])})
        prop = await db.properties.find_one({"_id": ObjectId(assignment["property_id"])})
        data["unit_id"] = assignment["unit_id"]
        data["unit_number"] = unit.get("unit_number") if unit else None
        data["property_id"] = assignment["property_id"]
        data["property_name"] = prop.get("name") if prop else None
        data["monthly_rent"] = assignment.get("monthly_rent")
        data["rent_due_day"] = assignment.get("rent_due_day")
        data["joining_date"] = assignment.get("joining_date")

    return {"success": True, "data": data}


@router.put("/{tenant_id}", response_model=dict)
async def update_tenant(
    tenant_id: str,
    data: TenantUpdate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        tenant = await db.tenants.find_one({"_id": ObjectId(tenant_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    update_dict = {k: v for k, v in data.model_dump().items() if v is not None and k != "monthly_rent"}
    update_dict["updated_at"] = utcnow()

    if update_dict:
        await db.tenants.update_one(
            {"_id": ObjectId(tenant_id), "organization_id": org_id},
            {"$set": update_dict}
        )

    # If monthly_rent is provided, update the active assignment
    if data.monthly_rent is not None:
        await db.tenant_assignments.update_many(
            {"organization_id": org_id, "tenant_id": tenant_id, "is_active": True},
            {"$set": {"monthly_rent": data.monthly_rent}}
        )

    return {"success": True, "message": "Tenant updated successfully"}


@router.post("/assign", response_model=dict)
async def assign_tenant(
    data: TenantAssignmentCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    try:
        tenant = await db.tenants.find_one({"_id": ObjectId(data.tenant_id), "organization_id": org_id})
        unit = await db.units.find_one({"_id": ObjectId(data.unit_id), "organization_id": org_id})
        prop = await db.properties.find_one({"_id": ObjectId(data.property_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid tenant, unit, or property ID")

    if not tenant or not unit or not prop:
        raise HTTPException(status_code=404, detail="Tenant, unit, or property not found in your organization")

    # Check if unit is already occupied
    if unit.get("status") == "occupied":
        raise HTTPException(status_code=400, detail="Unit is already occupied")

    # Deactivate existing active assignment for this tenant if any
    await db.tenant_assignments.update_many(
        {"organization_id": org_id, "tenant_id": data.tenant_id, "is_active": True},
        {"$set": {"is_active": False, "vacated_date": data.joining_date}}
    )

    assignment_doc = {
        **data.model_dump(),
        "organization_id": org_id,
        "is_active": True,
        "created_at": utcnow(),
    }
    await db.tenant_assignments.insert_one(assignment_doc)

    # Mark unit as occupied
    await db.units.update_one(
        {"_id": ObjectId(data.unit_id), "organization_id": org_id},
        {"$set": {"status": "occupied", "updated_at": utcnow()}}
    )

    return {"success": True, "message": "Tenant assigned to unit successfully"}


@router.post("/{tenant_id}/vacate", response_model=dict)
async def vacate_tenant(
    tenant_id: str,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        tenant = await db.tenants.find_one({"_id": ObjectId(tenant_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    assignment = await db.tenant_assignments.find_one({
        "organization_id": org_id,
        "tenant_id": tenant_id,
        "is_active": True
    })
    if not assignment:
        raise HTTPException(status_code=400, detail="Tenant has no active unit assignment")

    # Deactivate assignment
    await db.tenant_assignments.update_one(
        {"_id": assignment["_id"]},
        {"$set": {"is_active": False, "vacated_date": utcnow().strftime("%Y-%m-%d")}}
    )

    # Mark unit as vacant
    await db.units.update_one(
        {"_id": ObjectId(assignment["unit_id"]), "organization_id": org_id},
        {"$set": {"status": "vacant", "updated_at": utcnow()}}
    )

    return {"success": True, "message": "Tenant vacated successfully"}
