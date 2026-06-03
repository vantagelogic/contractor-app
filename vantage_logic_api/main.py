from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import models

# Create all tables
models.Base.metadata.create_all(bind=engine)

# Security config
SECRET_KEY = "vantagelogic-secret-key-change-in-production"
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
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"user_id": user.user_id, "company_id": user.company_id, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "company_id": user.company_id}

# =============================================
# COMPANIES (you manage these manually)
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
# USERS (you create owner accounts manually)
# =============================================

@app.post("/users")
def create_user(
    company_id: int,
    email: str,
    password: str,
    role: str = "crew",
    db: Session = Depends(get_db)
):
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        company_id=company_id,
        email=email,
        hashed_password=hash_password(password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": user.user_id, "email": user.email, "role": user.role}

@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"user_id": current_user.user_id, "email": current_user.email, "role": current_user.role, "company_id": current_user.company_id}

# =============================================
# EMPLOYEES
# =============================================

@app.get("/employees")
def get_employees(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Employee).filter(models.Employee.company_id == current_user.company_id).all()

@app.post("/employees")
def create_employee(
    first_name: str,
    last_name: str,
    role: str = None,
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
        hourly_rate=hourly_rate,
        burden_rate=burden_rate,
        phone=phone,
        email=email
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

# =============================================
# JOBS
# =============================================

@app.get("/jobs")
def get_jobs(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Job).filter(models.Job.company_id == current_user.company_id).all()

@app.post("/jobs")
def create_job(
    job_name: str,
    job_address: str = None,
    contract_value: float = None,
    notes: str = None,
    current_user: models.User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    job = models.Job(
        company_id=current_user.company_id,
        job_name=job_name,
        job_address=job_address,
        contract_value=contract_value,
        notes=notes
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

# =============================================
# COST CODES
# =============================================

@app.get("/cost-codes")
def get_cost_codes(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.CostCode).filter(models.CostCode.company_id == current_user.company_id).all()

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

# =============================================
# TIMESHEETS
# =============================================

@app.get("/timesheets")
def get_timesheets(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Timesheet).filter(models.Timesheet.company_id == current_user.company_id).all()

@app.post("/timesheets")
def create_timesheet(
    job_id: int,
    employee_id: int,
    cost_code_id: int,
    shift_date: str,
    hours_worked: float,
    field_notes: str = None,
    material_needs: str = None,
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
        field_notes=field_notes,
        material_needs=material_needs
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
    return db.query(models.Material).filter(models.Material.job_id.in_(
        [j.job_id for j in db.query(models.Job).filter(models.Job.company_id == current_user.company_id).all()]
    )).all()