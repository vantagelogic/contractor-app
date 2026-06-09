from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import models
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

models.Base.metadata.create_all(bind=engine)

import os
import resend
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-insecure-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(title="Vantage Logic API", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def send_welcome_email(to_email: str, company_name: str):
    try:
        resend.Emails.send({
            "from": "Vantage Logic <onboarding@resend.dev>",
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
                <a href="https://contractor-app-rose.vercel.app" style="display: inline-block; padding: 13px 28px; background: #1a3d2b; color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Open Vantage Logic
                </a>
                <p style="font-size: 13px; color: #9a9a9a; margin-top: 32px;">
                    30-day free trial. No credit card required.
                </p>
            </div>
            """
        })
    except Exception as e:
        print(f"Email error: {e}")


def send_crew_welcome_email(to_email: str, company_name: str):
    try:
        resend.Emails.send({
            "from": "Vantage Logic <onboarding@resend.dev>",
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
                <a href="https://contractor-app-rose.vercel.app" style="display: inline-block; padding: 13px 28px; background: #1a3d2b; color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
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

# =============================================
# HEALTH CHECK
# =============================================

@app.get("/")
def root():
    return {"message": "Vantage Logic API v2 is running"}

# =============================================
# AUTH
# =============================================

@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"user_id": user.user_id, "company_id": user.company_id, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "company_id": user.company_id}

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
    db: Session = Depends(get_db)
):
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    company = models.Company(
        company_name=company_name,
        trial_status="trial"
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    user = models.User(
        company_id=company.company_id,
        email=email,
        hashed_password=hash_password(password),
        role="owner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "user_id": user.user_id,
        "company_id": company.company_id,
        "role": user.role
    })

    send_welcome_email(email, company_name)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "company_id": company.company_id,
        "company_name": company.company_name,
        "trial_status": company.trial_status
    }

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
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        company_id=company_id,
        email=email,
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
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"user_id": current_user.user_id, "email": current_user.email, "role": current_user.role, "company_id": current_user.company_id, "employee_id": current_user.employee_id}

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
            "overtime_hours": float(t.overtime_hours or 0),
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
    field_notes: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    timesheet = models.Timesheet(
        company_id=current_user.company_id,
        job_id=job_id,
        employee_id=employee_id,
        cost_code_id=cost_code_id,
        shift_date=shift_date,
        hours_worked=hours_worked,
        overtime_hours=overtime_hours,
        field_notes=field_notes
    )
    db.add(timesheet)
    db.commit()
    db.refresh(timesheet)
    return timesheet

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

@app.patch("/timesheets/{timesheet_id}")
def update_timesheet(
    timesheet_id: int,
    job_id: int = None,
    cost_code_id: int = None,
    shift_date: str = None,
    hours_worked: float = None,
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
        total_overtime = sum(float(t.overtime_hours or 0) for t in timesheets)
        total_materials_cost = sum(float(m.total_cost or 0) for m in materials)

        labour_cost = 0
        for t in timesheets:
            emp = db.query(models.Employee).filter(
                models.Employee.employee_id == t.employee_id
            ).first()
            if emp:
                if emp.worker_type == "contractor" and emp.hourly_rate:
                    labour_cost += float(t.hours_worked or 0) * float(emp.hourly_rate)
                elif emp.burden_rate:
                    labour_cost += float(t.hours_worked or 0) * float(emp.burden_rate)
                elif emp.hourly_rate:
                    labour_cost += float(t.hours_worked or 0) * float(emp.hourly_rate)

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
            "total_overtime": total_overtime,
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
    notes: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    schedule = models.Schedule(
        company_id=current_user.company_id,
        employee_id=employee_id,
        job_id=job_id,
        scheduled_date=scheduled_date,
        scheduled_hours=scheduled_hours,
        cost_code_id=cost_code_id,
        notes=notes
    )
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
            "notes": s.notes
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

# =============================================
# REQUESTS
# =============================================

@app.get("/requests")
def get_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role in ["owner", "admin"]:
        reqs = db.query(models.Request).filter(
            models.Request.company_id == current_user.company_id
        ).order_by(models.Request.created_at.desc()).all()
    else:
        if not current_user.employee_id:
            return []
        reqs = db.query(models.Request).filter(
            models.Request.company_id == current_user.company_id,
            models.Request.employee_id == current_user.employee_id
        ).order_by(models.Request.created_at.desc()).all()
    result = []
    for r in reqs:
        emp = db.query(models.Employee).filter(models.Employee.employee_id == r.employee_id).first()
        job = db.query(models.Job).filter(models.Job.job_id == r.job_id).first()
        inv = db.query(models.Inventory).filter(models.Inventory.inventory_id == r.inventory_id).first() if r.inventory_id else None
        result.append({
            "request_id": r.request_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
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
            "reviewed_at": str(r.reviewed_at) if r.reviewed_at else None,
        })
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