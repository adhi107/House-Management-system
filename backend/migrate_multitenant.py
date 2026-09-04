"""
PropertyHub Multi-Tenant Migration Script
Safely and idempotently migrates existing single-owner databases to multi-tenant architecture.
Usage: python migrate_multitenant.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from bson import ObjectId
import os
import secrets
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "propertyhub")


def utcnow():
    return datetime.now(timezone.utc)


async def migrate():
    print(f"Connecting to MongoDB database '{MONGODB_DATABASE}'...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DATABASE]

    # 1. Find all Owners
    owners = await db.users.find({"role": "owner"}).to_list(None)
    print(f"Found {len(owners)} owner account(s).")

    for owner in owners:
        owner_id = str(owner["_id"])
        org_id = owner.get("organization_id")

        # Check if organization already exists
        if not org_id:
            existing_org = await db.organizations.find_one({"owner_user_id": owner_id})
            if existing_org:
                org_id = str(existing_org["_id"])
            else:
                # Create Organization
                org_id_obj = ObjectId()
                org_id = str(org_id_obj)
                org_code = f"ORG-{(secrets.token_hex(3)).upper()}"
                org_doc = {
                    "_id": org_id_obj,
                    "name": f"{owner.get('full_name', 'Owner')}'s Organization",
                    "organization_code": org_code,
                    "owner_user_id": owner_id,
                    "contact_details": {
                        "email": owner.get("email"),
                        "phone": owner.get("phone"),
                    },
                    "status": "active",
                    "plan": "starter",
                    "settings": {
                        "allow_tenant_portal": True,
                        "rent_grace_period_days": 5,
                    },
                    "created_at": utcnow(),
                    "updated_at": utcnow(),
                }
                await db.organizations.insert_one(org_doc)
                print(f" -> Created organization '{org_doc['name']}' ({org_code}) for Owner {owner.get('email')}")

            # Link owner to organization
            await db.users.update_one(
                {"_id": owner["_id"]},
                {"$set": {"organization_id": org_id, "updated_at": utcnow()}}
            )

        # 2. Backfill organization_id on properties owned by this owner
        props = await db.properties.find({"owner_id": owner_id}).to_list(None)
        prop_ids = [str(p["_id"]) for p in props]

        await db.properties.update_many(
            {"owner_id": owner_id, "organization_id": {"$exists": False}},
            {"$set": {"organization_id": org_id}}
        )

        # 3. Backfill units
        if prop_ids:
            await db.units.update_many(
                {"property_id": {"$in": prop_ids}, "organization_id": {"$exists": False}},
                {"$set": {"organization_id": org_id}}
            )

        # 4. Backfill tenants
        await db.tenants.update_many(
            {"owner_id": owner_id, "organization_id": {"$exists": False}},
            {"$set": {"organization_id": org_id}}
        )

        # 5. Backfill tenant assignments
        tenants = await db.tenants.find({"owner_id": owner_id}).to_list(None)
        tenant_ids = [str(t["_id"]) for t in tenants]
        if tenant_ids:
            await db.tenant_assignments.update_many(
                {"tenant_id": {"$in": tenant_ids}, "organization_id": {"$exists": False}},
                {"$set": {"organization_id": org_id}}
            )

            # 6. Backfill rent invoices
            await db.rent_invoices.update_many(
                {"tenant_id": {"$in": tenant_ids}, "organization_id": {"$exists": False}},
                {"$set": {"organization_id": org_id}}
            )

            # 7. Backfill payments
            await db.payments.update_many(
                {"tenant_id": {"$in": tenant_ids}, "organization_id": {"$exists": False}},
                {"$set": {"organization_id": org_id}}
            )

            # 8. Backfill agreements
            await db.rental_agreements.update_many(
                {"tenant_id": {"$in": tenant_ids}, "organization_id": {"$exists": False}},
                {"$set": {"organization_id": org_id}}
            )

            # 9. Backfill maintenance requests
            await db.maintenance_requests.update_many(
                {"tenant_id": {"$in": tenant_ids}, "organization_id": {"$exists": False}},
                {"$set": {"organization_id": org_id}}
            )

        # 10. Backfill expenses
        if prop_ids:
            await db.expenses.update_many(
                {"property_id": {"$in": prop_ids}, "organization_id": {"$exists": False}},
                {"$set": {"organization_id": org_id}}
            )

        # 11. Backfill announcements
        await db.announcements.update_many(
            {"owner_id": owner_id, "organization_id": {"$exists": False}},
            {"$set": {"organization_id": org_id}}
        )

        print(f" -> Backfilled organization_id={org_id} for Owner {owner.get('email')}")

    print("\n[SUCCESS] Multi-Tenant migration completed safely!")


if __name__ == "__main__":
    asyncio.run(migrate())
