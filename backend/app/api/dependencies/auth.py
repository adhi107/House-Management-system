from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token
from app.database.connection import get_db
from app.models.enums import UserRole, OrganizationStatus, AuditAction
from app.utils.helpers import utcnow
from bson import ObjectId
from typing import Optional, Dict, Any

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db=Depends(get_db),
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = await db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account disabled",
        )

    # Convert ObjectId to string for easy access
    user["_id"] = str(user["_id"])
    user["id"] = user["_id"]
    return user


async def require_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required",
        )
    return current_user


async def get_current_organization(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
) -> Optional[dict]:
    org_id = current_user.get("organization_id")
    if not org_id:
        # If user is owner, check if an organization exists with this owner_user_id
        if current_user.get("role") == UserRole.OWNER:
            org = await db.organizations.find_one({"owner_user_id": current_user["id"]})
            if org:
                org["_id"] = str(org["_id"])
                org["id"] = org["_id"]
                return org
        return None

    try:
        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
        if org:
            org["_id"] = str(org["_id"])
            org["id"] = org["_id"]
            return org
    except Exception:
        pass
    return None


async def require_owner(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    if current_user.get("role") != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required",
        )

    # Attach organization
    org = await get_current_organization(current_user, db)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No organization assigned to this owner account",
        )

    # Organization Suspension Check:
    # If organization is SUSPENDED or INACTIVE, write operations (POST, PUT, DELETE, PATCH) are blocked!
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        if org.get("status") == OrganizationStatus.SUSPENDED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your organization account is currently SUSPENDED. All write and transaction operations are disabled.",
            )
        if org.get("status") == OrganizationStatus.INACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your organization account is INACTIVE. Please contact the platform administrator.",
            )

    current_user["organization_id"] = org["id"]
    current_user["organization"] = org
    return current_user


async def require_tenant(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    if current_user.get("role") != UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant access required",
        )

    # Resolve tenant record
    tenant = await db.tenants.find_one({"user_id": current_user["id"]})
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile record not found",
        )

    tenant["_id"] = str(tenant["_id"])
    tenant["id"] = tenant["_id"]
    current_user["tenant_id"] = tenant["id"]
    current_user["organization_id"] = tenant.get("organization_id")

    # Optional: check if organization is suspended
    if current_user["organization_id"]:
        try:
            org = await db.organizations.find_one({"_id": ObjectId(current_user["organization_id"])})
            if org and org.get("status") == OrganizationStatus.SUSPENDED:
                current_user["is_org_suspended"] = True
        except Exception:
            pass

    return current_user


async def log_audit_event(
    db,
    actor_user_id: str,
    actor_email: str,
    action: AuditAction,
    organization_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
):
    try:
        doc = {
            "actor_user_id": actor_user_id,
            "actor_email": actor_email,
            "action": action,
            "organization_id": organization_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "created_at": utcnow(),
        }
        await db.audit_logs.insert_one(doc)
    except Exception as e:
        logger.warning(f"Audit log writing failed: {e}")
