from enum import Enum


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    OWNER = "owner"
    TENANT = "tenant"


class OrganizationStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class OrganizationPlan(str, Enum):
    STARTER = "starter"
    GROWTH = "growth"
    ENTERPRISE = "enterprise"


class UnitStatus(str, Enum):
    OCCUPIED = "occupied"
    VACANT = "vacant"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"
    INACTIVE = "inactive"


class RentStatus(str, Enum):
    PAID = "paid"
    PENDING = "pending"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    WAIVED = "waived"


class PaymentMethod(str, Enum):
    CASH = "cash"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"
    CHEQUE = "cheque"
    OTHER = "other"


class MaintenanceCategory(str, Enum):
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    WATER = "water"
    AC = "ac"
    CLEANING = "cleaning"
    INTERNET = "internet"
    APPLIANCE = "appliance"
    OTHER = "other"


class MaintenanceStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REJECTED = "rejected"


class MaintenancePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DocumentType(str, Enum):
    RENTAL_AGREEMENT = "rental_agreement"
    ID_PROOF = "id_proof"
    PAYMENT_RECEIPT = "payment_receipt"
    MAINTENANCE_INVOICE = "maintenance_invoice"
    PROPERTY_DOCUMENT = "property_document"
    OTHER = "other"


class NotificationType(str, Enum):
    RENT_DUE = "rent_due"
    RENT_OVERDUE = "rent_overdue"
    PAYMENT_RECEIVED = "payment_received"
    MAINTENANCE_UPDATE = "maintenance_update"
    AGREEMENT_EXPIRING = "agreement_expiring"
    ANNOUNCEMENT = "announcement"
    SYSTEM = "system"


class AuditAction(str, Enum):
    ORG_CREATED = "organization_created"
    ORG_STATUS_UPDATED = "organization_status_updated"
    ORG_PLAN_UPDATED = "organization_plan_updated"
    OWNER_PROVISIONED = "owner_provisioned"
    OWNER_PASSWORD_RESET = "owner_password_reset"
    PLATFORM_SETTINGS_UPDATED = "platform_settings_updated"
