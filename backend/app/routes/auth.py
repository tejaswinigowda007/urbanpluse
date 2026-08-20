import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import UserRegister, UserLogin, UserResponse, Token
from auth.jwt import get_password_hash, verify_password, create_access_token
from auth.dependencies import get_current_user
from database.connection import get_db
from database.interface import DatabaseAdapter

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegister, db: DatabaseAdapter = Depends(get_db)):
    existing = await db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.datetime.utcnow().isoformat()
    
    user_doc = {
        "id": user_id,
        "name": req.name.strip(),
        "email": req.email.lower().strip(),
        "password_hash": get_password_hash(req.password),
        "role": req.role,
        "created_at": now_str
    }
    
    await db.create_user(user_doc)
    
    access_token = create_access_token(data={"sub": user_id, "role": req.role, "email": user_doc["email"]})
    
    user_resp = UserResponse(
        id=user_id,
        name=user_doc["name"],
        email=user_doc["email"],
        role=user_doc["role"],
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=Token)
async def login(req: UserLogin, db: DatabaseAdapter = Depends(get_db)):
    user = await db.get_user_by_email(req.email)
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"], "email": user["email"]})
    
    user_resp = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )
