from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse, PropertyDetailResponse
from app.schemas.base import BaseResponse
from app.database.connection import get_db
from app.api.dependencies.auth import require_owner
from app.utils.helpers import utcnow, serialize_doc
from bson import ObjectId
from typing import List, Optional

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("", response_model=dict)
async def list_properties(
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    cursor = db.properties.find({"organization_id": org_id}).sort("created_at", -1)
    properties_raw = await cursor.to_list(None)

    result = []
    for p in properties_raw:
        prop_id = str(p["_id"])
        total_units = await db.units.count_documents({"organization_id": org_id, "property_id": prop_id})
        occupied_units = await db.units.count_documents({"organization_id": org_id, "property_id": prop_id, "status": "occupied"})
        vacant_units = await db.units.count_documents({"organization_id": org_id, "property_id": prop_id, "status": "vacant"})

        pipeline = [
            {"$match": {"organization_id": org_id, "property_id": prop_id, "status": "occupied"}},
            {"$group": {"_id": None, "total": {"$sum": "$monthly_rent"}}}
        ]
        rent_res = await db.units.aggregate(pipeline).to_list(1)
        monthly_rent = rent_res[0]["total"] if rent_res else 0

        data = serialize_doc(p)
        data["id"] = prop_id
        data.pop("_id", None)
        data["total_units"] = total_units
        data["occupied_units"] = occupied_units
        data["vacant_units"] = vacant_units
        data["monthly_rent"] = monthly_rent
        data["occupancy_rate"] = round((occupied_units / total_units * 100) if total_units else 0, 1)
        result.append(data)

    return {"success": True, "data": result, "total": len(result)}


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_property(
    data: PropertyCreate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    prop_doc = {
        **data.model_dump(),
        "organization_id": org_id,
        "owner_id": current_owner["id"],
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    result = await db.properties.insert_one(prop_doc)
    return {
        "success": True,
        "message": "Property created successfully",
        "data": {"id": str(result.inserted_id)}
    }


@router.get("/{property_id}", response_model=dict)
async def get_property(
    property_id: str,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        prop = await db.properties.find_one({"_id": ObjectId(property_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    prop_id = str(prop["_id"])
    units = await db.units.find({"organization_id": org_id, "property_id": prop_id}).to_list(None)

    floors_map = {}
    for u in units:
        f_num = u.get("floor_number", 1)
        if f_num not in floors_map:
            floors_map[f_num] = {"floor_number": f_num, "total": 0, "occupied": 0, "units": []}

        u_data = serialize_doc(u)
        u_data["id"] = u_data.pop("_id", u_data.get("id"))
        floors_map[f_num]["units"].append(u_data)
        floors_map[f_num]["total"] += 1
        if u.get("status") == "occupied":
            floors_map[f_num]["occupied"] += 1

    total_units = len(units)
    occupied = sum(1 for u in units if u.get("status") == "occupied")
    vacant = sum(1 for u in units if u.get("status") == "vacant")
    monthly_rent = sum(u.get("monthly_rent", 0) for u in units if u.get("status") == "occupied")

    data = serialize_doc(prop)
    data["id"] = prop_id
    data.pop("_id", None)
    data["total_units"] = total_units
    data["occupied_units"] = occupied
    data["vacant_units"] = vacant
    data["monthly_rent"] = monthly_rent
    data["occupancy_rate"] = round((occupied / total_units * 100) if total_units else 0, 1)
    data["floors"] = list(floors_map.values())

    return {"success": True, "data": data}


@router.put("/{property_id}", response_model=dict)
async def update_property(
    property_id: str,
    data: PropertyUpdate,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        prop = await db.properties.find_one({"_id": ObjectId(property_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = utcnow()

    await db.properties.update_one(
        {"_id": ObjectId(property_id), "organization_id": org_id},
        {"$set": updates}
    )
    return {"success": True, "message": "Property updated successfully"}


@router.delete("/{property_id}", response_model=dict)
async def delete_property(
    property_id: str,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]
    try:
        prop = await db.properties.find_one({"_id": ObjectId(property_id), "organization_id": org_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Check for active units
    active = await db.units.count_documents({"organization_id": org_id, "property_id": property_id, "status": "occupied"})
    if active > 0:
        raise HTTPException(status_code=400, detail="Cannot delete property with occupied units")

    await db.properties.delete_one({"_id": ObjectId(property_id), "organization_id": org_id})
    await db.units.delete_many({"organization_id": org_id, "property_id": property_id})
    return {"success": True, "message": "Property deleted successfully"}
