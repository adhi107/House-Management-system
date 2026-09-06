from fastapi import APIRouter, Depends, HTTPException, Query
from app.database.connection import get_db
from app.api.dependencies.auth import require_owner
from app.utils.helpers import utcnow, serialize_doc
from app.models.enums import RentStatus, UnitStatus
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard_summary(
    property_id: Optional[str] = None,
    current_owner=Depends(require_owner),
    db=Depends(get_db),
):
    org_id = current_owner["organization_id"]

    # Build property filter strictly scoped to organization_id
    if property_id:
        try:
            prop = await db.properties.find_one({"_id": ObjectId(property_id), "organization_id": org_id})
        except Exception:
            raise HTTPException(status_code=404, detail="Property not found")
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        base_filter = {"organization_id": org_id, "property_id": property_id}
    else:
        base_filter = {"organization_id": org_id}

    # Properties count for this organization
    total_properties = await db.properties.count_documents({"organization_id": org_id})

    # Units
    total_units = await db.units.count_documents(base_filter)
    occupied_units = await db.units.count_documents({**base_filter, "status": UnitStatus.OCCUPIED})
    vacant_units = await db.units.count_documents({**base_filter, "status": UnitStatus.VACANT})
    occupancy_rate = round((occupied_units / total_units * 100) if total_units else 0, 1)

    # Current month rent
    now = datetime.now(timezone.utc)
    billing_month = now.strftime("%Y-%m")

    invoices = await db.rent_invoices.find({
        **base_filter,
        "billing_month": billing_month
    }).to_list(None)

    expected = sum(inv.get("total_amount", 0) for inv in invoices)
    collected = sum(inv.get("paid_amount", 0) for inv in invoices)
    pending = sum(
        inv.get("pending_amount", 0)
        for inv in invoices
        if inv.get("status") in [RentStatus.PENDING, RentStatus.PARTIALLY_PAID]
    )
    overdue = sum(
        inv.get("pending_amount", 0)
        for inv in invoices
        if inv.get("status") == RentStatus.OVERDUE
    )

    # Monthly expenses
    start_of_month_str = now.strftime("%Y-%m-01")
    expenses_cursor = await db.expenses.find({
        **base_filter,
        "date": {"$gte": start_of_month_str}
    }).to_list(None)
    total_expenses = sum(e.get("amount", 0) for e in expenses_cursor)

    net_income = collected - total_expenses

    # Alerts
    overdue_invoices = await db.rent_invoices.count_documents({
        **base_filter, "status": RentStatus.OVERDUE
    })
    under_review_invoices = await db.rent_invoices.count_documents({
        **base_filter, "status": RentStatus.UNDER_REVIEW
    })

    from datetime import timedelta
    expiry_threshold = now + timedelta(days=30)
    expiring_agreements = await db.rental_agreements.count_documents({
        **base_filter,
        "status": "active",
        "end_date": {"$lte": expiry_threshold.isoformat()[:10]}
    })

    open_maintenance = await db.maintenance_requests.count_documents({
        **base_filter,
        "status": {"$in": ["open", "in_progress"]}
    })

    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(5, -1, -1):
        month_dt = _month_offset(now, i)
        month_str = month_dt.strftime("%Y-%m")
        month_invoices = await db.rent_invoices.find({
            **base_filter, "billing_month": month_str
        }).to_list(None)
        month_collected = sum(inv.get("paid_amount", 0) for inv in month_invoices)

        month_start = month_dt.strftime("%Y-%m-01")
        next_m = _month_offset(month_dt, -1).strftime("%Y-%m-01")
        month_expenses_list = await db.expenses.find({
            **base_filter,
            "date": {"$gte": month_start, "$lt": next_m}
        }).to_list(None)
        month_exp = sum(e.get("amount", 0) for e in month_expenses_list)

        monthly_trend.append({
            "month": month_dt.strftime("%b %Y"),
            "month_key": month_str,
            "collected": month_collected,
            "expenses": month_exp,
            "net": month_collected - month_exp,
        })

    return {
        "success": True,
        "data": {
            "organization_name": current_owner.get("organization", {}).get("name"),
            "total_properties": total_properties,
            "total_units": total_units,
            "occupied_units": occupied_units,
            "vacant_units": vacant_units,
            "occupancy_rate": occupancy_rate,
            "expected_rent": expected,
            "collected_rent": collected,
            "pending_rent": pending,
            "overdue_rent": overdue,
            "total_expenses": total_expenses,
            "net_income": net_income,
            "collection_rate": round((collected / expected * 100) if expected else 0, 1),
            "alerts": {
                "overdue_invoices": overdue_invoices,
                "under_review_invoices": under_review_invoices,
                "expiring_agreements": expiring_agreements,
                "open_maintenance": open_maintenance,
                "vacant_units": vacant_units,
            },
            "monthly_trend": monthly_trend,
        }
    }


def _month_offset(dt: datetime, months_back: int) -> datetime:
    month = dt.month - months_back
    year = dt.year
    while month <= 0:
        month += 12
        year -= 1
    return datetime(year, month, 1)
