from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.unit import UnitCreate, UnitUpdate, UnitResponse
from app.schemas.base import BaseResponse
from app.database.connection import get_db
from app.api.dependencies.auth import require_owner
from app.utils.helpers import utcnow, serialize_doc
from bson import ObjectId
from typing import List, Optional

router = APIRouter(prefix="/units", tags=["Units"])


@router.get("", response_model=dict)
async def list_units(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    floor: Optional[int] = None,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    query = {"organization_id": org_id}
    if property_id:
        query["property_id"] = property_id
    if status:
        query["status"] = status
    if floor is not None:
        query["floor_number"] = floor

    units_cursor = db.units.find(query).sort([("floor_number", 1), ("unit_number", 1)])
    units_raw = await units_cursor.to_list(None)

    result = []
    for u in units_raw:
        u_data = serialize_doc(u)
        u_id = str(u_data.pop("_id", u_data.get("id")))
        u_data["id"] = u_id

        # Attach tenant if occupied
        if u.get("status") == "occupied":
            assignment = await db.tenant_assignments.find_one({"organization_id": org_id, "unit_id": u_id, "is_active": True})
            if assignment:
                tenant = await db.tenants.find_one({"_id": ObjectId(assignment["tenant_id"])})
                if tenant:
                    u_data["tenant_id"] = str(tenant["_id"])
                    u_data["tenant_name"] = tenant.get("full_name")
                    u_data["tenant_phone"] = tenant.get("phone")

        if u.get("property_id"):
            prop = await db.properties.find_one({"_id": ObjectId(u["property_id"])})
            if prop:
                u_data["property_name"] = prop.get("name")

        result.append(u_data)

    return {"success": True, "data": result, "total": len(result)}


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_unit(
    data: UnitCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    # Verify property belongs to this organization
    try:
        prop = await db.properties.find_one({"_id": ObjectId(data.property_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found in your organization")

    # Check unique unit number in property
    existing = await db.units.find_one({
        "organization_id": org_id,
        "property_id": data.property_id,
        "unit_number": data.unit_number.strip()
    })
    if existing:
        raise HTTPException(status_code=400, detail=f"Unit {data.unit_number} already exists in this property")

    unit_doc = {
        **data.model_dump(),
        "unit_number": data.unit_number.strip(),
        "organization_id": org_id,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = await db.units.insert_one(unit_doc)

    return {
        "success": True,
        "message": "Unit created successfully",
        "data": {"id": str(result.inserted_id)}
    }


@router.get("/{unit_id}", response_model=dict)
async def get_unit(
    unit_id: str,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        unit = await db.units.find_one({"_id": ObjectId(unit_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Unit not found")

    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    data = serialize_doc(unit)
    data["id"] = str(data.pop("_id", data.get("id")))

    if unit.get("status") == "occupied":
        assignment = await db.tenant_assignments.find_one({"organization_id": org_id, "unit_id": unit_id, "is_active": True})
        if assignment:
            tenant = await db.tenants.find_one({"_id": ObjectId(assignment["tenant_id"])})
            if tenant:
                data["tenant_id"] = str(tenant["_id"])
                data["tenant_name"] = tenant.get("full_name")
                data["tenant_phone"] = tenant.get("phone")

    return {"success": True, "data": data}


@router.put("/{unit_id}", response_model=dict)
async def update_unit(
    unit_id: str,
    data: UnitUpdate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        unit = await db.units.find_one({"_id": ObjectId(unit_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Unit not found")

    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = utcnow()

    await db.units.update_one(
        {"_id": ObjectId(unit_id), "organization_id": org_id},
        {"$set": updates}
    )
    return {"success": True, "message": "Unit updated successfully"}


@router.delete("/{unit_id}", response_model=dict)
async def delete_unit(
    unit_id: str,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        unit = await db.units.find_one({"_id": ObjectId(unit_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Unit not found")

    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    if unit.get("status") == "occupied":
        raise HTTPException(status_code=400, detail="Cannot delete an occupied unit")

    await db.units.delete_one({"_id": ObjectId(unit_id), "organization_id": org_id})
    return {"success": True, "message": "Unit deleted successfully"}
