from fastapi import FastAPI, Depends, HTTPException, Request, Body, status
from pydantic import BaseModel
from fastapi.exceptions import RequestValidationError
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse, Response
from sqlalchemy.orm import Session
from database import get_db, engine
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import models
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import secrets
import os
import base64
import json
import re
import csv
import io
from dotenv import load_dotenv
from google import genai as google_genai

load_dotenv()

_gemini_client = None


def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise HTTPException(status_code=503, detail="Voice/AI features are not configured.")
        _gemini_client = google_genai.Client(api_key=api_key)
    return _gemini_client

import stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_STARTER = os.environ.get("STRIPE_PRICE_STARTER", "")
STRIPE_PRICE_GROWTH = os.environ.get("STRIPE_PRICE_GROWTH", "")
STRIPE_PRICE_PRO = os.environ.get("STRIPE_PRICE_PRO", "")

TIER_LIMITS = {
    "starter": 5,
    "growth": 15,
    "pro": 30,
}

PRICE_TO_TIER = {
    STRIPE_PRICE_STARTER: "starter",
    STRIPE_PRICE_GROWTH: "growth",
    STRIPE_PRICE_PRO: "pro",
}
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

limiter = Limiter(key_func=get_remote_address)

models.Base.metadata.create_all(bind=engine)

# ── Column migrations (safe to run on every startup) ──────────
with engine.connect() as _conn:
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE schedules ADD COLUMN IF NOT EXISTS color VARCHAR(20)"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE shift_templates ADD COLUMN IF NOT EXISTS color VARCHAR(20)"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE schedules ADD COLUMN IF NOT EXISTS start_time VARCHAR(5)"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_time VARCHAR(5)"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE shift_templates ADD COLUMN IF NOT EXISTS start_time VARCHAR(5)"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE shift_templates ADD COLUMN IF NOT EXISTS end_time VARCHAR(5)"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS track_overtime BOOLEAN DEFAULT FALSE"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS overtime_rate_multiplier NUMERIC(4,2) DEFAULT 1.5"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC DEFAULT 0"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS overtime_rules JSONB"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS premium_hours JSONB"
        ))
        _conn.commit()
    except Exception:
        pass
    for _tbl in ("timesheets", "materials", "mileage"):
        try:
            _conn.execute(__import__("sqlalchemy").text(
                f"ALTER TABLE {_tbl} ADD COLUMN IF NOT EXISTS billed BOOLEAN DEFAULT FALSE"
            ))
            _conn.commit()
        except Exception:
            pass
        try:
            _conn.execute(__import__("sqlalchemy").text(
                f"ALTER TABLE {_tbl} ADD COLUMN IF NOT EXISTS invoice_id INTEGER"
            ))
            _conn.commit()
        except Exception:
            pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_markup_percent NUMERIC(5,2) DEFAULT 15"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS mileage_rate_per_km NUMERIC(6,3) DEFAULT 0.70"
        ))
        _conn.commit()
    except Exception:
        pass
    for _col, _typ in [
        ("estimate_labor_rate_per_hour", "NUMERIC(10,2) DEFAULT 75"),
        ("tax_rate_percent", "NUMERIC(5,2) DEFAULT 0"),
        ("tax_label", "VARCHAR(30) DEFAULT 'HST'"),
    ]:
        try:
            _conn.execute(__import__("sqlalchemy").text(
                f"ALTER TABLE companies ADD COLUMN IF NOT EXISTS {_col} {_typ}"
            ))
            _conn.commit()
        except Exception:
            pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE estimates ADD COLUMN IF NOT EXISTS crew_count INTEGER"
        ))
        _conn.commit()
    except Exception:
        pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE estimates ADD COLUMN IF NOT EXISTS estimated_mileage_km NUMERIC(10,2)"
        ))
        _conn.commit()
    except Exception:
        pass
    for _col, _typ in [
        ("pdf_path", "VARCHAR(500)"),
        ("customer_email", "VARCHAR(255)"),
        ("sent_at", "TIMESTAMP"),
    ]:
        try:
            _conn.execute(__import__("sqlalchemy").text(
                f"ALTER TABLE estimates ADD COLUMN IF NOT EXISTS {_col} {_typ}"
            ))
            _conn.commit()
        except Exception:
            pass
    for _col, _typ in [
        ("first_name", "VARCHAR(100)"),
        ("last_name", "VARCHAR(100)"),
        ("employee_id", "INTEGER"),
        ("is_verified", "BOOLEAN DEFAULT FALSE"),
        ("verification_token", "VARCHAR"),
        ("reset_token", "VARCHAR"),
        ("reset_token_expires", "TIMESTAMP"),
    ]:
        try:
            _conn.execute(__import__("sqlalchemy").text(
                f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {_col} {_typ}"
            ))
            _conn.commit()
        except Exception:
            pass
    for _col, _typ in [
        ("stripe_customer_id", "VARCHAR"),
        ("subscription_status", "VARCHAR(50) DEFAULT 'trial'"),
        ("trial_end_date", "TIMESTAMP"),
        ("subscription_tier", "VARCHAR(50)"),
    ]:
        try:
            _conn.execute(__import__("sqlalchemy").text(
                f"ALTER TABLE companies ADD COLUMN IF NOT EXISTS {_col} {_typ}"
            ))
            _conn.commit()
        except Exception:
            pass
    try:
        _conn.execute(__import__("sqlalchemy").text(
            "UPDATE users SET is_verified = TRUE WHERE verification_token IS NULL AND is_verified = FALSE"
        ))
        _conn.commit()
    except Exception:
        pass

import resend
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-insecure-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(title="Vantage Logic API", version="2.0")
CORS_ORIGINS = [
    "https://app.vantagelogic.ca",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
_extra = os.environ.get("CORS_ORIGINS", "")
if _extra:
    CORS_ORIGINS.extend(o.strip() for o in _extra.split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if origin in CORS_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


@app.exception_handler(RequestValidationError)
async def validation_exception_with_cors(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers=_cors_headers(request),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_with_cors(request: Request, exc: StarletteHTTPException):
    headers = {**(exc.headers or {}), **_cors_headers(request)}
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=headers)


@app.exception_handler(Exception)
async def unhandled_exception_with_cors(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=_cors_headers(request),
    )


def _attr(obj, name, default=None):
    return getattr(obj, name, default) if obj is not None else default


def _company_track_overtime(company) -> bool:
    return bool(_attr(company, "track_overtime", False))


def _company_ot_multiplier(company) -> float:
    val = _attr(company, "overtime_rate_multiplier", None)
    return float(val) if val else 1.5


def _company_overtime_rules(company) -> list:
    rules = _attr(company, "overtime_rules", None)
    if rules and isinstance(rules, list) and len(rules) > 0:
        return rules
    if _company_track_overtime(company):
        return [{"id": "default", "label": "Overtime", "multiplier": _company_ot_multiplier(company)}]
    return []


def _parse_json_param(val):
    if val is None or val == "":
        return None
    if isinstance(val, (dict, list)):
        return val
    try:
        import json
        return json.loads(val)
    except Exception:
        return None


def _employee_rate(emp) -> float:
    if not emp:
        return 0
    if emp.worker_type == "contractor" and emp.hourly_rate:
        return float(emp.hourly_rate)
    if emp.burden_rate:
        return float(emp.burden_rate)
    if emp.hourly_rate:
        return float(emp.hourly_rate)
    return 0


def _timesheet_ot_hours(ts) -> float:
    return float(_attr(ts, "overtime_hours", 0) or 0)


def _timesheet_premium_hours(ts):
    premium = _attr(ts, "premium_hours", None)
    return premium if isinstance(premium, dict) else {}


def _timesheet_labour_cost(ts, emp, company) -> float:
    rate = _employee_rate(emp)
    cost = float(ts.hours_worked or 0) * rate
    premium = _timesheet_premium_hours(ts)
    rules = {r["id"]: r for r in _company_overtime_rules(company)}
    if premium:
        for rule_id, hours in premium.items():
            rule = rules.get(rule_id)
            mult = float(rule["multiplier"]) if rule else _company_ot_multiplier(company)
            cost += float(hours or 0) * rate * mult
    elif _timesheet_ot_hours(ts) > 0:
        cost += _timesheet_ot_hours(ts) * rate * _company_ot_multiplier(company)
    return cost


def send_welcome_email(to_email: str, company_name: str):
    try:
        resend.Emails.send({
            "from": "Vantage Logic <noreply@vantagelogic.ca>",
            "to": to_email,
            "subject": "Welcome to Vantage Logic",
            "html": f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                <div style="margin-bottom: 32px;">
                    <h1 style="font-size: 24px; font-weight: 700; color: #1a3d2b; margin: 0;">Vantage Logic</h1>
                    <div style="height: 2px; background: #c8973a; margin-top: 6px; width: 60px;"></div>
                </div>
                <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px;">Welcome, {company_name}</h2>
                <p style="font-size: 15px; color: #5c5c5c; line-height: 1.6; margin: 0 0 24px;">
                    Your account is ready. Start by adding your jobs, employees, and cost codes from the Admin panel.
                </p>
                <a href="https://app.vantagelogic.ca" style="display: inline-block; padding: 13px 28px; background: #1a3d2b; color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Open Vantage Logic
                </a>
                <p style="font-size: 13px; color: #9a9a9a; margin-top: 32px;">
                    14-day free trial. No credit card required.
                </p>
            </div>
            """
        })
    except Exception as e:
        print(f"Email error: {e}")


def send_crew_welcome_email(to_email: str, company_name: str):
    try:
        resend.Emails.send({
            "from": "Vantage Logic <noreply@vantagelogic.ca>",
            "to": to_email,
            "subject": f"You have been added to {company_name} on Vantage Logic",
            "html": f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                <div style="margin-bottom: 32px;">
                    <h1 style="font-size: 24px; font-weight: 700; color: #1a3d2b; margin: 0;">Vantage Logic</h1>
                    <div style="height: 2px; background: #c8973a; margin-top: 6px; width: 60px;"></div>
                </div>
                <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px;">Your account is ready</h2>
                <p style="font-size: 15px; color: #5c5c5c; line-height: 1.6; margin: 0 0 24px;">
                    {company_name} has added you to Vantage Logic. Log in to track your hours, mileage, and materials.
                </p>
                <a href="https://app.vantagelogic.ca" style="display: inline-block; padding: 13px 28px; background: #1a3d2b; color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Log In Now
                </a>
                <p style="font-size: 13px; color: #9a9a9a; margin-top: 32px;">
                    Your login email is {to_email}. Contact your administrator if you need help with your password.
                </p>
            </div>
            """
        })
    except Exception as e:
        print(f"Email error: {e}")

def send_verification_email(to_email: str, token: str):
    link = f"https://app.vantagelogic.ca/?verify={token}"
    try:
        resend.Emails.send({
            "from": "Vantage Logic <noreply@vantagelogic.ca>",
            "to": to_email,
            "subject": "Verify your Vantage Logic account",
            "html": f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                <div style="margin-bottom: 32px;">
                    <h1 style="font-size: 24px; font-weight: 700; color: #1a3d2b; margin: 0;">Vantage Logic</h1>
                    <div style="height: 2px; background: #c8973a; margin-top: 6px; width: 60px;"></div>
                </div>
                <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px;">Confirm your email</h2>
                <p style="font-size: 15px; color: #5c5c5c; line-height: 1.6; margin: 0 0 24px;">
                    Click below to verify your email and activate your account.
                </p>
                <a href="{link}" style="display: inline-block; padding: 13px 28px; background: #1a3d2b; color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Verify Email
                </a>
                <p style="font-size: 13px; color: #9a9a9a; margin-top: 32px;">
                    If you didn't create this account, you can ignore this email.
                </p>
            </div>
            """
        })
    except Exception as e:
        print(f"Email error: {e}")


def send_reset_email(to_email: str, token: str):
    link = f"https://app.vantagelogic.ca/?reset={token}"
    try:
        resend.Emails.send({
            "from": "Vantage Logic <noreply@vantagelogic.ca>",
            "to": to_email,
            "subject": "Reset your Vantage Logic password",
            "html": f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                <div style="margin-bottom: 32px;">
                    <h1 style="font-size: 24px; font-weight: 700; color: #1a3d2b; margin: 0;">Vantage Logic</h1>
                    <div style="height: 2px; background: #c8973a; margin-top: 6px; width: 60px;"></div>
                </div>
                <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px;">Reset your password</h2>
                <p style="font-size: 15px; color: #5c5c5c; line-height: 1.6; margin: 0 0 24px;">
                    Click below to set a new password. This link expires in 1 hour.
                </p>
                <a href="{link}" style="display: inline-block; padding: 13px 28px; background: #1a3d2b; color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Reset Password
                </a>
                <p style="font-size: 13px; color: #9a9a9a; margin-top: 32px;">
                    If you didn't request this, you can ignore this email.
                </p>
            </div>
            """
        })
    except Exception as e:
        print(f"Email error: {e}")

# =============================================
# AUTH HELPERS
# =============================================

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def hash_password(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def require_owner(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Owner or admin access required")
    return current_user

from cost_plus import register_cost_plus_routes
register_cost_plus_routes(app, get_db, get_current_user, require_owner, _timesheet_labour_cost)


def _has_route(path: str) -> bool:
    return any(getattr(r, "path", None) == path for r in app.routes)

# =============================================
# HEALTH CHECK
# =============================================

@app.get("/")
def root():
    return {
        "message": "Vantage Logic API v2 is running",
        "estimating": _has_route("/job-types"),
    }


@app.get("/health/features")
def health_features():
    return {
        "estimating": _has_route("/job-types"),
        "estimate_templates": _has_route("/estimate-templates"),
    }

# =============================================
# AUTH
# =============================================

@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if user.is_verified is False and user.verification_token:
        raise HTTPException(status_code=403, detail="Please verify your email before signing in. Check your inbox for the verification link.")
    token = create_access_token({"user_id": user.user_id, "company_id": user.company_id, "role": user.role})
    company = db.query(models.Company).filter(models.Company.company_id == user.company_id).first()
    sub_status = "active"
    if company:
        if company.subscription_status == "active":
            sub_status = "active"
        elif company.trial_end_date and datetime.utcnow() < company.trial_end_date:
            sub_status = "trial"
        else:
            sub_status = "expired"
    return {"access_token": token, "token_type": "bearer", "role": user.role, "company_id": user.company_id, "subscription_status": sub_status}

# =============================================
# COMPANIES
# =============================================

@app.post("/companies")
def create_company(company_name: str, db: Session = Depends(get_db)):
    company = models.Company(company_name=company_name)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@app.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    return db.query(models.Company).all()

# =============================================
# PUBLIC SIGNUP
# =============================================

@app.post("/signup")
@limiter.limit("5/minute")
def signup(
    request: Request,
    company_name: str,
    email: str,
    password: str,
    first_name: str = None, 
    last_name: str = None,
    db: Session = Depends(get_db)
):
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    company = models.Company(
    company_name=company_name,
    trial_status="trial",
    subscription_status="trial",
    trial_end_date=datetime.utcnow() + timedelta(days=14)
)
    db.add(company)
    db.commit()
    db.refresh(company)

    verification_token = secrets.token_urlsafe(32)
    auto_verify = not os.environ.get("RESEND_API_KEY")

    user = models.User(
        company_id=company.company_id,
        email=email,
        hashed_password=hash_password(password),
        role="owner",
        is_verified=auto_verify,
        verification_token=None if auto_verify else verification_token,
        first_name=first_name,
        last_name=last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if not auto_verify:
        send_verification_email(email, verification_token)
    if auto_verify:
        return {
            "message": "Account created. You can sign in now.",
            "email": email,
        }
    return {
        "message": "Account created. Check your email to verify your account before signing in.",
        "email": email
    }

@app.get("/verify-email")
@limiter.limit("10/minute")
def verify_email(request: Request, token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    user.is_verified = True
    user.verification_token = None
    db.commit()

    company = db.query(models.Company).filter(models.Company.company_id == user.company_id).first()
    if company:
        send_welcome_email(user.email, company.company_name)

    access_token = create_access_token({"user_id": user.user_id, "company_id": user.company_id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "company_id": user.company_id}


@app.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        send_reset_email(email, reset_token)
    # Always return success so we don't reveal whether an email exists
    return {"message": "If an account with that email exists, a reset link has been sent."}


@app.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, token: str, new_password: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.reset_token == token).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"message": "Password updated. You can now sign in."}

@app.post("/create-checkout-session")
def create_checkout_session(
    price_id: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company = db.query(models.Company).filter(models.Company.company_id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Use provided price_id or default to growth tier
    selected_price = price_id if price_id in PRICE_TO_TIER else STRIPE_PRICE_GROWTH
    
    try:
        if not company.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=company.company_name,
                metadata={"company_id": company.company_id}
            )
            company.stripe_customer_id = customer.id
            db.commit()
        session = stripe.checkout.Session.create(
            customer=company.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": selected_price, "quantity": 1}],
            mode="subscription",
            success_url="https://app.vantagelogic.ca/?payment=success",
            cancel_url="https://app.vantagelogic.ca/?payment=cancelled",
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    if event["type"] == "checkout.session.completed":
        session_obj = event["data"]["object"]
        customer_id = session_obj.get("customer")
        if customer_id:
            company = db.query(models.Company).filter(models.Company.stripe_customer_id == customer_id).first()
            if company:
                company.subscription_status = "active"
                subscription = stripe.Subscription.retrieve(session_obj.get("subscription"))
                price_id = subscription["items"]["data"][0]["price"]["id"]
                company.subscription_tier = PRICE_TO_TIER.get(price_id, "growth")
                db.commit()
    elif event["type"] == "customer.subscription.deleted":
        customer_id = event["data"]["object"].get("customer")
        if customer_id:
            company = db.query(models.Company).filter(models.Company.stripe_customer_id == customer_id).first()
            if company:
                company.subscription_status = "expired"
                db.commit()
    return {"received": True}


@app.get("/subscription-status")
def get_subscription_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company = db.query(models.Company).filter(models.Company.company_id == current_user.company_id).first()
    if not company:
        return {"status": "active", "days_remaining": None, "tier": None, "crew_count": 0, "tier_limit": None}
    
    crew_count = db.query(models.Employee).filter(
        models.Employee.company_id == current_user.company_id,
        models.Employee.active == True
    ).count()

    tier = company.subscription_tier
    tier_limit = TIER_LIMITS.get(tier) if tier else None

    if company.subscription_status == "active":
        return {"status": "active", "days_remaining": None, "tier": tier, "crew_count": crew_count, "tier_limit": tier_limit}
    if company.trial_end_date:
        remaining = (company.trial_end_date - datetime.utcnow()).days
        if remaining > 0:
            return {"status": "trial", "days_remaining": remaining, "tier": tier, "crew_count": crew_count, "tier_limit": tier_limit}
    return {"status": "expired", "days_remaining": 0, "tier": tier, "crew_count": crew_count, "tier_limit": tier_limit}

# =============================================
# USERS
# =============================================

@app.post("/users")
def create_user(
    company_id: int,
    email: str,
    password: str,
    role: str = "crew",
    employee_id: int = None,
    db: Session = Depends(get_db)
):
    existing = db.query(models.User).filter(models.User.email == email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        company_id=company_id,
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        role=role,
        employee_id=employee_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    company = db.query(models.Company).filter(models.Company.company_id == company_id).first()
    company_name = company.company_name if company else "Your company"
    send_crew_welcome_email(email, company_name)
    return {"user_id": user.user_id, "email": user.email, "role": user.role}

@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.company_id == current_user.company_id).first()
    return {
    "user_id": current_user.user_id,
    "email": current_user.email,
    "role": current_user.role,
    "company_id": current_user.company_id,
    "employee_id": current_user.employee_id,
    "first_name": current_user.first_name,
    "last_name": current_user.last_name,
    "track_overtime": _company_track_overtime(company),
    "overtime_rate_multiplier": _company_ot_multiplier(company),
    "overtime_rules": _company_overtime_rules(company),
    "mileage_rate_per_km": float(getattr(company, "mileage_rate_per_km", None) or 0.70),
    "estimate_labor_rate_per_hour": float(getattr(company, "estimate_labor_rate_per_hour", None) or 75),
    "tax_rate_percent": float(getattr(company, "tax_rate_percent", None) or 0),
    "tax_label": getattr(company, "tax_label", None) or "HST",
    "default_markup_percent": float(getattr(company, "default_markup_percent", None) or 15),
}

@app.get("/users")
def get_users(current_user: models.User = Depends(require_owner), db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.company_id == current_user.company_id).all()
    result = []
    for u in users:
        emp = None
        if u.employee_id:
            emp = db.query(models.Employee).filter(models.Employee.employee_id == u.employee_id).first()
        result.append({
            "user_id": u.user_id,
            "email": u.email,
            "role": u.role,
            "employee_id": u.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else None,
            "active": u.active
        })
    return result

@app.patch("/users/{user_id}")
def update_user(
    user_id: int,
    employee_id: int = None,
    role: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.user_id == user_id,
        models.User.company_id == current_user.company_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if employee_id is not None: user.employee_id = employee_id if employee_id > 0 else None
    if role is not None: user.role = role
    db.commit()
    db.refresh(user)
    return {"user_id": user.user_id, "email": user.email, "role": user.role, "employee_id": user.employee_id}

# =============================================
# EMPLOYEES
# =============================================

@app.get("/employees")
def get_employees(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Employee).filter(
        models.Employee.company_id == current_user.company_id,
        models.Employee.active == True
    ).all()

@app.get("/employees/all")
def get_all_employees(current_user: models.User = Depends(require_owner), db: Session = Depends(get_db)):
    return db.query(models.Employee).filter(
        models.Employee.company_id == current_user.company_id
    ).all()

@app.post("/employees")
def create_employee(
    first_name: str,
    last_name: str,
    role: str = None,
    trade_level: str = None,
    hourly_rate: float = None,
    burden_rate: float = None,
    worker_type: str = "employee",
    phone: str = None,
    email: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    employee = models.Employee(
        company_id=current_user.company_id,
        first_name=first_name,
        last_name=last_name,
        role=role,
        trade_level=trade_level,
        hourly_rate=hourly_rate,
        burden_rate=burden_rate,
        worker_type=worker_type,
        phone=phone,
        email=email
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

@app.patch("/employees/{employee_id}/deactivate")
def deactivate_employee(
    employee_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    employee = db.query(models.Employee).filter(
        models.Employee.employee_id == employee_id,
        models.Employee.company_id == current_user.company_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee.active = False
    db.commit()
    return {"message": f"{employee.first_name} {employee.last_name} deactivated"}

@app.patch("/employees/{employee_id}/activate")
def activate_employee(
    employee_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    employee = db.query(models.Employee).filter(
        models.Employee.employee_id == employee_id,
        models.Employee.company_id == current_user.company_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee.active = True
    db.commit()
    return {"message": f"{employee.first_name} {employee.last_name} activated"}

@app.patch("/employees/{employee_id}")
def update_employee(
    employee_id: int,
    first_name: str = None,
    last_name: str = None,
    role: str = None,
    trade_level: str = None,
    hourly_rate: float = None,
    burden_rate: float = None,
    worker_type: str = None,
    phone: str = None,
    email: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(
        models.Employee.employee_id == employee_id,
        models.Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if first_name is not None: emp.first_name = first_name
    if last_name is not None: emp.last_name = last_name
    if role is not None: emp.role = role
    if trade_level is not None: emp.trade_level = trade_level
    if hourly_rate is not None: emp.hourly_rate = hourly_rate
    if burden_rate is not None: emp.burden_rate = burden_rate
    if worker_type is not None: emp.worker_type = worker_type
    if phone is not None: emp.phone = phone
    if email is not None: emp.email = email
    db.commit()
    db.refresh(emp)
    return emp

# =============================================
# JOBS
# =============================================

@app.get("/jobs")
def get_jobs(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Job).filter(
        models.Job.company_id == current_user.company_id
    ).all()

@app.post("/jobs")
def create_job(
    job_name: str,
    job_code: str = None,
    street: str = None,
    city: str = None,
    province: str = None,
    postal_code: str = None,
    contract_value: float = None,
    budgeted_hours: float = None,
    budgeted_materials_cost: float = None,
    notes: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    job = models.Job(
        company_id=current_user.company_id,
        job_name=job_name,
        job_code=job_code,
        street=street,
        city=city,
        province=province,
        postal_code=postal_code,
        contract_value=contract_value,
        budgeted_hours=budgeted_hours,
        budgeted_materials_cost=budgeted_materials_cost,
        notes=notes
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@app.patch("/jobs/{job_id}/status")
def update_job_status(
    job_id: int,
    status: str,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    job = db.query(models.Job).filter(
        models.Job.job_id == job_id,
        models.Job.company_id == current_user.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = status
    db.commit()
    return {"message": f"Job status updated to {status}"}

@app.patch("/jobs/{job_id}/deactivate")
def deactivate_job(
    job_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    job = db.query(models.Job).filter(
        models.Job.job_id == job_id,
        models.Job.company_id == current_user.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "inactive"
    db.commit()
    return {"message": f"{job.job_name} deactivated"}

@app.patch("/jobs/{job_id}")
def update_job(
    job_id: int,
    job_name: str = None,
    job_code: str = None,
    city: str = None,
    province: str = None,
    street: str = None,
    postal_code: str = None,
    contract_value: float = None,
    budgeted_hours: float = None,
    budgeted_materials_cost: float = None,
    notes: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    job = db.query(models.Job).filter(
        models.Job.job_id == job_id,
        models.Job.company_id == current_user.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job_name is not None: job.job_name = job_name
    if job_code is not None: job.job_code = job_code
    if city is not None: job.city = city
    if province is not None: job.province = province
    if street is not None: job.street = street
    if postal_code is not None: job.postal_code = postal_code
    if contract_value is not None: job.contract_value = contract_value
    if budgeted_hours is not None: job.budgeted_hours = budgeted_hours
    if budgeted_materials_cost is not None: job.budgeted_materials_cost = budgeted_materials_cost
    if notes is not None: job.notes = notes
    db.commit()
    db.refresh(job)
    return job

# =============================================
# COST CODES
# =============================================

@app.get("/cost-codes")
def get_cost_codes(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.CostCode).filter(
        models.CostCode.company_id == current_user.company_id
    ).all()

@app.post("/cost-codes")
def create_cost_code(
    code: str,
    description: str,
    category: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    cost_code = models.CostCode(
        company_id=current_user.company_id,
        code=code,
        description=description,
        category=category
    )
    db.add(cost_code)
    db.commit()
    db.refresh(cost_code)
    return cost_code

@app.patch("/cost-codes/{cost_code_id}/deactivate")
def deactivate_cost_code(
    cost_code_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    cc = db.query(models.CostCode).filter(
        models.CostCode.cost_code_id == cost_code_id,
        models.CostCode.company_id == current_user.company_id
    ).first()
    if not cc:
        raise HTTPException(status_code=404, detail="Cost code not found")
    cc.active = False
    db.commit()
    return {"message": f"{cc.code} deactivated"}

@app.patch("/cost-codes/{cost_code_id}")
def update_cost_code(
    cost_code_id: int,
    code: str = None,
    description: str = None,
    category: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    cc = db.query(models.CostCode).filter(
        models.CostCode.cost_code_id == cost_code_id,
        models.CostCode.company_id == current_user.company_id
    ).first()
    if not cc:
        raise HTTPException(status_code=404, detail="Cost code not found")
    if code is not None: cc.code = code
    if description is not None: cc.description = description
    if category is not None: cc.category = category
    db.commit()
    db.refresh(cc)
    return cc

@app.delete("/cost-codes/{cost_code_id}")
def delete_cost_code(
    cost_code_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cc = db.query(models.CostCode).filter(
        models.CostCode.cost_code_id == cost_code_id,
        models.CostCode.company_id == current_user.company_id
    ).first()
    if not cc:
        raise HTTPException(status_code=404, detail="Cost code not found")

    # Refuse to delete if the cost code is still in use anywhere
    used_in_timesheets = db.query(models.Timesheet).filter(models.Timesheet.cost_code_id == cost_code_id).first()
    used_in_materials = db.query(models.Material).filter(models.Material.cost_code_id == cost_code_id).first()
    used_in_schedules = db.query(models.Schedule).filter(models.Schedule.cost_code_id == cost_code_id).first()
    used_in_budgets = db.query(models.JobBudget).filter(models.JobBudget.cost_code_id == cost_code_id).first()

    if used_in_timesheets or used_in_materials or used_in_schedules or used_in_budgets:
        raise HTTPException(
            status_code=400,
            detail="This cost code is in use on timesheets, materials, or schedules and cannot be deleted. You can edit it instead."
        )

    db.delete(cc)
    db.commit()
    return {"deleted": True}

# =============================================
# TIMESHEETS
# =============================================

@app.get("/timesheets")
def get_timesheets(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Timesheet).filter(
        models.Timesheet.company_id == current_user.company_id
    ).all()

@app.get("/jobs/{job_id}/timesheets")
def get_job_timesheets(
    job_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    timesheets = db.query(models.Timesheet).filter(
        models.Timesheet.job_id == job_id,
        models.Timesheet.company_id == current_user.company_id
    ).all()

    result = []
    for t in timesheets:
        emp = db.query(models.Employee).filter(
            models.Employee.employee_id == t.employee_id
        ).first()
        result.append({
            "timesheet_id": t.timesheet_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "shift_date": str(t.shift_date),
            "hours_worked": float(t.hours_worked),
            "overtime_hours": _timesheet_ot_hours(t),
            "premium_hours": _timesheet_premium_hours(t),
            "field_notes": t.field_notes,
        })
    return result

@app.get("/jobs/{job_id}/materials")
def get_job_materials(
    job_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    materials = db.query(models.Material).filter(
        models.Material.job_id == job_id,
        models.Material.company_id == current_user.company_id
    ).all()

    result = []
    for m in materials:
        emp = db.query(models.Employee).filter(
            models.Employee.employee_id == m.purchased_by
        ).first()
        result.append({
            "material_id": m.material_id,
            "supplier": m.supplier,
            "description": m.description,
            "total_cost": float(m.total_cost or 0),
            "purchase_date": str(m.purchase_date),
            "purchased_by": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "notes": m.notes,
        })
    return result

@app.post("/timesheets")
def create_timesheet(
    job_id: int,
    employee_id: int,
    cost_code_id: int,
    shift_date: str,
    hours_worked: float,
    overtime_hours: float = 0,
    premium_hours: str = None,
    field_notes: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    parsed_premium = _parse_json_param(premium_hours)
    if parsed_premium and isinstance(parsed_premium, dict):
        overtime_hours = sum(float(v or 0) for v in parsed_premium.values())
    timesheet_kwargs = dict(
        company_id=current_user.company_id,
        job_id=job_id,
        employee_id=employee_id,
        cost_code_id=cost_code_id,
        shift_date=shift_date,
        hours_worked=hours_worked,
        overtime_hours=overtime_hours,
        field_notes=field_notes,
    )
    if parsed_premium and hasattr(models.Timesheet, "premium_hours"):
        timesheet_kwargs["premium_hours"] = parsed_premium
    timesheet = models.Timesheet(**timesheet_kwargs)
    db.add(timesheet)
    db.commit()
    db.refresh(timesheet)
    return timesheet

@app.delete("/timesheets/{timesheet_id}")
def delete_timesheet(
    timesheet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ts = db.query(models.Timesheet).filter(
        models.Timesheet.timesheet_id == timesheet_id,
        models.Timesheet.company_id == current_user.company_id
    ).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(ts)
    db.commit()
    return {"deleted": True}

# =============================================
# MATERIALS
# =============================================

@app.get("/materials")
def get_materials(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Material).filter(
        models.Material.company_id == current_user.company_id
    ).all()

@app.post("/materials")
def create_material(
    job_id: int,
    description: str,
    cost_code_id: int = None,
    purchased_by: int = None,
    supplier: str = None,
    quantity: float = None,
    unit_cost: float = None,
    total_cost: float = None,
    purchase_date: str = None,
    notes: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    material = models.Material(
        company_id=current_user.company_id,
        job_id=job_id,
        cost_code_id=cost_code_id,
        purchased_by=purchased_by,
        description=description,
        supplier=supplier,
        quantity=quantity,
        unit_cost=unit_cost,
        total_cost=total_cost,
        notes=notes
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material

class ReceiptRequest(BaseModel):
    image_base64: str

@app.post("/receipts/parse")
def parse_receipt(
    request: Request,
    job_id: int,
    cost_code_id: int = None,
    body: ReceiptRequest = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify job belongs to this company
    job = db.query(models.Job).filter(
        models.Job.job_id == job_id,
        models.Job.company_id == current_user.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        # Decode base64 to raw bytes
        image_bytes = base64.b64decode(body.image_base64)

# Build the prompt
        prompt = """You are a receipt parser. Extract all line items from this receipt image.
Return ONLY a JSON object with this exact structure, no other text:
{
  "vendor": "store name or empty string",
  "total": 0.00,
  "items": [
    {"description": "item name", "quantity": 1, "unit_price": 0.00, "line_total": 0.00}
  ]
}
If you cannot read the receipt clearly, return {"error": "could not parse receipt"}."""

        # Send to Gemini
        from google.genai import types
        response = get_gemini_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
            ]
        )

        raw = response.text.strip()

        # Strip markdown fences if present
        raw = re.sub(r"```json\s*", "", raw)
        raw = re.sub(r"```\s*", "", raw)
        raw = raw.strip()

        # Find JSON object defensively if there's surrounding text
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            raw = match.group(0)

        parsed = json.loads(raw)

        if "error" in parsed:
            return {"success": False, "message": parsed["error"]}

        return {
            "success": True,
            "vendor": parsed.get("vendor", ""),
            "total": parsed.get("total", 0),
            "items": parsed.get("items", [])
        }

    except json.JSONDecodeError:
        return {"success": False, "message": "Could not parse the receipt. Please try again or enter manually."}
    except Exception as e:
        print(f"Receipt parse error: {e}")
        return {"success": False, "message": "Something went wrong. Please try again."}
    
class VoiceRequest(BaseModel):
    transcript: str

@app.post("/voice/parse-timesheet")
def parse_voice_timesheet(
    body: VoiceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        jobs = db.query(models.Job).filter(
            models.Job.company_id == current_user.company_id,
            models.Job.status == "active"
        ).all()
        cost_codes = db.query(models.CostCode).filter(
            models.CostCode.company_id == current_user.company_id
        ).all()

        job_names = [j.job_name for j in jobs]
        cc_names = [f"{c.code} {c.description}" for c in cost_codes]

        prompt = f"""Extract a timesheet entry from this voice note: "{body.transcript}"

Available jobs: {job_names}
Available cost codes: {cc_names}

Return ONLY a JSON object with this exact structure, no other text:
{{
  "hours": 0.0,
  "job_name": "closest matching job name from the list or empty string",
  "cost_code": "closest matching cost code from the list or empty string",
  "notes": "brief 1-sentence summary of any extra context, issues, or observations mentioned. Empty string if nothing extra."
}}

Match job_name and cost_code to the closest option from the lists provided. If nothing matches, return empty string. Hours should be a number — convert phrases like 'half a day' to 4.0 or 'six and a half' to 6.5."""

        from google.genai import types
        response = get_gemini_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt]
        )

        raw = response.text.strip()
        raw = re.sub(r"```json\s*", "", raw)
        raw = re.sub(r"```\s*", "", raw)
        raw = raw.strip()
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            raw = match.group(0)

        parsed = json.loads(raw)
        return {"success": True, **parsed}

    except json.JSONDecodeError:
        return {"success": False, "message": "Could not parse the voice entry. Please try again."}
    except Exception as e:
        print(f"Voice parse error: {e}")
        return {"success": False, "message": "Something went wrong. Please try again."}
    
@app.post("/voice/parse-entry")
def parse_voice_entry(
    body: VoiceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        jobs = db.query(models.Job).filter(
            models.Job.company_id == current_user.company_id,
            models.Job.status == "active"
        ).all()
        cost_codes = db.query(models.CostCode).filter(
            models.CostCode.company_id == current_user.company_id
        ).all()

        job_names = [j.job_name for j in jobs]
        cc_list = [{"id": c.cost_code_id, "label": f"{c.code} {c.description}"} for c in cost_codes]
        cc_names = [c["label"] for c in cc_list]

        prompt = f"""You are a field entry assistant for a trades contractor app.
Analyze this voice note and extract a structured entry: "{body.transcript}"

Available jobs: {job_names}
Available cost codes: {cc_names}

Determine the entry type based on what was said:
- "timesheet": if they mention hours worked, time on a job, or a shift
- "material": if they mention buying something, a purchase, a supply, or a cost
- "mileage": if they mention driving, km, distance, or travel
- "request": if they mention needing something, reporting an issue, a safety concern, or asking for approval

Return ONLY a JSON object with this exact structure, no other text:
{{
  "type": "timesheet|material|mileage|request",
  "hours": 0.0,
  "overtime_hours": 0.0,
  "job_name": "closest matching job name from the list or empty string",
  "cost_code": "closest matching cost code label from the list or empty string",
  "cost_code_confidence": "high|low",
  "amount": 0.0,
  "description": "what was bought or description of request",
  "km": 0.0,
  "request_type": "Additional Materials|Equipment Issue|Safety Concern|Scope Change|Other",
  "notes": "brief 1-sentence summary of any extra context. Empty string if nothing extra."
}}

Rules:
- Only fill fields relevant to the detected type
- cost_code_confidence is "high" if you are confident in the match, "low" if uncertain
- For materials, amount is the dollar value if mentioned
- Convert phrases like "half a day" to 4.0, "six and a half hours" to 6.5
- Match job_name to the closest option from the list
- For overtime: if they mention overtime as part of a larger total (e.g. "10 hours today, 2 of those were overtime"), put the regular portion in "hours" and the overtime portion in "overtime_hours". If overtime is mentioned as its own standalone statement (e.g. "log 4 hours overtime on the Johnson job"), put 0 in "hours" and the full amount in "overtime_hours" unless regular hours were also stated separately. If overtime isn't mentioned at all, "overtime_hours" should be 0.0"""

        from google.genai import types
        response = get_gemini_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt]
        )

        raw = response.text.strip()
        raw = re.sub(r"```json\s*", "", raw)
        raw = re.sub(r"```\s*", "", raw)
        raw = raw.strip()
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            raw = match.group(0)

        parsed = json.loads(raw)
        return {"success": True, **parsed}

    except json.JSONDecodeError:
        return {"success": False, "message": "Could not parse. Please try again."}
    except Exception as e:
        print(f"Voice parse error: {e}")
        return {"success": False, "message": "Something went wrong. Please try again."}

class HelpChatRequest(BaseModel):
    message: str
    role: str = "crew"

@app.post("/help-chat")
def help_chat(
    body: HelpChatRequest,
    current_user: models.User = Depends(get_current_user)
):
    system_prompt = f"""You are a friendly, concise in-app support assistant for VantageLogic — a job costing and crew tracking platform built specifically for trades businesses (contractors, electricians, framers, plumbers, etc.).

The user's role is: {body.role}
Only show role-relevant information. If the user is "crew", focus on logging and their schedule. If "owner" or "admin", focus on setup, dashboard, scheduling, and management.

---
WHAT VANTAGELOGIC DOES:
VantageLogic helps trades companies track where their money goes on every job in real time. Crew log their hours, materials, and mileage from their phones. Admins see live job profitability, schedule shifts, manage inventory, and respond to crew requests — all in one place.

---
KEY TERMS (explain these clearly if asked):

Job: A project or contract you are working on. Example: "Smith House Framing" or "123 Main St Renovation". Every timesheet, material purchase, and mileage trip is linked to a job so you can see exactly what each job costs.

Cost Code: A label that categorizes the TYPE of work being done on a job. Examples: FRAM (Framing), ELEC (Electrical Rough-In), FINISH (Finishing), DEMO (Demolition). Your admin sets these up. When you log hours, you pick the cost code that matches what you were doing. This helps the company understand where labour time is being spent.

Contract Value: The total dollar amount the client agreed to pay for the job. Used to calculate profit margin.

Budgeted Hours: How many hours the admin estimated the job would take. The dashboard shows a progress bar comparing actual hours vs. budgeted hours.

Margin: Contract Value minus Total Cost (labour + materials). Positive = profitable. Negative = over budget. Shown as a percentage and dollar amount on each job card.

Burden Rate: An additional cost per hour on top of the employee's base hourly rate, covering things like payroll taxes, CPP, EI, and benefits. Optional — leave blank if not used.

Shift Template: A reusable preset that admins create to save time scheduling. A template stores: a name, job, cost code, hours, start/end time, and a color. On the schedule calendar, admins drag templates onto crew member rows to assign shifts quickly.

Timesheet: A record of hours worked. Fields: Employee, Job, Cost Code, Date, Hours Worked, Field Notes (optional). If your owner has turned on overtime tracking in Setup, you'll also see a checkbox to add Overtime Hours separately.

Material Log: A record of a purchase made for a job. Fields: Employee, Job, Cost Code, Description of item, Supplier, Quantity, Unit Cost (app calculates total), Purchase Date, Notes.

Mileage Log: A record of kilometres driven for a job. Fields: Employee, Job, Trip Date, Kilometres Driven, Purpose, Notes.

Request: A message from a crew member to their admin asking for something — materials, equipment, time off, or other. Admins can approve or deny requests and communicate through a comment thread on each request.

Inventory: A list of the company's tools, equipment, and stock items with quantities and prices. Crew can request inventory items through the Requests screen.

Change Order: An addition or deduction to a job's contract value. Admins can log these from the Dashboard when scope changes.

Overtime Tracking: An optional company-wide setting (Setup → Overtime). When turned on, crew see a checkbox to log overtime hours separately from regular hours on every timesheet. The owner sets a multiplier (default 1.5x) that determines how overtime hours are costed on the Dashboard.

---
NAVIGATION:

CREW (bottom navigation bar):
- Home: Your personal dashboard. Shows your stats for the week (hours, jobs, km), your scheduled shifts by day, quick log buttons, and the voice logging feature.
- Log: Opens a choice screen — tap Hours, Materials, or Mileage to log that type of entry. When you're inside one of these, the nav bar changes to show Home | Hours | Materials | Mileage so you can switch between them easily.
- Requests: Submit requests to your admin and track their status. Tap any request to see the comment thread.
- Settings: Update your name, email, and password.

ADMIN/OWNER (left sidebar on desktop, bottom bar on mobile):
- Schedule: Assign shifts to crew members. Desktop shows a weekly drag-and-drop grid. Mobile shows a vertical day list with an Add Shift button.
- Dashboard: Live profitability for all jobs. Filter by All/Active/Completed. Tap a job to expand and see timesheets, materials, and change orders.
- Inventory: Manage stock items. Add, edit, or deactivate items. See current quantities.
- Requests: Review all crew requests. Approve or deny with an optional reason. Reply via comment threads.
- Setup (Admin): Jobs, Your Crew, Cost Codes, Crew App Access, Your Account (name, company name, password), and Overtime (toggle and rate).

---
HOW TO DO COMMON TASKS:

LOG HOURS (crew):
1. Tap Log in the bottom nav bar
2. Tap Hours
3. Select your name from Employee dropdown
4. Select the Job you worked on
5. Select the Cost Code (type of work)
6. Set the Date (defaults to today)
7. Enter Hours Worked
8. If your owner has turned on overtime tracking, check "Add overtime hours" and enter the amount
9. Add Field Notes if needed (optional)
10. Tap Submit Timesheet
You'll see a confirmation. Tap "Log Another" to add another entry.

LOG MATERIALS (crew):
1. Tap Log → Materials
2. Select Employee, Job, Cost Code
3. Enter Description (what you bought — be specific, e.g. "2x4x8 SPF studs x50")
4. Enter Supplier name (optional but helpful)
5. Enter Quantity and Unit Cost — the app calculates Total Cost automatically
6. Set Purchase Date
7. Add Notes if needed
8. Tap Submit Material Log

LOG MILEAGE (crew):
1. Tap Log → Mileage
2. Select Employee and Job
3. Set Trip Date
4. Enter Kilometres Driven (total round trip or one way — be consistent with your company's policy)
5. Enter Purpose (e.g. "Site visit to pick up materials")
6. Tap Submit Mileage

VOICE LOGGING (crew):
1. On the Home screen, tap the microphone button
2. Speak clearly and naturally. Examples:
   - "Log 8 hours on Smith House, framing, today"
   - "Log 4 hours overtime on the Johnson project for electrical work"
   - "Log 45 kilometres for a trip to the Johnson site"
   - "I need to request 10 sheets of drywall for the Main Street job"
3. The app processes your speech and shows a summary card
4. Review the pre-filled details — you can correct anything that was misheard
5. Tap "Review and Submit" to go to the full form with your details pre-filled
6. Tap Submit on the form to save the entry
Note: Requires microphone permission. The app never saves your voice recording.

SUBMIT A REQUEST (crew):
1. Tap Requests in the bottom nav
2. Tap + New Request
3. Select the Job the request relates to
4. Choose Request Type: Additional Materials, Equipment, Time Off, Safety Concern, or Other
5. For material requests: select the inventory item and enter quantity needed
6. Write a Description explaining what you need
7. Tap Submit Request
Your admin will be notified and can approve, deny, or message you back through the comment thread.

CREATE A JOB (admin):
1. Go to Setup → Jobs tab
2. Fill in Job Name (required), Job Code (optional reference), City (optional)
3. Enter Contract Value — the dollar amount the client is paying
4. Enter Budgeted Hours — your estimated hours for the job
5. Tap Add Job
Tip: Even rough estimates help the Dashboard flag jobs that are running over budget.

ADD AN EMPLOYEE (admin):
1. Go to Setup → Employees tab
2. Fill in First Name, Last Name, Role (job title), Hourly Rate, Burden Rate (optional)
3. Select Worker Type: Employee or Subcontractor
4. Tap Add Employee
To edit later: tap Edit next to any employee. To remove from scheduling: tap Deactivate (their historical data is preserved).

ADD COST CODES (admin):
1. Go to Setup → Cost Codes tab
2. Enter a short Code (e.g. FRAM), a Description (e.g. Framing), and a Category (e.g. Labour)
3. Tap Add Cost Code
Tip: Set these up before your crew starts logging — they need to select a cost code on every timesheet.

GIVE CREW APP ACCESS (admin):
1. Go to Setup → Crew Access tab
2. Enter the crew member's Email and a temporary Password (they can change it in Settings)
3. Select their Role: Crew or Admin
4. Link them to an Employee record so their timesheets are properly attributed
5. Tap Create Login
6. Share the link app.vantagelogic.ca with them and give them the email/password

CREATE A SHIFT TEMPLATE (admin):
1. Go to Schedule → Templates tab
2. Tap + New Template
3. Enter a name (e.g. "8h Framing – Smith House")
4. Select Job and Cost Code
5. Enter Hours (e.g. 8)
6. Pick a colour for the template chip
7. Add Notes if needed (crew will see these on their schedule)
8. Tap Save Template
On desktop: drag the template from the right sidebar onto any crew member's cell in the calendar grid.
On mobile: go to Add Shift, tap the template card at the top to pre-fill the form.

---
TROUBLESHOOTING:

"Failed to fetch" or app not loading:
- Check your internet connection
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Try closing and reopening the browser

"I submitted wrong hours / made a mistake":
- You cannot edit a submitted timesheet yourself
- Contact your admin — they can view and manage all timesheets from the Dashboard

"I don't see my job in the dropdown":
- Your admin needs to make sure the job is set to Active status
- Some jobs are only visible to employees assigned to them

"Cost code is missing from the list":
- Ask your admin to add cost codes in Setup → Cost Codes

"Voice logging isn't working":
- Make sure you've allowed microphone access in your browser
- On iPhone: Settings → Safari → Microphone → Allow
- Speak clearly after tapping the microphone, then pause when done

"I can't log in / forgot password":
- Tap Forgot password? on the login screen
- Enter your email — check spam if the reset email doesn't arrive within a few minutes
- If you still can't get in, contact your admin to reset your credentials

"My account is not linked":
- This means your login hasn't been connected to an employee record yet
- Ask your admin to go to Setup → Crew Access, tap Edit next to your name, and link you to your employee record

"The app shows my trial has ended":
- Your company's subscription has expired
- The account owner needs to subscribe to restore full access

---
RESPONSE RULES:
- Keep answers short and clear — 2 to 5 sentences max unless the user asks for step-by-step instructions
- Use numbered steps when explaining how to do something
- If you don't know the answer or the question isn't about VantageLogic, say: "I can only help with VantageLogic questions. For anything else, contact your admin or support."
- Never make up features that don't exist in the app
- Always be friendly and encouraging — trades workers are busy people on job sites"""

    try:
        response = get_gemini_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=[f"{system_prompt}\n\nUser question: {body.message}"]
        )
        return {"reply": response.text.strip()}
    except Exception as e:
        print(f"Help chat error: {e}")
        return {"reply": "Sorry, I couldn't process that. Please try again."}

@app.delete("/materials/{material_id}")
def delete_material(
    material_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mat = db.query(models.Material).filter(
        models.Material.material_id == material_id,
        models.Material.company_id == current_user.company_id
    ).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(mat)
    db.commit()
    return {"deleted": True}
    
# =============================================
# MILEAGE
# =============================================

@app.post("/mileage")
def create_mileage(
    job_id: int,
    employee_id: int,
    trip_date: str,
    km_driven: float,
    purpose: str = None,
    notes: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = models.Mileage(
        company_id=current_user.company_id,
        job_id=job_id,
        employee_id=employee_id,
        trip_date=trip_date,
        km_driven=km_driven,
        purpose=purpose,
        notes=notes
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@app.get("/mileage")
def get_mileage(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    entries = db.query(models.Mileage).filter(
        models.Mileage.company_id == current_user.company_id
    ).all()
    result = []
    for m in entries:
        emp = db.query(models.Employee).filter(models.Employee.employee_id == m.employee_id).first()
        job = db.query(models.Job).filter(models.Job.job_id == m.job_id).first()
        result.append({
            "mileage_id": m.mileage_id,
            "job_name": job.job_name if job else "Unknown",
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "trip_date": str(m.trip_date),
            "km_driven": float(m.km_driven),
            "purpose": m.purpose,
            "notes": m.notes,
        })
    return result

# =============================================
# CREW STATS
# =============================================

@app.get("/me/stats")
def get_my_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import date, timedelta

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    if not current_user.employee_id:
        return {
            "linked": False,
            "employee_name": None,
            "week": {"hours": 0, "jobs": 0, "km": 0},
            "month": {"hours": 0, "jobs": 0, "km": 0},
            "all_time": {"hours": 0, "jobs": 0, "km": 0},
            "recent_entries": []
        }

    emp = db.query(models.Employee).filter(models.Employee.employee_id == current_user.employee_id).first()
    employee_name = f"{emp.first_name} {emp.last_name}" if emp else None

    timesheets = db.query(models.Timesheet).filter(
        models.Timesheet.employee_id == current_user.employee_id
    ).all()

    mileage = db.query(models.Mileage).filter(
        models.Mileage.employee_id == current_user.employee_id
    ).all()

    def calc(ts, mi):
        return {
            "hours": round(sum(float(t.hours_worked or 0) for t in ts), 1),
            "jobs": len(set(t.job_id for t in ts)),
            "km": round(sum(float(m.km_driven or 0) for m in mi), 1)
        }

    week_ts = [t for t in timesheets if t.shift_date and t.shift_date >= week_start]
    week_mi = [m for m in mileage if m.trip_date and m.trip_date >= week_start]
    month_ts = [t for t in timesheets if t.shift_date and t.shift_date >= month_start]
    month_mi = [m for m in mileage if m.trip_date and m.trip_date >= month_start]

    recent = sorted(timesheets, key=lambda t: t.shift_date or date(2000,1,1), reverse=True)[:5]
    recent_entries = []
    for t in recent:
        job = db.query(models.Job).filter(models.Job.job_id == t.job_id).first()
        recent_entries.append({
            "shift_date": str(t.shift_date),
            "hours_worked": float(t.hours_worked or 0),
            "job_name": job.job_name if job else "Unknown",
            "field_notes": t.field_notes
        })

    return {
        "linked": True,
        "employee_name": employee_name,
        "week": calc(week_ts, week_mi),
        "month": calc(month_ts, month_mi),
        "all_time": calc(timesheets, mileage),
        "recent_entries": recent_entries
    }

@app.patch("/me/update")
def update_me(
    first_name: str = None,
    last_name: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if first_name is not None: current_user.first_name = first_name
    if last_name is not None: current_user.last_name = last_name
    db.commit()
    return {"message": "Profile updated"}

@app.patch("/me/update-company")
def update_company(
    company_name: str = None,
    track_overtime: bool = None,
    overtime_rate_multiplier: float = None,
    overtime_rules: str = None,
    mileage_rate_per_km: float = None,
    estimate_labor_rate_per_hour: float = None,
    tax_rate_percent: float = None,
    tax_label: str = None,
    default_markup_percent: float = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    company = db.query(models.Company).filter(
        models.Company.company_id == current_user.company_id
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company_name is not None: company.company_name = company_name
    if track_overtime is not None and hasattr(company, "track_overtime"):
        company.track_overtime = track_overtime
    if overtime_rate_multiplier is not None and hasattr(company, "overtime_rate_multiplier"):
        company.overtime_rate_multiplier = overtime_rate_multiplier
    if overtime_rules is not None and hasattr(company, "overtime_rules"):
        parsed = _parse_json_param(overtime_rules)
        if parsed is not None:
            if not isinstance(parsed, list):
                raise HTTPException(status_code=400, detail="overtime_rules must be a JSON array")
            company.overtime_rules = parsed
    if mileage_rate_per_km is not None and hasattr(company, "mileage_rate_per_km"):
        company.mileage_rate_per_km = mileage_rate_per_km
    if estimate_labor_rate_per_hour is not None and hasattr(company, "estimate_labor_rate_per_hour"):
        company.estimate_labor_rate_per_hour = estimate_labor_rate_per_hour
    if tax_rate_percent is not None and hasattr(company, "tax_rate_percent"):
        company.tax_rate_percent = tax_rate_percent
    if tax_label is not None and hasattr(company, "tax_label"):
        company.tax_label = (tax_label or "HST").strip()[:30]
    if default_markup_percent is not None and hasattr(company, "default_markup_percent"):
        company.default_markup_percent = default_markup_percent
    db.commit()
    return {"message": "Company updated"}

@app.post("/me/change-password")
def change_password(
    current_password: str,
    new_password: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    current_user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password changed"}

@app.patch("/timesheets/{timesheet_id}")
def update_timesheet(
    timesheet_id: int,
    job_id: int = None,
    cost_code_id: int = None,
    shift_date: str = None,
    hours_worked: float = None,
    overtime_hours: float = None,
    premium_hours: str = None,
    field_notes: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ts = db.query(models.Timesheet).filter(
        models.Timesheet.timesheet_id == timesheet_id,
        models.Timesheet.company_id == current_user.company_id
    ).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    if job_id is not None: ts.job_id = job_id
    if cost_code_id is not None: ts.cost_code_id = cost_code_id
    if shift_date is not None: ts.shift_date = shift_date
    if hours_worked is not None: ts.hours_worked = hours_worked
    parsed_premium = _parse_json_param(premium_hours)
    if parsed_premium is not None and hasattr(ts, "premium_hours"):
        ts.premium_hours = parsed_premium if isinstance(parsed_premium, dict) else None
        if isinstance(parsed_premium, dict):
            ts.overtime_hours = sum(float(v or 0) for v in parsed_premium.values())
    elif overtime_hours is not None and hasattr(ts, "overtime_hours"):
        ts.overtime_hours = overtime_hours
    if field_notes is not None: ts.field_notes = field_notes
    db.commit()
    db.refresh(ts)
    return ts

@app.patch("/materials/{material_id}")
def update_material(
    material_id: int,
    job_id: int = None,
    description: str = None,
    supplier: str = None,
    total_cost: float = None,
    purchase_date: str = None,
    notes: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mat = db.query(models.Material).filter(
        models.Material.material_id == material_id,
        models.Material.company_id == current_user.company_id
    ).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    if job_id is not None: mat.job_id = job_id
    if description is not None: mat.description = description
    if supplier is not None: mat.supplier = supplier
    if total_cost is not None: mat.total_cost = total_cost
    if purchase_date is not None: mat.purchase_date = purchase_date
    if notes is not None: mat.notes = notes
    db.commit()
    db.refresh(mat)
    return mat

@app.patch("/mileage/{mileage_id}")
def update_mileage(
    mileage_id: int,
    job_id: int = None,
    trip_date: str = None,
    km_driven: float = None,
    purpose: str = None,
    notes: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(models.Mileage).filter(
        models.Mileage.mileage_id == mileage_id,
        models.Mileage.company_id == current_user.company_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Mileage entry not found")
    if job_id is not None: entry.job_id = job_id
    if trip_date is not None: entry.trip_date = trip_date
    if km_driven is not None: entry.km_driven = km_driven
    if purpose is not None: entry.purpose = purpose
    if notes is not None: entry.notes = notes
    db.commit()
    db.refresh(entry)
    return entry

@app.patch("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.user_id == user_id,
        models.User.company_id == current_user.company_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    user.active = False
    db.commit()
    return {"message": f"{user.email} deactivated"}

@app.patch("/users/{user_id}/reactivate")
def reactivate_user(
    user_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.user_id == user_id,
        models.User.company_id == current_user.company_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.active = True
    db.commit()
    return {"message": f"{user.email} reactivated"}

@app.get("/my-schedule-to-log")
def get_my_schedule_to_log(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import date, timedelta
    if not current_user.employee_id:
        return []
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    # schedules from start of this week through today
    schedules = db.query(models.Schedule).filter(
        models.Schedule.company_id == current_user.company_id,
        models.Schedule.employee_id == current_user.employee_id,
        models.Schedule.scheduled_date >= week_start,
        models.Schedule.scheduled_date <= today
    ).order_by(models.Schedule.scheduled_date).all()
    result = []
    for s in schedules:
        # check if a timesheet already exists for this employee, job, and date
        existing = db.query(models.Timesheet).filter(
            models.Timesheet.employee_id == current_user.employee_id,
            models.Timesheet.job_id == s.job_id,
            models.Timesheet.shift_date == s.scheduled_date
        ).first()
        job = db.query(models.Job).filter(models.Job.job_id == s.job_id).first()
        result.append({
            "schedule_id": s.schedule_id,
            "job_id": s.job_id,
            "job_name": job.job_name if job else "Unknown",
            "cost_code_id": s.cost_code_id,
            "scheduled_date": str(s.scheduled_date),
            "scheduled_hours": float(s.scheduled_hours) if s.scheduled_hours else 8,
            "already_logged": existing is not None
        })
    return result

# =============================================
# CHANGE ORDERS
# =============================================

@app.get("/jobs/{job_id}/change-orders")
def get_change_orders(
    job_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(models.ChangeOrder).filter(
        models.ChangeOrder.job_id == job_id,
        models.ChangeOrder.company_id == current_user.company_id
    ).order_by(models.ChangeOrder.created_at).all()
    result = []
    for o in orders:
        user = db.query(models.User).filter(models.User.user_id == o.created_by).first()
        result.append({
            "change_order_id": o.change_order_id,
            "description": o.description,
            "amount": float(o.amount),
            "order_type": o.order_type,
            "created_by": user.email if user else "Unknown",
            "created_at": str(o.created_at)
        })
    return result

@app.post("/jobs/{job_id}/change-orders")
def create_change_order(
    job_id: int,
    description: str,
    amount: float,
    order_type: str = "addition",
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    job = db.query(models.Job).filter(
        models.Job.job_id == job_id,
        models.Job.company_id == current_user.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    order = models.ChangeOrder(
        company_id=current_user.company_id,
        job_id=job_id,
        description=description,
        amount=amount,
        order_type=order_type,
        created_by=current_user.user_id
    )
    db.add(order)
    # Adjust contract value
    current_value = float(job.contract_value or 0)
    if order_type == "addition":
        job.contract_value = current_value + amount
    else:
        job.contract_value = current_value - amount
    db.commit()
    db.refresh(order)
    # Send notifications to all company owners
    owners = db.query(models.User).filter(
        models.User.company_id == current_user.company_id,
        models.User.role.in_(["owner", "admin"])
    ).all()
    for owner in owners:
        if owner.user_id != current_user.user_id:
            notif = models.Notification(
                company_id=current_user.company_id,
                user_id=owner.user_id,
                type="change_order",
                title="Change Order Added",
                message=f"{description} — {'+'if order_type == 'addition' else '-'}${amount:.2f}",
                related_id=job_id,
                related_type="job"
            )
            db.add(notif)
    db.commit()
    return order

# =============================================
# NOTIFICATIONS
# =============================================

@app.get("/notifications")
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.user_id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()
    return [{
        "notification_id": n.notification_id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "related_id": n.related_id,
        "related_type": n.related_type,
        "read": n.read,
        "created_at": str(n.created_at)
    } for n in notifs]

@app.get("/notifications/unread-count")
def get_unread_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.user_id,
        models.Notification.read == False
    ).count()
    return {"count": count}

@app.patch("/notifications/mark-read")
def mark_all_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.user_id,
        models.Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

# =============================================
# DASHBOARD
# =============================================

@app.get("/dashboard")
def get_dashboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(models.Job).filter(
        models.Job.company_id == current_user.company_id
    ).all()

    result = []
    for job in jobs:
        timesheets = db.query(models.Timesheet).filter(
            models.Timesheet.job_id == job.job_id
        ).all()
        materials = db.query(models.Material).filter(
            models.Material.job_id == job.job_id
        ).all()

        total_hours = sum(float(t.hours_worked or 0) for t in timesheets)
        total_materials_cost = sum(float(m.total_cost or 0) for m in materials)

        labour_cost = 0
        company = db.query(models.Company).filter(
            models.Company.company_id == current_user.company_id
        ).first()
        for t in timesheets:
            emp = db.query(models.Employee).filter(
                models.Employee.employee_id == t.employee_id
            ).first()
            labour_cost += _timesheet_labour_cost(t, emp, company)

        total_cost = labour_cost + total_materials_cost
        contract_value = float(job.contract_value or 0)
        margin = contract_value - total_cost if contract_value else None

        result.append({
            "job_id": job.job_id,
            "job_name": job.job_name,
            "city": job.city,
            "status": job.status,
            "contract_value": contract_value,
            "budgeted_hours": float(job.budgeted_hours or 0),
            "total_hours": total_hours,
            "labour_cost": round(labour_cost, 2),
            "materials_cost": round(total_materials_cost, 2),
            "total_cost": round(total_cost, 2),
            "margin": round(margin, 2) if margin is not None else None,
            "margin_percent": round((margin / contract_value) * 100, 1) if contract_value and margin is not None else None
        })

    return result

# =============================================
# SCHEDULES
# =============================================

@app.post("/schedules")
def create_schedule(
    employee_id: int,
    job_id: int,
    scheduled_date: str,
    scheduled_hours: float = None,
    cost_code_id: int = None,
    start_time: str = None,
    end_time: str = None,
    notes: str = None,
    color: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    schedule_kwargs = dict(
        company_id=current_user.company_id,
        employee_id=employee_id,
        job_id=job_id,
        scheduled_date=scheduled_date,
        scheduled_hours=scheduled_hours,
        cost_code_id=cost_code_id,
        notes=notes,
        color=color,
    )
    if hasattr(models.Schedule, "start_time"):
        schedule_kwargs["start_time"] = start_time or None
        schedule_kwargs["end_time"] = end_time or None
    schedule = models.Schedule(**schedule_kwargs)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

@app.get("/schedules")
def get_schedules(
    start_date: str = None,
    end_date: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Schedule).filter(models.Schedule.company_id == current_user.company_id)
    if start_date:
        query = query.filter(models.Schedule.scheduled_date >= start_date)
    if end_date:
        query = query.filter(models.Schedule.scheduled_date <= end_date)
    schedules = query.order_by(models.Schedule.scheduled_date).all()
    result = []
    for s in schedules:
        emp = db.query(models.Employee).filter(models.Employee.employee_id == s.employee_id).first()
        job = db.query(models.Job).filter(models.Job.job_id == s.job_id).first()
        result.append({
            "schedule_id": s.schedule_id,
            "employee_id": s.employee_id,
            "job_id": s.job_id,
            "cost_code_id": s.cost_code_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "job_name": job.job_name if job else "Unknown",
            "scheduled_date": str(s.scheduled_date),
            "scheduled_hours": float(s.scheduled_hours) if s.scheduled_hours else None,
            "start_time": _attr(s, "start_time"),
            "end_time": _attr(s, "end_time"),
            "notes": s.notes,
            "color": s.color
        })
    return result

@app.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    s = db.query(models.Schedule).filter(
        models.Schedule.schedule_id == schedule_id,
        models.Schedule.company_id == current_user.company_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(s)
    db.commit()
    return {"message": "Schedule deleted"}

@app.patch("/schedules/{schedule_id}")
def update_schedule(
    schedule_id: int,
    job_id: int = None,
    cost_code_id: int = None,
    scheduled_hours: float = None,
    start_time: str = None,
    end_time: str = None,
    notes: str = None,
    color: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    s = db.query(models.Schedule).filter(
        models.Schedule.schedule_id == schedule_id,
        models.Schedule.company_id == current_user.company_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if job_id is not None: s.job_id = job_id
    if cost_code_id is not None: s.cost_code_id = cost_code_id
    if scheduled_hours is not None: s.scheduled_hours = scheduled_hours
    if hasattr(s, "start_time"):
        s.start_time = start_time or None
    if hasattr(s, "end_time"):
        s.end_time = end_time or None
    s.notes = notes or None
    s.color = color or None
    db.commit()
    db.refresh(s)
    return {"schedule_id": s.schedule_id, "message": "updated"}

@app.get("/shift-templates")
def get_shift_templates(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.ShiftTemplate).filter(
        models.ShiftTemplate.company_id == current_user.company_id
    ).order_by(models.ShiftTemplate.created_at).all()


@app.post("/shift-templates")
def create_shift_template(
    name: str,
    job_id: int,
    cost_code_id: int,
    hours: float = 8.0,
    start_time: str = None,
    end_time: str = None,
    color: str = "#1a3d2b",
    notes: str = "",
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    tpl_kwargs = dict(
        company_id=current_user.company_id,
        name=name, job_id=job_id, cost_code_id=cost_code_id,
        hours=hours, color=color, notes=notes,
    )
    if hasattr(models.ShiftTemplate, "start_time"):
        tpl_kwargs["start_time"] = start_time or None
        tpl_kwargs["end_time"] = end_time or None
    tpl = models.ShiftTemplate(**tpl_kwargs)
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@app.patch("/shift-templates/{template_id}")
def update_shift_template(
    template_id: int,
    name: str = None,
    job_id: int = None,
    cost_code_id: int = None,
    hours: float = None,
    start_time: str = None,
    end_time: str = None,
    color: str = None,
    notes: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    tpl = db.query(models.ShiftTemplate).filter(
        models.ShiftTemplate.template_id == template_id,
        models.ShiftTemplate.company_id == current_user.company_id
    ).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    if name is not None: tpl.name = name
    if job_id is not None: tpl.job_id = job_id
    if cost_code_id is not None: tpl.cost_code_id = cost_code_id
    if hours is not None: tpl.hours = hours
    if color is not None: tpl.color = color
    if notes is not None: tpl.notes = notes
    if start_time is not None and hasattr(tpl, "start_time"):
        tpl.start_time = start_time
    if end_time is not None and hasattr(tpl, "end_time"):
        tpl.end_time = end_time
    db.commit()
    db.refresh(tpl)
    return tpl


@app.delete("/shift-templates/{template_id}")
def delete_shift_template(
    template_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    tpl = db.query(models.ShiftTemplate).filter(
        models.ShiftTemplate.template_id == template_id,
        models.ShiftTemplate.company_id == current_user.company_id
    ).first()
    if tpl:
        db.delete(tpl)
        db.commit()
    return {"ok": True}


@app.get("/my-jobs")
def get_my_jobs(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import date, timedelta
    if not current_user.employee_id:
        return db.query(models.Job).filter(
            models.Job.company_id == current_user.company_id,
            models.Job.status == "active"
        ).all()
    today = date.today()
    week_end = today + timedelta(days=14)
    schedules = db.query(models.Schedule).filter(
        models.Schedule.company_id == current_user.company_id,
        models.Schedule.employee_id == current_user.employee_id,
        models.Schedule.scheduled_date >= today - timedelta(days=7),
        models.Schedule.scheduled_date <= week_end
    ).all()
    job_ids = list(set(s.job_id for s in schedules))
    if not job_ids:
        return []
    return db.query(models.Job).filter(
        models.Job.job_id.in_(job_ids),
        models.Job.status == "active"
    ).all()

@app.get("/my-schedule")
def get_my_schedule(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import date, timedelta
    if not current_user.employee_id:
        return []
    today = date.today()
    end = today + timedelta(days=14)
    schedules = db.query(models.Schedule).filter(
        models.Schedule.company_id == current_user.company_id,
        models.Schedule.employee_id == current_user.employee_id,
        models.Schedule.scheduled_date >= today,
        models.Schedule.scheduled_date <= end
    ).order_by(models.Schedule.scheduled_date).all()
    result = []
    for s in schedules:
        job = db.query(models.Job).filter(models.Job.job_id == s.job_id).first()
        result.append({
            "schedule_id": s.schedule_id,
            "job_name": job.job_name if job else "Unknown",
            "scheduled_date": str(s.scheduled_date),
            "scheduled_hours": float(s.scheduled_hours) if s.scheduled_hours else None,
            "notes": s.notes
        })
    return result

# =============================================
# INVENTORY
# =============================================

@app.get("/inventory")
def get_inventory(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(models.Inventory).filter(
        models.Inventory.company_id == current_user.company_id,
        models.Inventory.active == True
    ).all()
    return items

@app.post("/inventory")
def create_inventory_item(
    name: str,
    unit: str,
    quantity: float = 0,
    purchase_price: float = None,
    charge_out_price: float = None,
    notes: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    item = models.Inventory(
        company_id=current_user.company_id,
        name=name,
        unit=unit,
        quantity=quantity,
        purchase_price=purchase_price,
        charge_out_price=charge_out_price,
        notes=notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.patch("/inventory/{inventory_id}")
def update_inventory_item(
    inventory_id: int,
    name: str = None,
    unit: str = None,
    quantity: float = None,
    purchase_price: float = None,
    charge_out_price: float = None,
    notes: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    item = db.query(models.Inventory).filter(
        models.Inventory.inventory_id == inventory_id,
        models.Inventory.company_id == current_user.company_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if name is not None: item.name = name
    if unit is not None: item.unit = unit
    if quantity is not None: item.quantity = quantity
    if purchase_price is not None: item.purchase_price = purchase_price
    if charge_out_price is not None: item.charge_out_price = charge_out_price
    if notes is not None: item.notes = notes
    db.commit()
    db.refresh(item)
    return item

@app.delete("/inventory/{inventory_id}")
def deactivate_inventory_item(
    inventory_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    item = db.query(models.Inventory).filter(
        models.Inventory.inventory_id == inventory_id,
        models.Inventory.company_id == current_user.company_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.active = False
    db.commit()
    return {"message": f"{item.name} removed"}


@app.post("/inventory/{inventory_id}/assign")
def assign_inventory_to_job(
    inventory_id: int,
    job_id: int,
    quantity: float,
    cost_code_id: int = None,
    notes: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    from datetime import datetime

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    inv = db.query(models.Inventory).filter(
        models.Inventory.inventory_id == inventory_id,
        models.Inventory.company_id == current_user.company_id,
        models.Inventory.active == True,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Item not found")

    job = db.query(models.Job).filter(
        models.Job.job_id == job_id,
        models.Job.company_id == current_user.company_id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Project not found")

    if float(inv.quantity or 0) < float(quantity):
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Only {inv.quantity} {inv.unit} available.",
        )

    inv.quantity = float(inv.quantity or 0) - float(quantity)
    unit_cost = float(inv.charge_out_price or inv.purchase_price or 0)
    material = models.Material(
        company_id=current_user.company_id,
        job_id=job_id,
        cost_code_id=cost_code_id,
        description=f"{inv.name} (inventory assigned)",
        quantity=quantity,
        unit_cost=unit_cost,
        total_cost=unit_cost * float(quantity),
        purchase_date=datetime.utcnow().date(),
        notes=notes,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return {
        "message": f"Assigned {quantity} {inv.unit} of {inv.name} to {job.job_name}",
        "material_id": material.material_id,
        "remaining_quantity": float(inv.quantity),
    }

# =============================================
# REQUESTS
# =============================================

@app.get("/requests")
def get_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    if current_user.role in ["owner", "admin"]:
        reqs = db.query(models.Request).filter(
            models.Request.company_id == current_user.company_id
        ).order_by(models.Request.created_at.desc()).all()
    else:
        if not current_user.employee_id:
            return []
        # Get all jobs this crew member is scheduled on
        scheduled_jobs = db.query(models.Schedule).filter(
            models.Schedule.company_id == current_user.company_id,
            models.Schedule.employee_id == current_user.employee_id
        ).all()
        job_ids = list(set(s.job_id for s in scheduled_jobs))
        
        if job_ids:
            # Get requests from own submissions OR from shared jobs
            # Exclude Scope Change requests from shared jobs (those are owner-only)
            from sqlalchemy import or_, and_
            reqs = db.query(models.Request).filter(
                models.Request.company_id == current_user.company_id,
                or_(
                    models.Request.employee_id == current_user.employee_id,
                    and_(
                        models.Request.job_id.in_(job_ids),
                        models.Request.request_type != "Scope Change"
                    )
                )
            ).order_by(models.Request.created_at.desc()).all()
        else:
            reqs = db.query(models.Request).filter(
                models.Request.company_id == current_user.company_id,
                models.Request.employee_id == current_user.employee_id
            ).order_by(models.Request.created_at.desc()).all()

    result = []
    for r in reqs:
        emp = db.query(models.Employee).filter(models.Employee.employee_id == r.employee_id).first()
        job = db.query(models.Job).filter(models.Job.job_id == r.job_id).first()
        inv = db.query(models.Inventory).filter(models.Inventory.inventory_id == r.inventory_id).first() if r.inventory_id else None
        
        # Get latest comment timestamp and count
        comments = db.query(models.RequestComment).filter(
            models.RequestComment.request_id == r.request_id
        ).order_by(models.RequestComment.created_at.desc()).all()
        last_comment_at = str(comments[0].created_at) if comments else None
        last_activity_at = last_comment_at or str(r.created_at)
        
        # Get job participants (all crew scheduled on this job)
        job_schedules = db.query(models.Schedule).filter(
            models.Schedule.job_id == r.job_id,
            models.Schedule.company_id == current_user.company_id
        ).all()
        participant_ids = list(set(s.employee_id for s in job_schedules))
        participants = []
        for pid in participant_ids:
            pe = db.query(models.Employee).filter(models.Employee.employee_id == pid).first()
            if pe:
                participants.append(f"{pe.first_name} {pe.last_name}")

        is_mine = r.employee_id == current_user.employee_id

        result.append({
            "request_id": r.request_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "is_mine": is_mine,
            "job_name": job.job_name if job else "Unknown",
            "job_id": r.job_id,
            "request_type": r.request_type,
            "description": r.description,
            "inventory_item": inv.name if inv else None,
            "inventory_unit": inv.unit if inv else None,
            "quantity_requested": float(r.quantity_requested) if r.quantity_requested else None,
            "status": r.status,
            "denial_reason": r.denial_reason,
            "created_at": str(r.created_at),
            "last_activity_at": last_activity_at,
            "comment_count": len(comments),
            "last_comment_preview": comments[0].message[:60] if comments else None,
            "participants": participants,
            "reviewed_at": str(r.reviewed_at) if r.reviewed_at else None,
        })
    
    # Sort by last activity
    result.sort(key=lambda x: x["last_activity_at"], reverse=True)
    return result

@app.post("/requests")
def create_request(
    job_id: int,
    request_type: str,
    description: str = None,
    inventory_id: int = None,
    quantity_requested: float = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_id:
        raise HTTPException(status_code=400, detail="Account not linked to an employee")
    req = models.Request(
        company_id=current_user.company_id,
        employee_id=current_user.employee_id,
        job_id=job_id,
        request_type=request_type,
        description=description,
        inventory_id=inventory_id,
        quantity_requested=quantity_requested,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Notify all owners
    owners = db.query(models.User).filter(
        models.User.company_id == current_user.company_id,
        models.User.role.in_(["owner", "admin"])
    ).all()
    emp = db.query(models.Employee).filter(models.Employee.employee_id == current_user.employee_id).first()
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "A crew member"
    job = db.query(models.Job).filter(models.Job.job_id == job_id).first()
    for owner in owners:
        notif = models.Notification(
            company_id=current_user.company_id,
            user_id=owner.user_id,
            type="new_request",
            title=f"New {request_type} Request",
            message=f"{emp_name} on {job.job_name if job else 'a job'}",
            related_id=req.request_id,
            related_type="request"
        )
        db.add(notif)
    db.commit()

    # Notify crew on same job for safety/equipment issues
    if request_type in ["Safety Concern", "Equipment Issue"]:
        job_schedules = db.query(models.Schedule).filter(
            models.Schedule.job_id == job_id,
            models.Schedule.company_id == current_user.company_id
        ).all()
        notified_crew = set()
        for sched in job_schedules:
            if sched.employee_id == current_user.employee_id or sched.employee_id in notified_crew:
                continue
            notified_crew.add(sched.employee_id)
            crew_user = db.query(models.User).filter(
                models.User.employee_id == sched.employee_id,
                models.User.company_id == current_user.company_id
            ).first()
            if crew_user:
                db.add(models.Notification(
                    company_id=current_user.company_id,
                    user_id=crew_user.user_id,
                    type="new_request",
                    title=f"{request_type} reported on {job.job_name if job else 'your job'}",
                    message=f"{emp_name}: {description[:60] if description else 'No details'}",
                    related_id=req.request_id,
                    related_type="request"
                ))
        db.commit()
    return req

@app.patch("/requests/{request_id}/approve")
def approve_request(
    request_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    req = db.query(models.Request).filter(
        models.Request.request_id == request_id,
        models.Request.company_id == current_user.company_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "approved"
    req.reviewed_at = datetime.utcnow()
    req.reviewed_by = current_user.user_id

    if req.request_type == "Inventory Pull" and req.inventory_id and req.quantity_requested:
        inv = db.query(models.Inventory).filter(
            models.Inventory.inventory_id == req.inventory_id
        ).first()
        if inv:
            if float(inv.quantity) < float(req.quantity_requested):
                raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {inv.quantity} {inv.unit} available.")
            inv.quantity = float(inv.quantity) - float(req.quantity_requested)
            material = models.Material(
                company_id=current_user.company_id,
                job_id=req.job_id,
                description=f"{inv.name} (from inventory)",
                total_cost=float(inv.charge_out_price or 0) * float(req.quantity_requested),
                purchase_date=datetime.utcnow().date()
            )
            db.add(material)
    db.commit()
    return {"message": "Request approved"}

@app.patch("/requests/{request_id}/deny")
def deny_request(
    request_id: int,
    denial_reason: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    req = db.query(models.Request).filter(
        models.Request.request_id == request_id,
        models.Request.company_id == current_user.company_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "denied"
    req.denial_reason = denial_reason
    req.reviewed_at = datetime.utcnow()
    req.reviewed_by = current_user.user_id
    db.commit()
    return {"message": "Request denied"}

@app.patch("/requests/{request_id}/acknowledge")
def acknowledge_request(
    request_id: int,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    req = db.query(models.Request).filter(
        models.Request.request_id == request_id,
        models.Request.company_id == current_user.company_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "acknowledged"
    req.reviewed_at = datetime.utcnow()
    req.reviewed_by = current_user.user_id
    db.commit()
    # Notify all crew on this job that safety concern was acknowledged
    if req.request_type in ["Safety Concern", "Equipment Issue"]:
        job_schedules = db.query(models.Schedule).filter(
            models.Schedule.job_id == req.job_id,
            models.Schedule.company_id == current_user.company_id
        ).all()
        notified = set()
        for sched in job_schedules:
            if sched.employee_id in notified:
                continue
            notified.add(sched.employee_id)
            crew_user = db.query(models.User).filter(
                models.User.employee_id == sched.employee_id,
                models.User.company_id == current_user.company_id
            ).first()
            if crew_user:
                db.add(models.Notification(
                    company_id=current_user.company_id,
                    user_id=crew_user.user_id,
                    type="new_request",
                    title=f"{req.request_type} acknowledged",
                    message=f"Your {req.request_type.lower()} has been acknowledged by the admin.",
                    related_id=req.request_id,
                    related_type="request"
                ))
        db.commit()
    return {"message": "Request acknowledged"}

@app.patch("/requests/{request_id}/edit")
def edit_request(
    request_id: int,
    description: str = None,
    request_type: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(models.Request).filter(
        models.Request.request_id == request_id,
        models.Request.company_id == current_user.company_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if current_user.role == "crew":
        if req.employee_id != current_user.employee_id:
            raise HTTPException(status_code=403, detail="Not your request")
        if req.status != "pending":
            raise HTTPException(status_code=400, detail="Can only edit pending requests")
    if description is not None: req.description = description
    if request_type is not None: req.request_type = request_type
    db.commit()
    db.refresh(req)
    return req

@app.get("/requests/{request_id}/comments")
def get_comments(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(models.Request).filter(
        models.Request.request_id == request_id,
        models.Request.company_id == current_user.company_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    comments = db.query(models.RequestComment).filter(
        models.RequestComment.request_id == request_id
    ).order_by(models.RequestComment.created_at).all()
    result = []
    for c in comments:
        user = db.query(models.User).filter(models.User.user_id == c.user_id).first()
        emp = db.query(models.Employee).filter(models.Employee.employee_id == user.employee_id).first() if user and user.employee_id else None
        name = f"{emp.first_name} {emp.last_name}" if emp else (user.email if user else "Unknown")
        result.append({
            "comment_id": c.comment_id,
            "message": c.message,
            "author": name,
            "role": user.role if user else "unknown",
            "created_at": str(c.created_at),
            "is_mine": c.user_id == current_user.user_id
        })
    return result

@app.post("/requests/{request_id}/comments")
def add_comment(
    request_id: int,
    message: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(models.Request).filter(
        models.Request.request_id == request_id,
        models.Request.company_id == current_user.company_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    comment = models.RequestComment(
        request_id=request_id,
        user_id=current_user.user_id,
        company_id=current_user.company_id,
        message=message
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Notify the other party
    req = db.query(models.Request).filter(models.Request.request_id == request_id).first()
    if req:
        if current_user.role == "crew":
            targets = db.query(models.User).filter(
                models.User.company_id == current_user.company_id,
                models.User.role.in_(["owner", "admin"])
            ).all()
        else:
            crew_user = db.query(models.User).filter(
                models.User.employee_id == req.employee_id,
                models.User.company_id == current_user.company_id
            ).first()
            targets = [crew_user] if crew_user else []
        for target in targets:
            if target and target.user_id != current_user.user_id:
                notif = models.Notification(
                    company_id=current_user.company_id,
                    user_id=target.user_id,
                    type="new_comment",
                    title="New comment on request",
                    message=message[:100],
                    related_id=request_id,
                    related_type="request"
                )
                db.add(notif)
        db.commit()
    return {"comment_id": comment.comment_id, "message": comment.message}

# =============================================
# EXPORT
# =============================================

@app.get("/export/report")
def export_report(
    start_date: str,
    end_date: str,
    job_id: int = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    from datetime import date as date_type

    try:
        start = date_type.fromisoformat(start_date)
        end = date_type.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    if end < start:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date.")

    company_id = current_user.company_id
    all_jobs = {
        j.job_id: j for j in db.query(models.Job).filter(models.Job.company_id == company_id).all()
    }
    if job_id is not None:
        if job_id not in all_jobs:
            raise HTTPException(status_code=404, detail="Project not found")

    employees = {e.employee_id: e for e in db.query(models.Employee).filter(models.Employee.company_id == company_id).all()}
    cost_codes = {c.cost_code_id: c for c in db.query(models.CostCode).filter(models.CostCode.company_id == company_id).all()}
    inventory = {i.inventory_id: i for i in db.query(models.Inventory).filter(models.Inventory.company_id == company_id).all()}
    company = db.query(models.Company).filter(models.Company.company_id == company_id).first()

    def job_name(jid):
        j = all_jobs.get(jid)
        return j.job_name if j else "Unknown"

    def cc_label(ccid):
        cc = cost_codes.get(ccid)
        return f"{cc.code} - {cc.description}" if cc else ""

    def emp_name(eid):
        e = employees.get(eid)
        return f"{e.first_name} {e.last_name}" if e else "Unknown"

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Vantage Logic Report"])
    writer.writerow(["Period", f"{start_date} to {end_date}"])
    if job_id is not None:
        writer.writerow(["Project", job_name(job_id)])
    writer.writerow([])

    # Timesheets
    ts_q = db.query(models.Timesheet).filter(
        models.Timesheet.company_id == company_id,
        models.Timesheet.shift_date >= start,
        models.Timesheet.shift_date <= end,
    )
    if job_id is not None:
        ts_q = ts_q.filter(models.Timesheet.job_id == job_id)
    timesheets = ts_q.order_by(models.Timesheet.shift_date).all()

    writer.writerow(["TIMESHEETS"])
    writer.writerow(["Date", "Project", "Employee", "Work Category", "Regular Hours", "Premium Hours", "Labour Cost", "Notes"])
    for t in timesheets:
        emp = employees.get(t.employee_id)
        premium = _timesheet_premium_hours(t)
        premium_str = "; ".join(
            f"{next((r['label'] for r in _company_overtime_rules(company) if r['id'] == rid), rid)}: {hrs}h"
            for rid, hrs in premium.items() if float(hrs or 0) > 0
        ) if premium else (f"Overtime: {_timesheet_ot_hours(t)}h" if _timesheet_ot_hours(t) > 0 else "")
        writer.writerow([
            str(t.shift_date),
            job_name(t.job_id),
            emp_name(t.employee_id),
            cc_label(t.cost_code_id),
            float(t.hours_worked or 0),
            premium_str,
            round(_timesheet_labour_cost(t, emp, company), 2),
            t.field_notes or "",
        ])
    writer.writerow([])

    # Materials
    mat_q = db.query(models.Material).filter(
        models.Material.company_id == company_id,
        models.Material.purchase_date >= start,
        models.Material.purchase_date <= end,
    )
    if job_id is not None:
        mat_q = mat_q.filter(models.Material.job_id == job_id)
    materials = mat_q.order_by(models.Material.purchase_date).all()

    writer.writerow(["MATERIALS"])
    writer.writerow(["Date", "Project", "Purchased By", "Supplier", "Description", "Amount", "Work Category", "Notes"])
    for m in materials:
        writer.writerow([
            str(m.purchase_date or ""),
            job_name(m.job_id),
            emp_name(m.purchased_by),
            m.supplier or "",
            m.description or "",
            float(m.total_cost or 0),
            cc_label(m.cost_code_id) if m.cost_code_id else "",
            m.notes or "",
        ])
    writer.writerow([])

    # Mileage
    mi_q = db.query(models.Mileage).filter(
        models.Mileage.company_id == company_id,
        models.Mileage.trip_date >= start,
        models.Mileage.trip_date <= end,
    )
    if job_id is not None:
        mi_q = mi_q.filter(models.Mileage.job_id == job_id)
    mileage = mi_q.order_by(models.Mileage.trip_date).all()

    writer.writerow(["MILEAGE"])
    writer.writerow(["Date", "Project", "Employee", "KM Driven", "Purpose", "Notes"])
    for m in mileage:
        writer.writerow([
            str(m.trip_date),
            job_name(m.job_id),
            emp_name(m.employee_id),
            float(m.km_driven or 0),
            m.purpose or "",
            m.notes or "",
        ])
    writer.writerow([])

    # Inventory pulls (approved requests)
    req_q = db.query(models.Request).filter(
        models.Request.company_id == company_id,
        models.Request.request_type == "Inventory Pull",
        models.Request.status == "approved",
    )
    if job_id is not None:
        req_q = req_q.filter(models.Request.job_id == job_id)
    requests = req_q.all()
    filtered_requests = [
        r for r in requests
        if r.reviewed_at and start <= r.reviewed_at.date() <= end
    ]

    writer.writerow(["INVENTORY PULLS"])
    writer.writerow(["Date Approved", "Project", "Employee", "Item", "Quantity", "Description"])
    for r in filtered_requests:
        inv = inventory.get(r.inventory_id)
        writer.writerow([
            str(r.reviewed_at.date()) if r.reviewed_at else "",
            job_name(r.job_id),
            emp_name(r.employee_id),
            inv.name if inv else "Unknown",
            float(r.quantity_requested or 0),
            r.description or "",
        ])
    writer.writerow([])

    # Change orders
    co_q = db.query(models.ChangeOrder).filter(
        models.ChangeOrder.company_id == company_id,
    )
    if job_id is not None:
        co_q = co_q.filter(models.ChangeOrder.job_id == job_id)
    change_orders = [
        co for co in co_q.all()
        if co.created_at and start <= co.created_at.date() <= end
    ]

    writer.writerow(["CHANGE ORDERS"])
    writer.writerow(["Date", "Project", "Type", "Description", "Amount"])
    for co in change_orders:
        writer.writerow([
            str(co.created_at.date()) if co.created_at else "",
            job_name(co.job_id),
            co.order_type or "",
            co.description or "",
            float(co.amount or 0),
        ])
    writer.writerow([])

    # Summary
    total_labour = sum(_timesheet_labour_cost(t, employees.get(t.employee_id), company) for t in timesheets)
    total_materials = sum(float(m.total_cost or 0) for m in materials)
    total_km = sum(float(m.km_driven or 0) for m in mileage)

    writer.writerow(["SUMMARY"])
    writer.writerow(["Total Labour Cost", round(total_labour, 2)])
    writer.writerow(["Total Materials Cost", round(total_materials, 2)])
    writer.writerow(["Total KM Driven", round(total_km, 2)])
    writer.writerow(["Timesheet Entries", len(timesheets)])
    writer.writerow(["Material Entries", len(materials)])
    writer.writerow(["Mileage Entries", len(mileage)])
    writer.writerow(["Inventory Pulls", len(filtered_requests)])
    writer.writerow(["Change Orders", len(change_orders)])

    filename = f"vantage-report-{start_date}-to-{end_date}.csv"
    return Response(
        content=output.getvalue().encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

# =============================================
# DEMO DATA
# =============================================

@app.post("/seed-demo")
def seed_demo(
    force: bool = False,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    from seed_demo import seed_company_demo
    try:
        result = seed_company_demo(db, current_user.company_id, force=force)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if result.get("skipped"):
        raise HTTPException(status_code=409, detail=result["message"])
    return result
