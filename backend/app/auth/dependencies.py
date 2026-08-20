from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.jwt import decode_access_token
from database.connection import get_db
from database.interface import DatabaseAdapter

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: DatabaseAdapter = Depends(get_db)
) -> dict:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await db.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user

async def require_authority(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "AUTHORITY":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Smart City Authority accounts",
        )
    return current_user

async def require_citizen(current_user: dict = Depends(get_current_user)) -> dict:
    # All authenticated users or citizens can access citizen endpoints
    return current_user
