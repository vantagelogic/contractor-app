from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="crew")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(50))
    email = Column(String(255))
    role = Column(String(100))
    hourly_rate = Column(Numeric(10, 2))
    burden_rate = Column(Numeric(10, 2))
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class CostCode(Base):
    __tablename__ = "cost_codes"

    cost_code_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(String(100))

class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_name = Column(String(255), nullable=False)
    job_address = Column(Text)
    status = Column(String(50), default="active")
    start_date = Column(Date)
    end_date = Column(Date)
    contract_value = Column(Numeric(12, 2))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class JobBudget(Base):
    __tablename__ = "job_budgets"

    budget_id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.job_id"))
    cost_code_id = Column(Integer, ForeignKey("cost_codes.cost_code_id"))
    budgeted_hours = Column(Numeric(8, 2))
    budgeted_cost = Column(Numeric(12, 2))

class Timesheet(Base):
    __tablename__ = "timesheets"

    timesheet_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"))
    employee_id = Column(Integer, ForeignKey("employees.employee_id"))
    cost_code_id = Column(Integer, ForeignKey("cost_codes.cost_code_id"))
    shift_date = Column(Date, nullable=False)
    hours_worked = Column(Numeric(5, 2), nullable=False)
    field_notes = Column(Text)
    material_needs = Column(Text)
    custom_data = Column(JSONB, default={})
    created_at = Column(DateTime, server_default=func.now())

class Material(Base):
    __tablename__ = "materials"

    material_id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.job_id"))
    cost_code_id = Column(Integer, ForeignKey("cost_codes.cost_code_id"))
    description = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2))
    unit_cost = Column(Numeric(10, 2))
    total_cost = Column(Numeric(12, 2))
    logged_date = Column(Date)
    logged_by = Column(Integer, ForeignKey("employees.employee_id"))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())