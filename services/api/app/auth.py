"""Customer accounts: registration, login, profile.

Standard-library only (no new dependencies):
  * passwords: scrypt with a per-user random salt, compared in constant time
  * sessions: compact HMAC-SHA256 signed bearer tokens with an expiry
  * brute force: in-memory lockout after repeated failed logins per (ip, email)

Environment:
  SAAKH_SECRET_KEY    signing key. REQUIRED when SAAKH_ENV=production. In development a key is
                      generated once and stored in data/.secret_key.
  SAAKH_TOKEN_TTL_H   token lifetime in hours (default 168 = 7 days)
  SAAKH_REQUIRE_AUTH  "0" disables auth on data endpoints (used by the legacy test suite only)
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlmodel import Field as SField
from sqlmodel import Session, SQLModel, select

from app.db import DB_DIR, get_session

router = APIRouter(prefix="/api/auth", tags=["auth"])

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")
EMPLOYMENT = {"salaried", "self_employed", "business_owner"}

# scrypt cost: n=2**14 (~16 MiB, ~50 ms). Stored in the hash string so it can be raised later.
_SCRYPT_N, _SCRYPT_R, _SCRYPT_P = 2**14, 8, 1


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = SField(default=None, primary_key=True)
    email: str = SField(index=True, unique=True)
    password_hash: str
    full_name: str
    phone: str = ""
    city: str = ""
    employment_type: str = ""
    monthly_income: int = 0
    created_at: str = ""
    last_login: str = ""


# ------------------------------------------------------------------ passwords


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(password.encode(), salt=salt, n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P, maxmem=64 * 1024 * 1024)
    return f"scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt_hex, dk_hex = stored.split("$")
        if scheme != "scrypt":
            return False
        dk = hashlib.scrypt(
            password.encode(), salt=bytes.fromhex(salt_hex), n=int(n), r=int(r), p=int(p), maxmem=64 * 1024 * 1024
        )
        return hmac.compare_digest(dk, bytes.fromhex(dk_hex))
    except Exception:
        return False


_DUMMY_HASH = hash_password("not-a-real-password")  # equalises timing for unknown emails


# --------------------------------------------------------------------- tokens


def _secret() -> bytes:
    env = os.environ.get("SAAKH_SECRET_KEY")
    if env:
        return env.encode()
    if os.environ.get("SAAKH_ENV") == "production":
        raise RuntimeError("SAAKH_SECRET_KEY must be set when SAAKH_ENV=production")
    path: Path = DB_DIR / ".secret_key"
    if not path.exists():
        path.write_text(secrets.token_hex(32), encoding="utf-8")
    return path.read_text(encoding="utf-8").strip().encode()


def check_config() -> None:
    """Fail fast at startup if production is misconfigured."""
    _secret()


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_token(user_id: int) -> str:
    ttl = float(os.environ.get("SAAKH_TOKEN_TTL_H", "168")) * 3600
    body = _b64(json.dumps({"sub": user_id, "exp": int(time.time() + ttl)}, separators=(",", ":")).encode())
    sig = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def read_token(token: str) -> Optional[int]:
    try:
        body, sig = token.split(".")
        good = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, good):
            return None
        data = json.loads(_unb64(body))
        if data["exp"] < time.time():
            return None
        return int(data["sub"])
    except Exception:
        return None


# ----------------------------------------------------------------- lockout

_FAILS: dict[tuple[str, str], list[float]] = {}
_MAX_FAILS, _WINDOW = 5, 600.0


def _locked(key: tuple[str, str]) -> bool:
    now = time.time()
    hits = [t for t in _FAILS.get(key, []) if now - t < _WINDOW]
    _FAILS[key] = hits
    return len(hits) >= _MAX_FAILS


def _fail(key: tuple[str, str]) -> None:
    _FAILS.setdefault(key, []).append(time.time())


# --------------------------------------------------------------------- schemas


def _check_password(v: str) -> str:
    if not (8 <= len(v) <= 128):
        raise ValueError("Password must be 8 to 128 characters.")
    if not (re.search(r"[A-Za-z]", v) and re.search(r"\d", v)):
        raise ValueError("Password must contain at least one letter and one number.")
    return v


class RegisterIn(BaseModel):
    email: str
    password: str
    full_name: str = Field(min_length=2, max_length=80)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) > 254 or not EMAIL_RE.match(v):
            raise ValueError("Enter a valid email address.")
        return v

    @field_validator("password")
    @classmethod
    def _pw(cls, v: str) -> str:
        return _check_password(v)

    @field_validator("full_name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"[A-Za-z .'\-]{2,80}", v):
            raise ValueError("Enter the full name using letters only.")
        return v


class LoginIn(BaseModel):
    email: str
    password: str = Field(max_length=128)


class ProfileIn(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=80)
    phone: Optional[str] = Field(default=None, max_length=15)
    city: Optional[str] = Field(default=None, max_length=60)
    employment_type: Optional[str] = None
    monthly_income: Optional[int] = Field(default=None, ge=0, le=5_000_000)

    @field_validator("full_name")
    @classmethod
    def _name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.fullmatch(r"[A-Za-z .'\-]{2,80}", v):
            raise ValueError("Enter the full name using letters only.")
        return v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        digits = re.sub(r"[ \-]", "", v)
        if not re.fullmatch(r"(\+91)?[6-9]\d{9}", digits):
            raise ValueError("Enter a 10 digit Indian mobile number.")
        return digits

    @field_validator("city")
    @classmethod
    def _city(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v and not re.fullmatch(r"[A-Za-z .'\-]{1,60}", v):
            raise ValueError("Enter a city name using letters only.")
        return v

    @field_validator("employment_type")
    @classmethod
    def _emp(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in EMPLOYMENT:
            raise ValueError("Choose salaried, self_employed or business_owner.")
        return v


class PasswordChangeIn(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _pw(cls, v: str) -> str:
        return _check_password(v)


def public_user(u: User) -> dict[str, Any]:
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "phone": u.phone,
        "city": u.city,
        "employment_type": u.employment_type,
        "monthly_income": u.monthly_income,
        "created_at": u.created_at,
    }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# ---------------------------------------------------------------- dependencies


def current_user(request: Request, session: Session = Depends(get_session)) -> User:
    header = request.headers.get("authorization", "")
    token = header[7:] if header.lower().startswith("bearer ") else ""
    uid = read_token(token) if token else None
    user = session.get(User, uid) if uid else None
    if user is None:
        raise HTTPException(401, "Please sign in to continue.", headers={"WWW-Authenticate": "Bearer"})
    return user


def require_user(request: Request, session: Session = Depends(get_session)) -> Optional[User]:
    """Guard for data endpoints. Disabled only when SAAKH_REQUIRE_AUTH=0 (legacy tests)."""
    if os.environ.get("SAAKH_REQUIRE_AUTH", "1") == "0":
        return None
    return current_user(request, session)


# ------------------------------------------------------------------- endpoints


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return (fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "?"))


@router.post("/register", status_code=201)
def register(body: RegisterIn, request: Request, session: Session = Depends(get_session)) -> dict[str, Any]:
    if session.exec(select(User).where(User.email == body.email)).first():
        raise HTTPException(409, "An account with this email already exists. Sign in instead.")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        created_at=_now(),
        last_login=_now(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"token": make_token(user.id), "user": public_user(user)}


@router.post("/login")
def login(body: LoginIn, request: Request, session: Session = Depends(get_session)) -> dict[str, Any]:
    email = body.email.strip().lower()
    key = (_client_ip(request), email)
    if _locked(key):
        raise HTTPException(429, "Too many failed attempts. Try again in a few minutes.")
    user = session.exec(select(User).where(User.email == email)).first()
    ok = verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
    if not user or not ok:
        _fail(key)
        raise HTTPException(401, "Incorrect email or password.")
    _FAILS.pop(key, None)
    user.last_login = _now()
    session.add(user)
    session.commit()
    return {"token": make_token(user.id), "user": public_user(user)}


@router.get("/me")
def me(user: User = Depends(current_user)) -> dict[str, Any]:
    return public_user(user)


@router.patch("/me")
def update_profile(body: ProfileIn, user: User = Depends(current_user), session: Session = Depends(get_session)) -> dict[str, Any]:
    for k, v in body.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(user, k, v)
    session.add(user)
    session.commit()
    session.refresh(user)
    return public_user(user)


@router.post("/change-password")
def change_password(body: PasswordChangeIn, user: User = Depends(current_user), session: Session = Depends(get_session)) -> dict[str, str]:
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(401, "Current password is incorrect.")
    user.password_hash = hash_password(body.new_password)
    session.add(user)
    session.commit()
    return {"status": "ok"}


@router.delete("/me")
def delete_account(user: User = Depends(current_user), session: Session = Depends(get_session)) -> dict[str, str]:
    session.delete(user)
    session.commit()
    return {"status": "deleted"}
