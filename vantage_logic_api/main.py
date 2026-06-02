from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine
import models

from fastapi.middleware.cors import CORSMiddleware

# Create all tables if they don't exist
models.Base.metadata.create_all(bind=engine)

# Create the FastAPI app
app = FastAPI(title="Vantage Logic API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================
# HEALTH CHECK
# =============================================

@app.get("/")
def root():
    return {"message": "Vantage Logic API is running"}

# =============================================
# CLIENTS
# =============================================

@app.get("/clients")
def get_clients(db: Session = Depends(get_db)):
    clients = db.query(models.Client).all()
    return clients

@app.post("/clients")
def create_client(
    company_name: str,
    contact_name: str = None,
    phone: str = None,
    email: str = None,
    address: str = None,
    db: Session = Depends(get_db)
):
    client = models.Client(
        company_name=company_name,
        contact_name=contact_name,
        phone=phone,
        email=email,
        address=address
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

# =============================================
# EMPLOYEES
# =============================================

@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).all()
    return employees

@app.post("/employees")
def create_employee(
    first_name: str,
    last_name: str,
    role: str = None,
    hourly_rate: float = None,
    burden_rate: float = None,
    phone: str = None,
    email: str = None,
    db: Session = Depends(get_db)
):
    employee = models.Employee(
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
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.Job).all()
    return jobs

@app.get("/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(
        models.Job.job_id == job_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/jobs")
def create_job(
    job_name: str,
    client_id: int = None,
    job_address: str = None,
    contract_value: float = None,
    start_date: str = None,
    notes: str = None,
    db: Session = Depends(get_db)
):
    job = models.Job(
        job_name=job_name,
        client_id=client_id,
        job_address=job_address,
        contract_value=contract_value,
        notes=notes
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

# =============================================
# TIMESHEETS
# =============================================

@app.get("/timesheets")
def get_timesheets(db: Session = Depends(get_db)):
    timesheets = db.query(models.Timesheet).all()
    return timesheets

@app.post("/timesheets")
def create_timesheet(
    job_id: int,
    employee_id: int,
    cost_code_id: int,
    shift_date: str,
    hours_worked: float,
    field_notes: str = None,
    material_needs: str = None,
    db: Session = Depends(get_db)
):
    timesheet = models.Timesheet(
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
# COST CODES
# =============================================

@app.get("/cost-codes")
def get_cost_codes(db: Session = Depends(get_db)):
    cost_codes = db.query(models.CostCode).all()
    return cost_codes

@app.post("/cost-codes")
def create_cost_code(
    code: str,
    description: str,
    category: str = None,
    db: Session = Depends(get_db)
):
    cost_code = models.CostCode(
        code=code,
        description=description,
        category=category
    )
    db.add(cost_code)
    db.commit()
    db.refresh(cost_code)
    return cost_code

# =============================================
# MATERIALS
# =============================================

@app.get("/materials")
def get_materials(db: Session = Depends(get_db)):
    materials = db.query(models.Material).all()
    return materials

@app.post("/materials")
def create_material(
    job_id: int,
    cost_code_id: int,
    description: str,
    quantity: float = None,
    unit_cost: float = None,
    total_cost: float = None,
    logged_by: int = None,
    notes: str = None,
    db: Session = Depends(get_db)
):
    material = models.Material(
        job_id=job_id,
        cost_code_id=cost_code_id,
        description=description,
        quantity=quantity,
        unit_cost=unit_cost,
        total_cost=total_cost,
        logged_by=logged_by,
        notes=notes
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material