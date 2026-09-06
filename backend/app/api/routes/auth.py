from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.schemas.auth import (
    UserLogin, UserCreate, TokenResponse, RefreshTokenRequest,
    UserResponse, ChangePassword, ForgotPassword, ResetPassword
)
from app.schemas.base import BaseResponse
from app.database.connection import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token
)
from app.api.dependencies.auth import get_current_user
from app.utils.helpers import utcnow, serialize_doc
from app.models.enums import UserRole, OrganizationStatus
from bson import ObjectId
from datetime import datetime, timezone
import secrets

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": data.email.lower().strip()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    pwd_hash = user.get("hashed_password") or user.get("password_hash")
    if not pwd_hash or not verify_password(data.password, pwd_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")

    user_id = str(user["_id"])
    org_id = user.get("organization_id")
    if not org_id and user.get("role") == UserRole.OWNER:
        org = await db.organizations.find_one({"owner_user_id": user_id})
        if org:
            org_id = str(org["_id"])
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"organization_id": org_id}})

    token_claims = {
        "sub": user_id,
        "role": user["role"],
        "organization_id": org_id,
    }

    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)

    # Store refresh token
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"refresh_token": refresh_token, "last_login": utcnow()}}
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user_id,
        role=user["role"],
        full_name=user["full_name"],
        email=user["email"],
    )


@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, db=Depends(get_db)):
    existing = await db.users.find_one({"email": data.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = ObjectId()
    org_id = None

    # If registering as OWNER, auto-create a starter organization
    if data.role == UserRole.OWNER:
        org_id = ObjectId()
        org_doc = {
            "_id": org_id,
            "name": f"{data.full_name}'s Properties",
            "organization_code": f"ORG-{secrets.token_hex(3).upper()}",
            "owner_user_id": str(user_id),
            "contact_details": {"email": data.email.lower().strip(), "phone": data.phone},
            "status": OrganizationStatus.ACTIVE,
            "plan": "starter",
            "settings": {"allow_tenant_portal": True, "rent_grace_period_days": 5},
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        await db.organizations.insert_one(org_doc)

    user_doc = {
        "_id": user_id,
        "email": data.email.lower().strip(),
        "hashed_password": hash_password(data.password),
        "full_name": data.full_name,
        "phone": data.phone,
        "role": data.role,
        "organization_id": str(org_id) if org_id else None,
        "is_active": True,
        "profile_photo": None,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    await db.users.insert_one(user_doc)

    token_claims = {
        "sub": str(user_id),
        "role": data.role,
        "organization_id": str(org_id) if org_id else None,
    }
    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)
    await db.users.update_one({"_id": user_id}, {"$set": {"refresh_token": refresh_token}})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user_id),
        role=data.role,
        full_name=data.full_name,
        email=data.email.lower().strip(),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db=Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not user or user.get("refresh_token") != data.refresh_token:
        raise HTTPException(status_code=401, detail="Invalid or revoked refresh token")

    token_claims = {
        "sub": user_id,
        "role": user["role"],
        "organization_id": user.get("organization_id"),
    }
    access_token = create_access_token(token_claims)
    new_refresh_token = create_refresh_token(token_claims)
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"refresh_token": new_refresh_token}})

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user_id=user_id,
        role=user["role"],
        full_name=user["full_name"],
        email=user["email"],
    )


@router.post("/logout", response_model=BaseResponse)
async def logout(current_user=Depends(get_current_user), db=Depends(get_db)):
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$unset": {"refresh_token": ""}}
    )
    return BaseResponse(message="Logged out successfully")


@router.get("/me")
async def get_me(current_user=Depends(get_current_user), db=Depends(get_db)):
    res = {
        "id": current_user["_id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "phone": current_user.get("phone"),
        "role": current_user["role"],
        "profile_photo": current_user.get("profile_photo"),
        "is_active": current_user.get("is_active", True),
        "organization_id": current_user.get("organization_id"),
        "created_at": str(current_user.get("created_at", "")),
    }

    if current_user.get("organization_id"):
        try:
            org = await db.organizations.find_one({"_id": ObjectId(current_user["organization_id"])})
            if org:
                res["organization_name"] = org.get("name")
                res["organization_code"] = org.get("organization_code")
                res["organization_status"] = org.get("status")
        except Exception:
            pass

    return res


@router.post("/change-password", response_model=BaseResponse)
async def change_password(
    data: ChangePassword,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    pwd_hash = current_user.get("hashed_password") or current_user.get("password_hash")
    if not pwd_hash or not verify_password(data.current_password, pwd_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"hashed_password": hash_password(data.new_password), "updated_at": utcnow()}}
    )
    return BaseResponse(message="Password changed successfully")
