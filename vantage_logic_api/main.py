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
    # Check if email already exists
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    
    # Create company
    company = models.Company(
        company_name=company_name,
        trial_status="trial"
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    
    # Create owner user
    user = models.User(
        company_id=company.company_id,
        email=email,
        hashed_password=hash_password(password),
        role="owner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Return token so they're logged in immediately after signup
    token = create_access_token({
        "user_id": user.user_id,
        "company_id": company.company_id,
        "role": user.role
    })
    
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
    return {"user_id": user.user_id, "email": user.email, "role": user.role}

@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"user_id": current_user.user_id, "email": current_user.email, "role": current_user.role, "company_id": current_user.company_id, "employee_id": current_user.employee_id}

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
            if emp and emp.burden_rate:
                labour_cost += float(t.hours_worked or 0) * float(emp.burden_rate)
            elif emp and emp.hourly_rate:
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