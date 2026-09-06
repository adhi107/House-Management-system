from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from app.models.enums import OrganizationStatus, OrganizationPlan


class ContactDetails(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    organization_code: str = Field(..., min_length=2, max_length=20)
    contact_details: Optional[ContactDetails] = None
    plan: OrganizationPlan = OrganizationPlan.STARTER
    owner_name: Optional[str] = None
    owner_email: Optional[EmailStr] = None
    owner_phone: Optional[str] = None
    owner_password: Optional[str] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    contact_details: Optional[ContactDetails] = None
    plan: Optional[OrganizationPlan] = None
    settings: Optional[Dict[str, Any]] = None


class OrganizationStatusUpdate(BaseModel):
    status: OrganizationStatus
    reason: Optional[str] = None


class OwnerCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=8)
    organization_id: str


class OwnerPasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8)


class OwnerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    organization_id: Optional[str] = None
    is_active: Optional[bool] = None


class PlatformSettingsUpdate(BaseModel):
    allow_self_registration: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    max_buildings_per_org: Optional[int] = None
    support_email: Optional[str] = None
    platform_announcement: Optional[str] = None
