from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, date


class TenantCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    permanent_address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_type: Optional[str] = None  # Aadhaar, PAN, Passport
    id_number: Optional[str] = None
    occupation: Optional[str] = None
    notes: Optional[str] = None
    # Portal access
    create_portal_access: bool = False
    portal_password: Optional[str] = None


class TenantUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    permanent_address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    occupation: Optional[str] = None
    notes: Optional[str] = None
    profile_photo: Optional[str] = None
    monthly_rent: Optional[float] = None


class TenantAssignmentCreate(BaseModel):
    tenant_id: str
    unit_id: str
    property_id: str
    monthly_rent: float
    maintenance_charge: float = 0.0
    security_deposit: float = 0.0
    rent_due_day: int = Field(default=5, ge=1, le=28)
    joining_date: str


class TenantAssign(BaseModel):
    tenant_id: str
    unit_id: str
    joining_date: str
    rent_due_day: int = Field(default=5, ge=1, le=28)


class TenantVacate(BaseModel):
    vacated_date: Optional[str] = None
    reason: Optional[str] = None


class TenantResponse(BaseModel):
    id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    permanent_address: Optional[str] = None
    occupation: Optional[str] = None
    profile_photo: Optional[str] = None
    organization_id: Optional[str] = None
    owner_id: Optional[str] = None
    # Current assignment
    unit_id: Optional[str] = None
    unit_number: Optional[str] = None
    property_id: Optional[str] = None
    property_name: Optional[str] = None
    floor_number: Optional[int] = None
    monthly_rent: Optional[float] = None
    rent_due_day: Optional[int] = None
    joining_date: Optional[str] = None
    has_portal_access: bool = False
    user_id: Optional[str] = None
    created_at: str
