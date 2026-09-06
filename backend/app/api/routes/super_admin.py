from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.database.connection import get_db
from app.api.dependencies.auth import require_super_admin, log_audit_event
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationStatusUpdate,
    OwnerCreate,
    OwnerUpdate,
    OwnerPasswordReset,
    PlatformSettingsUpdate,
)
from app.models.enums import UserRole, OrganizationStatus, OrganizationPlan, AuditAction
from app.core.security import hash_password
from app.utils.helpers import utcnow, serialize_doc
from bson import ObjectId
from typing import Optional

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])


# ================================================
# 1. PLATFORM DASHBOARD & ANALYTICS
# ================================================

@router.get("/dashboard")
async def super_admin_dashboard(
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    total_orgs = await db.organizations.count_documents({})
    active_orgs = await db.organizations.count_documents({"status": OrganizationStatus.ACTIVE})
    suspended_orgs = await db.organizations.count_documents({"status": OrganizationStatus.SUSPENDED})
    total_owners = await db.users.count_documents({"role": UserRole.OWNER})
    total_properties = await db.properties.count_documents({})
    total_units = await db.units.count_documents({})
    occupied_units = await db.units.count_documents({"status": "occupied"})
    total_tenants = await db.tenants.count_documents({})

    # Aggregate platform collected revenue
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    pay_res = await db.payments.aggregate(pipeline).to_list(1)
    platform_collected = pay_res[0]["total"] if pay_res else 0

    # Recent Audit Logs
    audit_logs_raw = await db.audit_logs.find({}).sort("created_at", -1).limit(6).to_list(None)
    audit_logs = [serialize_doc(a) for a in audit_logs_raw]
    for a in audit_logs:
        a["id"] = a.pop("_id", a.get("id"))

    # Recent Organizations
    recent_orgs_raw = await db.organizations.find({}).sort("created_at", -1).limit(5).to_list(None)
    recent_orgs = []
    for org in recent_orgs_raw:
        data = serialize_doc(org)
        data["id"] = data.pop("_id", data.get("id"))
        owner = await db.users.find_one({"_id": ObjectId(org.get("owner_user_id"))}) if org.get("owner_user_id") else None
        data["owner_name"] = owner.get("full_name") if owner else "Unassigned"
        data["properties_count"] = await db.properties.count_documents({"organization_id": data["id"]})
        data["units_count"] = await db.units.count_documents({"organization_id": data["id"]})
        data["tenants_count"] = await db.tenants.count_documents({"organization_id": data["id"]})
        recent_orgs.append(data)

    return {
        "success": True,
        "data": {
            "stats": {
                "total_organizations": total_orgs,
                "active_organizations": active_orgs,
                "suspended_organizations": suspended_orgs,
                "total_owners": total_owners,
                "total_properties": total_properties,
                "total_units": total_units,
                "occupied_units": occupied_units,
                "total_tenants": total_tenants,
                "platform_collected_revenue": platform_collected,
            },
            "recent_organizations": recent_orgs,
            "recent_audit_logs": audit_logs,
        },
    }


# ================================================
# 2. ORGANIZATION MANAGEMENT
# ================================================

@router.get("/organizations")
async def list_organizations(
    status: Optional[str] = None,
    plan: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    flt = {}
    if status:
        flt["status"] = status
    if plan:
        flt["plan"] = plan
    if search:
        flt["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"organization_code": {"$regex": search, "$options": "i"}},
        ]

    total = await db.organizations.count_documents(flt)
    orgs_cursor = db.organizations.find(flt).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page)
    orgs_raw = await orgs_cursor.to_list(None)

    result = []
    for org in orgs_raw:
        data = serialize_doc(org)
        org_id = str(data.pop("_id", data.get("id")))
        data["id"] = org_id

        # Attach Owner info
        if data.get("owner_user_id"):
            try:
                owner = await db.users.find_one({"_id": ObjectId(data["owner_user_id"])})
                data["owner_name"] = owner.get("full_name") if owner else None
                data["owner_email"] = owner.get("email") if owner else None
                data["owner_phone"] = owner.get("phone") if owner else None
            except Exception:
                pass

        # Counts
        data["buildings_count"] = await db.properties.count_documents({"organization_id": org_id})
        data["units_count"] = await db.units.count_documents({"organization_id": org_id})
        data["tenants_count"] = await db.tenants.count_documents({"organization_id": org_id})
        result.append(data)

    return {"success": True, "data": result, "total": total, "page": page, "per_page": per_page}


@router.post("/organizations")
async def create_organization(
    data: OrganizationCreate,
    request: Request,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    # Check duplicate code
    existing = await db.organizations.find_one({"organization_code": data.organization_code.upper().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Organization code already exists")

    org_id = ObjectId()
    owner_user_id = None

    # Optionally create and attach primary Owner user
    if data.owner_email and data.owner_password and data.owner_name:
        existing_user = await db.users.find_one({"email": data.owner_email.lower().strip()})
        if existing_user:
            raise HTTPException(status_code=400, detail="Owner email is already registered")

        new_user = {
            "_id": ObjectId(),
            "email": data.owner_email.lower().strip(),
            "hashed_password": hash_password(data.owner_password),
            "full_name": data.owner_name,
            "phone": data.owner_phone or "",
            "role": UserRole.OWNER,
            "organization_id": str(org_id),
            "is_active": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        await db.users.insert_one(new_user)
        owner_user_id = str(new_user["_id"])

    org_doc = {
        "_id": org_id,
        "name": data.name,
        "organization_code": data.organization_code.upper().strip(),
        "owner_user_id": owner_user_id,
        "contact_details": data.contact_details.model_dump() if data.contact_details else {},
        "status": OrganizationStatus.ACTIVE,
        "plan": data.plan,
        "settings": {
            "allow_tenant_portal": True,
            "rent_grace_period_days": 5,
        },
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    await db.organizations.insert_one(org_doc)

    # Audit log
    await log_audit_event(
        db=db,
        actor_user_id=current_admin["id"],
        actor_email=current_admin["email"],
        action=AuditAction.ORG_CREATED,
        organization_id=str(org_id),
        resource_type="organization",
        resource_id=str(org_id),
        details={"name": data.name, "code": data.organization_code, "plan": data.plan},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "success": True,
        "message": "Organization created successfully",
        "data": {"id": str(org_id), "organization_code": org_doc["organization_code"]},
    }


@router.get("/organizations/{org_id}")
async def get_organization(
    org_id: str,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    try:
        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    data = serialize_doc(org)
    data["id"] = data.pop("_id", data.get("id"))

    # Owner details
    if data.get("owner_user_id"):
        owner = await db.users.find_one({"_id": ObjectId(data["owner_user_id"])})
        if owner:
            data["owner"] = {
                "id": str(owner["_id"]),
                "full_name": owner.get("full_name"),
                "email": owner.get("email"),
                "phone": owner.get("phone"),
                "is_active": owner.get("is_active"),
            }

    # Entity counts
    data["buildings_count"] = await db.properties.count_documents({"organization_id": org_id})
    data["units_count"] = await db.units.count_documents({"organization_id": org_id})
    data["tenants_count"] = await db.tenants.count_documents({"organization_id": org_id})
    data["invoices_count"] = await db.rent_invoices.count_documents({"organization_id": org_id})

    # Recent buildings
    buildings_raw = await db.properties.find({"organization_id": org_id}).limit(5).to_list(None)
    data["buildings"] = [serialize_doc(b) for b in buildings_raw]

    return {"success": True, "data": data}


@router.put("/organizations/{org_id}")
async def update_organization(
    org_id: str,
    data: OrganizationUpdate,
    request: Request,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    try:
        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        updates["updated_at"] = utcnow()
        await db.organizations.update_one({"_id": ObjectId(org_id)}, {"$set": updates})

    # Audit log
    await log_audit_event(
        db=db,
        actor_user_id=current_admin["id"],
        actor_email=current_admin["email"],
        action=AuditAction.ORG_PLAN_UPDATED if "plan" in updates else AuditAction.ORG_STATUS_UPDATED,
        organization_id=org_id,
        resource_type="organization",
        resource_id=org_id,
        details=updates,
        ip_address=request.client.host if request.client else None,
    )

    return {"success": True, "message": "Organization updated successfully"}


@router.put("/organizations/{org_id}/status")
async def update_organization_status(
    org_id: str,
    data: OrganizationStatusUpdate,
    request: Request,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    try:
        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    await db.organizations.update_one(
        {"_id": ObjectId(org_id)},
        {"$set": {"status": data.status, "status_reason": data.reason, "updated_at": utcnow()}},
    )

    # If suspended, disable owner account login flag if necessary or keep active for read-only
    await log_audit_event(
        db=db,
        actor_user_id=current_admin["id"],
        actor_email=current_admin["email"],
        action=AuditAction.ORG_STATUS_UPDATED,
        organization_id=org_id,
        resource_type="organization",
        resource_id=org_id,
        details={"previous_status": org.get("status"), "new_status": data.status, "reason": data.reason},
        ip_address=request.client.host if request.client else None,
    )

    return {"success": True, "message": f"Organization status updated to {data.status.upper()}"}


# ================================================
# 3. OWNER USER PROVISIONING & MANAGEMENT
# ================================================

@router.get("/owners")
async def list_owners(
    organization_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    flt = {"role": UserRole.OWNER}
    if organization_id:
        flt["organization_id"] = organization_id
    if search:
        flt["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]

    total = await db.users.count_documents(flt)
    owners_raw = await db.users.find(flt).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page).to_list(None)

    result = []
    for u in owners_raw:
        data = serialize_doc(u)
        data.pop("hashed_password", None)
        data["id"] = data.pop("_id", data.get("id"))
        if data.get("organization_id"):
            try:
                org = await db.organizations.find_one({"_id": ObjectId(data["organization_id"])})
                data["organization_name"] = org.get("name") if org else None
                data["organization_status"] = org.get("status") if org else None
            except Exception:
                pass
        result.append(data)

    return {"success": True, "data": result, "total": total, "page": page, "per_page": per_page}


@router.post("/owners")
async def create_owner(
    data: OwnerCreate,
    request: Request,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    # Verify organization exists
    try:
        org = await db.organizations.find_one({"_id": ObjectId(data.organization_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing = await db.users.find_one({"email": data.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = {
        "_id": ObjectId(),
        "email": data.email.lower().strip(),
        "hashed_password": hash_password(data.password),
        "full_name": data.full_name,
        "phone": data.phone,
        "role": UserRole.OWNER,
        "organization_id": data.organization_id,
        "is_active": True,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    await db.users.insert_one(new_user)
    owner_id = str(new_user["_id"])

    # If organization has no owner_user_id, link it
    if not org.get("owner_user_id"):
        await db.organizations.update_one(
            {"_id": ObjectId(data.organization_id)},
            {"$set": {"owner_user_id": owner_id, "updated_at": utcnow()}},
        )

    await log_audit_event(
        db=db,
        actor_user_id=current_admin["id"],
        actor_email=current_admin["email"],
        action=AuditAction.OWNER_PROVISIONED,
        organization_id=data.organization_id,
        resource_type="user",
        resource_id=owner_id,
        details={"name": data.full_name, "email": data.email, "organization_id": data.organization_id},
        ip_address=request.client.host if request.client else None,
    )

    return {"success": True, "message": "Owner user provisioned successfully", "data": {"id": owner_id}}


@router.put("/owners/{owner_id}/reset-password")
async def reset_owner_password(
    owner_id: str,
    data: OwnerPasswordReset,
    request: Request,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    try:
        user = await db.users.find_one({"_id": ObjectId(owner_id), "role": UserRole.OWNER})
    except Exception:
        raise HTTPException(status_code=404, detail="Owner not found")

    if not user:
        raise HTTPException(status_code=404, detail="Owner not found")

    await db.users.update_one(
        {"_id": ObjectId(owner_id)},
        {"$set": {"hashed_password": hash_password(data.new_password), "updated_at": utcnow()}},
    )

    await log_audit_event(
        db=db,
        actor_user_id=current_admin["id"],
        actor_email=current_admin["email"],
        action=AuditAction.OWNER_PASSWORD_RESET,
        organization_id=user.get("organization_id"),
        resource_type="user",
        resource_id=owner_id,
        details={"owner_email": user.get("email")},
        ip_address=request.client.host if request.client else None,
    )

    return {"success": True, "message": "Owner password reset successfully"}


@router.put("/owners/{owner_id}")
async def update_owner(
    owner_id: str,
    data: OwnerUpdate,
    request: Request,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    try:
        user = await db.users.find_one({"_id": ObjectId(owner_id), "role": UserRole.OWNER})
    except Exception:
        raise HTTPException(status_code=404, detail="Owner not found")

    if not user:
        raise HTTPException(status_code=404, detail="Owner not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if "email" in updates:
        updates["email"] = updates["email"].lower().strip()
        existing = await db.users.find_one({"email": updates["email"], "_id": {"$ne": ObjectId(owner_id)}})
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another user")

    updates["updated_at"] = utcnow()

    await db.users.update_one(
        {"_id": ObjectId(owner_id)},
        {"$set": updates},
    )

    await log_audit_event(
        db=db,
        actor_user_id=current_admin["id"],
        actor_email=current_admin["email"],
        action=AuditAction.PLATFORM_SETTINGS_UPDATED,
        organization_id=updates.get("organization_id", user.get("organization_id")),
        resource_type="user",
        resource_id=owner_id,
        details={"owner_id": owner_id, "updated_fields": list(updates.keys())},
        ip_address=request.client.host if request.client else None,
    )

    return {"success": True, "message": "Owner account updated successfully"}


# ================================================
# 4. AUDIT LOGS
# ================================================

@router.get("/audit-logs")
async def list_audit_logs(
    organization_id: Optional[str] = None,
    action: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    flt = {}
    if organization_id:
        flt["organization_id"] = organization_id
    if action:
        flt["action"] = action

    total = await db.audit_logs.count_documents(flt)
    logs_raw = await db.audit_logs.find(flt).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page).to_list(None)

    result = []
    for a in logs_raw:
        data = serialize_doc(a)
        data["id"] = data.pop("_id", data.get("id"))
        result.append(data)

    return {"success": True, "data": result, "total": total, "page": page, "per_page": per_page}


# ================================================
# 5. PLATFORM SETTINGS
# ================================================

@router.get("/settings")
async def get_platform_settings(
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    settings_doc = await db.platform_settings.find_one({"_id": "global_config"})
    if not settings_doc:
        settings_doc = {
            "allow_self_registration": False,
            "maintenance_mode": False,
            "max_buildings_per_org": 50,
            "support_email": "support@propertyhub.app",
            "platform_announcement": "",
        }
    else:
        settings_doc.pop("_id", None)
    return {"success": True, "data": settings_doc}


@router.put("/settings")
async def update_platform_settings(
    data: PlatformSettingsUpdate,
    request: Request,
    current_admin=Depends(require_super_admin),
    db=Depends(get_db),
):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = utcnow()

    await db.platform_settings.update_one(
        {"_id": "global_config"},
        {"$set": updates},
        upsert=True,
    )

    await log_audit_event(
        db=db,
        actor_user_id=current_admin["id"],
        actor_email=current_admin["email"],
        action=AuditAction.PLATFORM_SETTINGS_UPDATED,
        resource_type="platform_settings",
        details=updates,
        ip_address=request.client.host if request.client else None,
    )

    return {"success": True, "message": "Platform settings updated successfully"}
