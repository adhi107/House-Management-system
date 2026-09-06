from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class PropertyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5, max_length=500)
    city: str
    state: str
    pincode: str
    description: Optional[str] = None
    total_floors: int = Field(ge=1, le=100)
    image: Optional[str] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    description: Optional[str] = None
    total_floors: Optional[int] = None
    image: Optional[str] = None


class PropertyResponse(BaseModel):
    id: str
    name: str
    address: str
    city: str
    state: str
    pincode: str
    description: Optional[str] = None
    total_floors: int
    image: Optional[str] = None
    total_units: int = 0
    occupied_units: int = 0
    vacant_units: int = 0
    monthly_rent: float = 0.0
    occupancy_rate: float = 0.0
    organization_id: Optional[str] = None
    owner_id: Optional[str] = None
    created_at: str


class FloorSummary(BaseModel):
    floor_number: int
    total_units: int = 0
    occupied_units: int = 0
    vacant_units: int = 0
    units: List[dict] = []


class PropertyDetailResponse(PropertyResponse):
    floors: List[FloorSummary] = []
