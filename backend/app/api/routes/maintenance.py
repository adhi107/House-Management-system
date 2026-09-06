from fastapi import APIRouter, Depends, HTTPException, Query
from app.database.connection import get_db
from app.api.dependencies.auth import get_current_user, require_owner
from app.utils.helpers import utcnow, serialize_doc
from app.models.enums import MaintenanceStatus, MaintenancePriority, MaintenanceCategory, UserRole
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


class MaintenanceCreate(BaseModel):
    property_id: str
    unit_id: str
    category: MaintenanceCategory
    title: str
    description: str
    priority: MaintenancePriority = MaintenancePriority.MEDIUM
    photos: Optional[List[str]] = []


class MaintenanceUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    resolved_at: Optional[str] = None


@router.get("")
async def list_maintenance(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
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
    elif current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant profile not found")
        query["tenant_id"] = str(tenant["_id"])
    elif current_user["role"] == UserRole.SUPER_ADMIN:
        if property_id:
            query["property_id"] = property_id

    if status:
        query["status"] = status

    total = await db.maintenance_requests.count_documents(query)
    requests = await db.maintenance_requests.find(query).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page).to_list(None)

    result = []
    for r in requests:
        data = serialize_doc(r)
        data["id"] = data.pop("_id", data.get("id"))
        if data.get("tenant_id"):
            try:
                tenant_doc = await db.tenants.find_one({"_id": ObjectId(data["tenant_id"])})
                data["tenant_name"] = tenant_doc.get("full_name") if tenant_doc else None
            except Exception:
                pass
        if data.get("unit_id"):
            try:
                unit_doc = await db.units.find_one({"_id": ObjectId(data["unit_id"])})
                data["unit_number"] = unit_doc.get("unit_number") if unit_doc else None
            except Exception:
                pass
        if data.get("property_id"):
            try:
                prop_doc = await db.properties.find_one({"_id": ObjectId(data["property_id"])})
                data["property_name"] = prop_doc.get("name") if prop_doc else None
            except Exception:
                pass
        result.append(data)

    return {"success": True, "data": result, "total": total}


@router.post("")
async def create_maintenance(
    data: MaintenanceCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    tenant_id = None
    org_id = None

    if current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant profile not found")
        tenant_id = str(tenant["_id"])
        org_id = tenant.get("organization_id")

        # Verify unit belongs to tenant
        assignment = await db.tenant_assignments.find_one({"tenant_id": tenant_id, "is_active": True})
        if not assignment or assignment["unit_id"] != data.unit_id:
            raise HTTPException(status_code=403, detail="Access denied to this unit")
        if not org_id:
            org_id = assignment.get("organization_id")
    else:
        # Owner creating
        org_id = current_user.get("organization_id")
        if not org_id:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            org_id = str(org["_id"]) if org else None

        # Verify unit in organization
        unit = await db.units.find_one({"_id": ObjectId(data.unit_id), "organization_id": org_id})
        if not unit:
            raise HTTPException(status_code=404, detail="Unit not found in your organization")

    # Get sequence counter
    seq = await db.counters.find_one_and_update(
        {"_id": f"maintenance_{org_id}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    request_number = f"MR-{(seq.get('seq', 0)):04d}"

    doc = {
        "organization_id": org_id,
        "request_number": request_number,
        "property_id": data.property_id,
        "unit_id": data.unit_id,
        "tenant_id": tenant_id,
        "category": data.category,
        "title": data.title,
        "description": data.description,
        "priority": data.priority,
        "photos": data.photos or [],
        "status": MaintenanceStatus.OPEN,
        "notes": None,
        "assigned_to": None,
        "resolved_at": None,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = await db.maintenance_requests.insert_one(doc)

    return {
        "success": True,
        "message": "Maintenance request submitted",
        "data": {"id": str(result.inserted_id), "request_number": request_number}
    }


@router.get("/{request_id}")
async def get_maintenance(
    request_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        req = await db.maintenance_requests.find_one({"_id": ObjectId(request_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if current_user["role"] == UserRole.TENANT:
        tenant = await db.tenants.find_one({"user_id": current_user["id"]})
        if not tenant or req.get("tenant_id") != str(tenant["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user["role"] == UserRole.OWNER:
        org_id = current_user.get("organization_id")
        if req.get("organization_id") != org_id:
            raise HTTPException(status_code=403, detail="Access denied")

    data = serialize_doc(req)
    data["id"] = data.pop("_id", data.get("id"))
    return {"success": True, "data": data}


@router.put("/{request_id}")
async def update_maintenance(
    request_id: str,
    data: MaintenanceUpdate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        req = await db.maintenance_requests.find_one({"_id": ObjectId(request_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")

    if not req:
        raise HTTPException(status_code=404, detail="Request not found in your organization")

    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update["updated_at"] = utcnow()
    await db.maintenance_requests.update_one({"_id": ObjectId(request_id)}, {"$set": update})

    # Notify tenant
    if req.get("tenant_id"):
        await db.notifications.insert_one({
            "organization_id": org_id,
            "tenant_id": req["tenant_id"],
            "type": "maintenance_update",
            "title": "Maintenance Update",
            "message": f"Your maintenance request #{req.get('request_number')} status is now: {data.status or 'updated'}",
            "read": False,
            "created_at": utcnow(),
        })

    return {"success": True, "message": "Maintenance request updated"}
