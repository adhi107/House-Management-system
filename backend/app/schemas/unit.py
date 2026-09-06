from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.enums import UnitStatus


class UnitCreate(BaseModel):
    property_id: str
    unit_number: str = Field(min_length=1, max_length=20)
    floor_number: int = Field(ge=0, le=100)
    unit_type: str  # "1BHK", "2BHK", "3BHK", "Studio", "Shop", etc.
    area_sqft: Optional[float] = None
    monthly_rent: float = Field(ge=0)
    maintenance_charge: float = 0.0
    security_deposit: float = 0.0
    description: Optional[str] = None


class UnitUpdate(BaseModel):
    unit_number: Optional[str] = None
    floor_number: Optional[int] = None
    unit_type: Optional[str] = None
    area_sqft: Optional[float] = None
    monthly_rent: Optional[float] = None
    maintenance_charge: Optional[float] = None
    security_deposit: Optional[float] = None
    status: Optional[UnitStatus] = None
    description: Optional[str] = None


class UnitResponse(BaseModel):
    id: str
    property_id: str
    property_name: Optional[str] = None
    unit_number: str
    floor_number: int
    unit_type: str
    area_sqft: Optional[float]
    monthly_rent: float
    maintenance_charge: float
    security_deposit: float
    status: str
    description: Optional[str]
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    rent_due_date: Optional[str] = None
    created_at: str
