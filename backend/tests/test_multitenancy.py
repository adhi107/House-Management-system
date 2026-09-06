"""
PropertyHub Multi-Tenant Security & Isolation Test Suite
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.connection import connect_db, close_db


@pytest.fixture(autouse=True)
async def setup_db():
    await connect_db()
    yield
    await close_db()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def auth_tokens(client: AsyncClient):
    # 1. Super Admin
    sa_res = await client.post("/api/v1/auth/login", json={"email": "superadmin@propertyhub.dev", "password": "ChangeMe123!"})
    assert sa_res.status_code == 200, f"Super admin login failed: {sa_res.text}"
    sa_token = sa_res.json()["access_token"]

    # 2. Owner A (Apex Group)
    oa_res = await client.post("/api/v1/auth/login", json={"email": "owner@propertyhub.dev", "password": "ChangeMe123!"})
    assert oa_res.status_code == 200, f"Owner A login failed: {oa_res.text}"
    oa_token = oa_res.json()["access_token"]

    # 3. Owner B (BlueHorizon)
    ob_res = await client.post("/api/v1/auth/login", json={"email": "owner2@propertyhub.dev", "password": "ChangeMe123!"})
    assert ob_res.status_code == 200, f"Owner B login failed: {ob_res.text}"
    ob_token = ob_res.json()["access_token"]

    # 4. Tenant A
    ta_res = await client.post("/api/v1/auth/login", json={"email": "tenant@propertyhub.dev", "password": "ChangeMe123!"})
    assert ta_res.status_code == 200, f"Tenant A login failed: {ta_res.text}"
    ta_token = ta_res.json()["access_token"]

    # 5. Tenant B
    tb_res = await client.post("/api/v1/auth/login", json={"email": "tenant2@propertyhub.dev", "password": "ChangeMe123!"})
    assert tb_res.status_code == 200, f"Tenant B login failed: {tb_res.text}"
    tb_token = tb_res.json()["access_token"]

    return {
        "super_admin": sa_token,
        "owner_a": oa_token,
        "owner_b": ob_token,
        "tenant_a": ta_token,
        "tenant_b": tb_token,
    }


# ================================================
# TEST 1: Super Admin Access & Management
# ================================================

async def test_super_admin_platform_dashboard(client: AsyncClient, auth_tokens: dict):
    headers = {"Authorization": f"Bearer {auth_tokens['super_admin']}"}
    res = await client.get("/api/v1/super-admin/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "stats" in data
    assert data["stats"]["total_organizations"] >= 2
    assert data["stats"]["total_owners"] >= 2


async def test_super_admin_can_list_and_create_orgs(client: AsyncClient, auth_tokens: dict):
    headers = {"Authorization": f"Bearer {auth_tokens['super_admin']}"}
    res = await client.get("/api/v1/super-admin/organizations", headers=headers)
    assert res.status_code == 200
    orgs = res.json()["data"]
    assert len(orgs) >= 2


# ================================================
# TEST 2: Owner A vs Owner B Data Isolation
# ================================================

async def test_owner_a_cannot_access_owner_b_properties(client: AsyncClient, auth_tokens: dict):
    headers_a = {"Authorization": f"Bearer {auth_tokens['owner_a']}"}
    headers_b = {"Authorization": f"Bearer {auth_tokens['owner_b']}"}

    # 1. Owner B gets their properties (Palm Residency)
    res_b = await client.get("/api/v1/properties", headers=headers_b)
    assert res_b.status_code == 200
    props_b = res_b.json()["data"]
    assert len(props_b) > 0
    prop_b_id = props_b[0]["id"]
    prop_b_name = props_b[0]["name"]
    assert prop_b_name == "Palm Residency"

    # 2. Owner A lists properties -> must NOT see Palm Residency
    res_a = await client.get("/api/v1/properties", headers=headers_a)
    assert res_a.status_code == 200
    props_a = res_a.json()["data"]
    for p in props_a:
        assert p["id"] != prop_b_id
        assert p["name"] != "Palm Residency"

    # 3. Owner A tries direct IDOR access to Owner B's property -> must return 404
    res_idor = await client.get(f"/api/v1/properties/{prop_b_id}", headers=headers_a)
    assert res_idor.status_code == 404


async def test_owner_a_cannot_access_owner_b_units_or_tenants(client: AsyncClient, auth_tokens: dict):
    headers_a = {"Authorization": f"Bearer {auth_tokens['owner_a']}"}
    headers_b = {"Authorization": f"Bearer {auth_tokens['owner_b']}"}

    # Owner B gets tenant (Siddharth Verma)
    res_b_tenants = await client.get("/api/v1/tenants", headers=headers_b)
    assert res_b_tenants.status_code == 200
    tenants_b = res_b_tenants.json()["data"]
    assert len(tenants_b) > 0
    tenant_b_id = tenants_b[0]["id"]

    # Owner A lists tenants -> must not include Tenant B
    res_a_tenants = await client.get("/api/v1/tenants", headers=headers_a)
    assert res_a_tenants.status_code == 200
    for t in res_a_tenants.json()["data"]:
        assert t["id"] != tenant_b_id

    # Owner A direct IDOR access to Tenant B -> must return 404
    res_tenant_idor = await client.get(f"/api/v1/tenants/{tenant_b_id}", headers=headers_a)
    assert res_tenant_idor.status_code == 404


# ================================================
# TEST 3: Tenant A vs Tenant B Isolation
# ================================================

async def test_tenant_isolation(client: AsyncClient, auth_tokens: dict):
    headers_ta = {"Authorization": f"Bearer {auth_tokens['tenant_a']}"}
    headers_tb = {"Authorization": f"Bearer {auth_tokens['tenant_b']}"}

    # Tenant A dashboard
    res_ta = await client.get("/api/v1/tenant-dashboard", headers=headers_ta)
    assert res_ta.status_code == 200
    data_ta = res_ta.json()["data"]
    assert data_ta["tenant"]["full_name"] == "Rajeev Adithya"
    assert data_ta["property"]["name"] == "Sunrise Heights"

    # Tenant B dashboard
    res_tb = await client.get("/api/v1/tenant-dashboard", headers=headers_tb)
    assert res_tb.status_code == 200
    data_tb = res_tb.json()["data"]
    assert data_tb["tenant"]["full_name"] == "Siddharth Verma"
    assert data_tb["property"]["name"] == "Palm Residency"


# ================================================
# TEST 4: Organization Suspension Protection
# ================================================

async def test_suspended_organization_mutation_is_blocked(client: AsyncClient, auth_tokens: dict):
    headers_sa = {"Authorization": f"Bearer {auth_tokens['super_admin']}"}
    headers_b = {"Authorization": f"Bearer {auth_tokens['owner_b']}"}

    # 1. Get Org B ID
    orgs_res = await client.get("/api/v1/super-admin/organizations?search=BlueHorizon", headers=headers_sa)
    assert orgs_res.status_code == 200
    org_b_id = orgs_res.json()["data"][0]["id"]

    # 2. Super Admin suspends Org B
    susp_res = await client.put(
        f"/api/v1/super-admin/organizations/{org_b_id}/status",
        json={"status": "suspended", "reason": "Billing overdue review"},
        headers=headers_sa,
    )
    assert susp_res.status_code == 200

    # 3. Owner B attempts to create a property while suspended -> must be 403 Forbidden!
    create_prop_res = await client.post(
        "/api/v1/properties",
        json={
            "name": "Unauthorized Tower",
            "address": "123 Suspended St",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001",
            "total_floors": 2,
        },
        headers=headers_b,
    )
    assert create_prop_res.status_code == 403
    assert "SUSPENDED" in create_prop_res.json()["detail"]

    # 4. Super Admin restores Org B to active
    active_res = await client.put(
        f"/api/v1/super-admin/organizations/{org_b_id}/status",
        json={"status": "active"},
        headers=headers_sa,
    )
    assert active_res.status_code == 200
