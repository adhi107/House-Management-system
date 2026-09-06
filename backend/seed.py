"""
PropertyHub Database Seeder — Multi-Tenant SaaS
Seeds:
- SUPER_ADMIN: superadmin@propertyhub.dev / ChangeMe123!
- OWNER A (Apex Group - Active): owner@propertyhub.dev / ChangeMe123!
- TENANT A: tenant@propertyhub.dev / ChangeMe123!
- OWNER B (BlueHorizon - Active): owner2@propertyhub.dev / ChangeMe123!
- TENANT B: tenant2@propertyhub.dev / ChangeMe123!
Usage: python seed.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
from dotenv import load_dotenv
from app.core.security import hash_password

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "propertyhub")


def utcnow():
    return datetime.now(timezone.utc)


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DATABASE]

    print("Cleaning existing database collections...")
    collections = [
        "users", "organizations", "properties", "units", "tenants",
        "tenant_assignments", "rental_agreements", "rent_invoices",
        "payments", "maintenance_requests", "expenses", "notifications",
        "announcements", "documents", "counters", "audit_logs", "platform_settings"
    ]
    for c in collections:
        await db[c].drop()

    print("Creating Super Admin, Organizations, and Owners...")
    super_admin_id = ObjectId()
    org_a_id = ObjectId()
    org_b_id = ObjectId()
    owner_a_id = ObjectId()
    owner_b_id = ObjectId()
    tenant_a_user_id = ObjectId()
    tenant_b_user_id = ObjectId()

    # 1. Users
    await db.users.insert_many([
        {
            "_id": super_admin_id,
            "email": "superadmin@propertyhub.dev",
            "hashed_password": hash_password("ChangeMe123!"),
            "full_name": "Platform Administrator",
            "phone": "+91 99999 00000",
            "role": "super_admin",
            "organization_id": None,
            "is_active": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": owner_a_id,
            "email": "owner@propertyhub.dev",
            "hashed_password": hash_password("ChangeMe123!"),
            "full_name": "Vikramaditya Rao",
            "phone": "+91 98490 12345",
            "role": "owner",
            "organization_id": str(org_a_id),
            "is_active": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": owner_b_id,
            "email": "owner2@propertyhub.dev",
            "hashed_password": hash_password("ChangeMe123!"),
            "full_name": "Deepak Mehta",
            "phone": "+91 98220 54321",
            "role": "owner",
            "organization_id": str(org_b_id),
            "is_active": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": tenant_a_user_id,
            "email": "tenant@propertyhub.dev",
            "hashed_password": hash_password("ChangeMe123!"),
            "full_name": "Rajeev Adithya",
            "phone": "+91 98765 43210",
            "role": "tenant",
            "organization_id": str(org_a_id),
            "is_active": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": tenant_b_user_id,
            "email": "tenant2@propertyhub.dev",
            "hashed_password": hash_password("ChangeMe123!"),
            "full_name": "Siddharth Verma",
            "phone": "+91 97654 32109",
            "role": "tenant",
            "organization_id": str(org_b_id),
            "is_active": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
    ])

    # 2. Organizations
    await db.organizations.insert_many([
        {
            "_id": org_a_id,
            "name": "Apex Real Estate Group",
            "organization_code": "ORG-APEX",
            "owner_user_id": str(owner_a_id),
            "contact_details": {
                "email": "owner@propertyhub.dev",
                "phone": "+91 98490 12345",
                "city": "Hyderabad",
                "state": "Telangana",
            },
            "status": "active",
            "plan": "enterprise",
            "settings": {"allow_tenant_portal": True, "rent_grace_period_days": 5},
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": org_b_id,
            "name": "BlueHorizon Properties",
            "organization_code": "ORG-BLUE",
            "owner_user_id": str(owner_b_id),
            "contact_details": {
                "email": "owner2@propertyhub.dev",
                "phone": "+91 98220 54321",
                "city": "Bengaluru",
                "state": "Karnataka",
            },
            "status": "active",
            "plan": "growth",
            "settings": {"allow_tenant_portal": True, "rent_grace_period_days": 5},
            "created_at": utcnow() - timedelta(days=60),
            "updated_at": utcnow(),
        }
    ])

    print("Creating Buildings & Units for Org A and Org B...")
    prop_a_id = ObjectId()
    prop_b_id = ObjectId()

    # Properties
    await db.properties.insert_many([
        {
            "_id": prop_a_id,
            "organization_id": str(org_a_id),
            "owner_id": str(owner_a_id),
            "name": "Sunrise Heights",
            "address": "Plot 42, Road No. 12, Banjara Hills",
            "city": "Hyderabad",
            "state": "Telangana",
            "pincode": "500034",
            "description": "Premium residential complex with power backup and security.",
            "total_floors": 4,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": prop_b_id,
            "organization_id": str(org_b_id),
            "owner_id": str(owner_b_id),
            "name": "Palm Residency",
            "address": "15/A, Indiranagar 100ft Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560038",
            "description": "Modern urban apartment building near metro.",
            "total_floors": 3,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
    ])

    # Units for Org A (Sunrise Heights)
    units_a = []
    unit_types = ["1BHK", "2BHK", "2BHK", "3BHK"]
    rents = [16000, 24000, 26000, 35000]

    for f in range(1, 5):
        for u in range(1, 3):
            unit_num = f"{f}0{u}"
            idx = (f - 1) % len(unit_types)
            units_a.append({
                "_id": ObjectId(),
                "organization_id": str(org_a_id),
                "property_id": str(prop_a_id),
                "unit_number": unit_num,
                "floor_number": f,
                "unit_type": unit_types[idx],
                "area_sqft": 650 if unit_types[idx] == "1BHK" else 1150 if unit_types[idx] == "2BHK" else 1650,
                "monthly_rent": rents[idx],
                "maintenance_charge": 1500,
                "security_deposit": rents[idx] * 2,
                "status": "vacant",
                "created_at": utcnow(),
                "updated_at": utcnow(),
            })
    await db.units.insert_many(units_a)

    # Units for Org B (Palm Residency)
    units_b = []
    for f in range(1, 4):
        for u in range(1, 3):
            unit_num = f"B-{f}0{u}"
            units_b.append({
                "_id": ObjectId(),
                "organization_id": str(org_b_id),
                "property_id": str(prop_b_id),
                "unit_number": unit_num,
                "floor_number": f,
                "unit_type": "2BHK",
                "area_sqft": 1200,
                "monthly_rent": 28000,
                "maintenance_charge": 2000,
                "security_deposit": 56000,
                "status": "vacant",
                "created_at": utcnow(),
                "updated_at": utcnow(),
            })
    await db.units.insert_many(units_b)

    print("Creating Tenants and Assignments...")
    tenant_a1_id = ObjectId()
    tenant_a2_id = ObjectId()
    tenant_b1_id = ObjectId()

    await db.tenants.insert_many([
        {
            "_id": tenant_a1_id,
            "organization_id": str(org_a_id),
            "owner_id": str(owner_a_id),
            "user_id": str(tenant_a_user_id),
            "full_name": "Rajeev Adithya",
            "phone": "+91 98765 43210",
            "email": "tenant@propertyhub.dev",
            "occupation": "Senior Software Architect",
            "has_portal_access": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": tenant_a2_id,
            "organization_id": str(org_a_id),
            "owner_id": str(owner_a_id),
            "user_id": None,
            "full_name": "Priya Sharma",
            "phone": "+91 98123 45678",
            "email": "priya.sharma@example.com",
            "occupation": "Product Designer",
            "has_portal_access": False,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": tenant_b1_id,
            "organization_id": str(org_b_id),
            "owner_id": str(owner_b_id),
            "user_id": str(tenant_b_user_id),
            "full_name": "Siddharth Verma",
            "phone": "+91 97654 32109",
            "email": "tenant2@propertyhub.dev",
            "occupation": "VP of Operations",
            "has_portal_access": True,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
    ])

    # Assignments
    await db.tenant_assignments.insert_many([
        {
            "organization_id": str(org_a_id),
            "tenant_id": str(tenant_a1_id),
            "unit_id": str(units_a[0]["_id"]), # 101
            "property_id": str(prop_a_id),
            "monthly_rent": 16000,
            "maintenance_charge": 1500,
            "security_deposit": 32000,
            "rent_due_day": 5,
            "joining_date": "2026-01-01",
            "is_active": True,
            "created_at": utcnow(),
        },
        {
            "organization_id": str(org_a_id),
            "tenant_id": str(tenant_a2_id),
            "unit_id": str(units_a[1]["_id"]), # 102
            "property_id": str(prop_a_id),
            "monthly_rent": 24000,
            "maintenance_charge": 1500,
            "security_deposit": 48000,
            "rent_due_day": 5,
            "joining_date": "2026-02-01",
            "is_active": True,
            "created_at": utcnow(),
        },
        {
            "organization_id": str(org_b_id),
            "tenant_id": str(tenant_b1_id),
            "unit_id": str(units_b[0]["_id"]), # B-101
            "property_id": str(prop_b_id),
            "monthly_rent": 28000,
            "maintenance_charge": 2000,
            "security_deposit": 56000,
            "rent_due_day": 10,
            "joining_date": "2026-01-15",
            "is_active": True,
            "created_at": utcnow(),
        }
    ])

    # Mark assigned units as occupied
    await db.units.update_many(
        {"_id": {"$in": [units_a[0]["_id"], units_a[1]["_id"], units_b[0]["_id"]]}},
        {"$set": {"status": "occupied"}}
    )

    print("Creating Invoices and Payments...")
    curr_month = utcnow().strftime("%Y-%m")
    inv_a1 = ObjectId()
    inv_b1 = ObjectId()

    await db.rent_invoices.insert_many([
        {
            "_id": inv_a1,
            "organization_id": str(org_a_id),
            "invoice_number": "INV-0001",
            "property_id": str(prop_a_id),
            "unit_id": str(units_a[0]["_id"]),
            "tenant_id": str(tenant_a1_id),
            "billing_month": curr_month,
            "rent_amount": 16000,
            "maintenance_amount": 1500,
            "utility_amount": 0,
            "other_charges": 0,
            "discount": 0,
            "total_amount": 17500,
            "paid_amount": 17500,
            "pending_amount": 0,
            "status": "paid",
            "due_date": f"{curr_month}-05",
            "created_at": utcnow(),
            "updated_at": utcnow(),
        },
        {
            "_id": inv_b1,
            "organization_id": str(org_b_id),
            "invoice_number": "INV-0001",
            "property_id": str(prop_b_id),
            "unit_id": str(units_b[0]["_id"]),
            "tenant_id": str(tenant_b1_id),
            "billing_month": curr_month,
            "rent_amount": 28000,
            "maintenance_amount": 2000,
            "utility_amount": 0,
            "other_charges": 0,
            "discount": 0,
            "total_amount": 30000,
            "paid_amount": 0,
            "pending_amount": 30000,
            "status": "pending",
            "due_date": f"{curr_month}-10",
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
    ])

    await db.payments.insert_one({
        "_id": ObjectId(),
        "organization_id": str(org_a_id),
        "receipt_number": "REC-0001",
        "invoice_id": str(inv_a1),
        "property_id": str(prop_a_id),
        "unit_id": str(units_a[0]["_id"]),
        "tenant_id": str(tenant_a1_id),
        "billing_month": curr_month,
        "amount": 17500,
        "payment_method": "upi",
        "transaction_reference": "UPI/984928192839/HDFC",
        "payment_date": utcnow().strftime("%Y-%m-%d"),
        "notes": "Paid via Google Pay",
        "created_at": utcnow(),
    })

    print("Creating Audit Logs & Platform Settings...")
    await db.audit_logs.insert_many([
        {
            "actor_user_id": str(super_admin_id),
            "actor_email": "superadmin@propertyhub.dev",
            "action": "organization_created",
            "organization_id": str(org_a_id),
            "resource_type": "organization",
            "resource_id": str(org_a_id),
            "details": {"name": "Apex Real Estate Group", "code": "ORG-APEX", "plan": "enterprise"},
            "created_at": utcnow() - timedelta(days=30),
        },
        {
            "actor_user_id": str(super_admin_id),
            "actor_email": "superadmin@propertyhub.dev",
            "action": "organization_created",
            "organization_id": str(org_b_id),
            "resource_type": "organization",
            "resource_id": str(org_b_id),
            "details": {"name": "BlueHorizon Properties", "code": "ORG-BLUE", "plan": "growth"},
            "created_at": utcnow() - timedelta(days=60),
        }
    ])

    await db.platform_settings.update_one(
        {"_id": "global_config"},
        {"$set": {
            "allow_self_registration": True,
            "maintenance_mode": False,
            "max_buildings_per_org": 50,
            "support_email": "support@propertyhub.app",
            "platform_announcement": "Welcome to PropertyHub Multi-Tenant SaaS!",
            "updated_at": utcnow(),
        }},
        upsert=True,
    )

    print("\n[SUCCESS] Multi-Tenant SaaS Database Seed Completed!")
    print("---------------------------------------------------------")
    print("DEMO CREDENTIALS:")
    print("Super Admin : superadmin@propertyhub.dev / ChangeMe123!")
    print("Owner A (Apex) : owner@propertyhub.dev      / ChangeMe123!")
    print("Tenant A       : tenant@propertyhub.dev     / ChangeMe123!")
    print("Owner B (Blue) : owner2@propertyhub.dev     / ChangeMe123!")
    print("Tenant B       : tenant2@propertyhub.dev    / ChangeMe123!")
    print("---------------------------------------------------------\n")


if __name__ == "__main__":
    asyncio.run(seed())
