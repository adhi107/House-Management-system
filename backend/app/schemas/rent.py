from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import date
from app.models.enums import RentStatus, PaymentMethod


class RentInvoiceCreate(BaseModel):
    tenant_id: str
    unit_id: str
    property_id: str
    billing_month: str  # "2026-09"
    rent_amount: float
    maintenance_amount: float = 0.0
    utility_amount: float = 0.0
    other_charges: float = 0.0
    discount: float = 0.0
    due_date: str
    notes: Optional[str] = None


class InvoiceUpdate(BaseModel):
    rent_amount: Optional[float] = None
    maintenance_amount: Optional[float] = None
    utility_amount: Optional[float] = None
    other_charges: Optional[float] = None
    discount: Optional[float] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class PaymentClaimCreate(BaseModel):
    amount: float = Field(gt=0)
    payment_method: PaymentMethod = PaymentMethod.UPI
    transaction_reference: Optional[str] = None
    payment_date: Optional[str] = None
    proof_url: Optional[str] = None
    notes: Optional[str] = None


class PaymentClaimVerify(BaseModel):
    approved: bool
    verified_amount: Optional[float] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None


class PaymentReminderRequest(BaseModel):
    invoice_ids: Optional[List[str]] = None
    property_id: Optional[str] = None
    all_overdue: bool = False
    custom_message: Optional[str] = None


class RentInvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    tenant_id: str
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    unit_id: str
    unit_number: Optional[str] = None
    property_id: str
    property_name: Optional[str] = None
    billing_month: str
    rent_amount: float
    maintenance_amount: float
    utility_amount: float
    other_charges: float
    discount: float
    total_amount: float
    paid_amount: float
    pending_amount: float
    status: str
    due_date: str
    notes: Optional[str] = None
    payment_claimed: Optional[bool] = False
    claimed_payment: Optional[Dict[str, Any]] = None
    payments: Optional[List[Dict[str, Any]]] = None
    created_at: str


class GenerateMonthlyRent(BaseModel):
    property_id: Optional[str] = None
    tenant_id: Optional[str] = None
    unit_ids: Optional[List[str]] = None
    billing_month: str  # "2026-09"
    due_day: Optional[int] = 5
    utility_surcharge: Optional[float] = 0.0
    notify_tenants: Optional[bool] = True
    include_vacant: Optional[bool] = False
    notes: Optional[str] = None


MonthlyRentGenerate = GenerateMonthlyRent


class PaymentCreate(BaseModel):
    invoice_id: str
    amount: float = Field(gt=0)
    payment_method: PaymentMethod
    transaction_reference: Optional[str] = None
    payment_date: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    receipt_number: str
    invoice_id: str
    tenant_id: str
    tenant_name: Optional[str] = None
    unit_id: str
    unit_number: Optional[str] = None
    property_id: str
    property_name: Optional[str] = None
    billing_month: str
    amount: float
    payment_method: str
    transaction_reference: Optional[str] = None
    payment_date: str
    notes: Optional[str] = None
    created_at: str


class RentSummary(BaseModel):
    expected: float = 0.0
    collected: float = 0.0
    pending: float = 0.0
    overdue: float = 0.0
    under_review: float = 0.0
    under_review_count: int = 0
    collection_rate: float = 0.0


RentSummaryResponse = RentSummary
