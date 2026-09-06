from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DATABASE]
    await _create_indexes(db)
    logger.info("Connected to MongoDB successfully.")


async def close_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")


def get_db():
    return db


async def _create_indexes(database):
    try:
        # Users
        await database.users.create_index("email", unique=True)
        await database.users.create_index("role")
        await database.users.create_index("organization_id")

        # Organizations
        await database.organizations.create_index("organization_code", unique=True)
        await database.organizations.create_index("owner_user_id")
        await database.organizations.create_index("status")
        await database.organizations.create_index("created_at")

        # Properties (Organization Scoped)
        await database.properties.create_index([("organization_id", 1), ("name", 1)])
        await database.properties.create_index("organization_id")
        await database.properties.create_index("owner_id")

        # Units (Organization Scoped)
        await database.units.create_index([("organization_id", 1), ("property_id", 1), ("unit_number", 1)], unique=True)
        await database.units.create_index([("organization_id", 1), ("status", 1)])
        await database.units.create_index("property_id")

        # Tenants (Organization Scoped)
        await database.tenants.create_index([("organization_id", 1), ("phone", 1)])
        await database.tenants.create_index([("organization_id", 1), ("user_id", 1)])
        await database.tenants.create_index("organization_id")
        await database.tenants.create_index("user_id")

        # Tenant Assignments (Organization Scoped)
        await database.tenant_assignments.create_index([("organization_id", 1), ("tenant_id", 1), ("is_active", 1)])
        await database.tenant_assignments.create_index([("organization_id", 1), ("unit_id", 1), ("is_active", 1)])
        await database.tenant_assignments.create_index("tenant_id")
        await database.tenant_assignments.create_index("unit_id")

        # Rental Agreements (Organization Scoped)
        await database.rental_agreements.create_index([("organization_id", 1), ("agreement_number", 1)], unique=True)
        await database.rental_agreements.create_index([("organization_id", 1), ("tenant_id", 1)])
        await database.rental_agreements.create_index([("organization_id", 1), ("status", 1)])

        # Rent Invoices (Organization Scoped - Multi-tenant Unique billing month per unit)
        await database.rent_invoices.create_index([("organization_id", 1), ("invoice_number", 1)], unique=True)
        await database.rent_invoices.create_index([("organization_id", 1), ("unit_id", 1), ("billing_month", 1)], unique=True)
        await database.rent_invoices.create_index([("organization_id", 1), ("status", 1)])
        await database.rent_invoices.create_index([("organization_id", 1), ("tenant_id", 1)])
        await database.rent_invoices.create_index([("organization_id", 1), ("billing_month", 1)])

        # Payments (Organization Scoped)
        await database.payments.create_index([("organization_id", 1), ("receipt_number", 1)], unique=True)
        await database.payments.create_index([("organization_id", 1), ("invoice_id", 1)])
        await database.payments.create_index([("organization_id", 1), ("tenant_id", 1)])
        await database.payments.create_index([("organization_id", 1), ("payment_date", 1)])

        # Maintenance Requests (Organization Scoped)
        await database.maintenance_requests.create_index([("organization_id", 1), ("request_number", 1)], unique=True)
        await database.maintenance_requests.create_index([("organization_id", 1), ("status", 1)])
        await database.maintenance_requests.create_index([("organization_id", 1), ("priority", 1)])
        await database.maintenance_requests.create_index([("organization_id", 1), ("tenant_id", 1)])
        await database.maintenance_requests.create_index([("organization_id", 1), ("property_id", 1)])

        # Expenses (Organization Scoped)
        await database.expenses.create_index([("organization_id", 1), ("property_id", 1)])
        await database.expenses.create_index([("organization_id", 1), ("date", 1)])
        await database.expenses.create_index([("organization_id", 1), ("category", 1)])

        # Documents (Organization Scoped)
        await database.documents.create_index([("organization_id", 1), ("entity_type", 1), ("entity_id", 1)])
        await database.documents.create_index("organization_id")

        # Notifications
        await database.notifications.create_index([("organization_id", 1), ("tenant_id", 1), ("read", 1)])
        await database.notifications.create_index([("organization_id", 1), ("user_id", 1), ("read", 1)])

        # Announcements (Organization Scoped)
        await database.announcements.create_index([("organization_id", 1), ("created_at", -1)])

        # Audit Logs (Super Admin Scoped)
        await database.audit_logs.create_index([("organization_id", 1), ("created_at", -1)])
        await database.audit_logs.create_index([("actor_user_id", 1), ("created_at", -1)])
        await database.audit_logs.create_index([("action", 1), ("created_at", -1)])
        await database.audit_logs.create_index("created_at")

        logger.info("Multi-tenant MongoDB indexes initialized successfully.")
    except Exception as e:
        logger.warning(f"Index initialization note: {e}")
