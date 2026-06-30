from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    active = Column(Boolean, default=True)
    trial_start_date = Column(DateTime, server_default=func.now())
    trial_status = Column(String(50), default="trial")
    created_at = Column(DateTime, server_default=func.now())
    stripe_customer_id = Column(String, nullable=True)
    subscription_status = Column(String, default="trial")
    trial_end_date = Column(DateTime, nullable=True)
    subscription_tier = Column(String, nullable=True)
    track_overtime = Column(Boolean, default=False)
    overtime_rate_multiplier = Column(Numeric(4, 2), default=1.5)
    overtime_rules = Column(JSONB, nullable=True)
    default_markup_percent = Column(Numeric(5, 2), default=15)
    mileage_rate_per_km = Column(Numeric(6, 3), default=0.70)
    estimate_labor_rate_per_hour = Column(Numeric(10, 2), default=75)
    tax_rate_percent = Column(Numeric(5, 2), default=0)
    tax_label = Column(String(30), default="HST")
    company_email = Column(String(255))
    company_phone = Column(String(50))
    company_address = Column(String(500))
    tax_number = Column(String(50))

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="crew")
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(50))
    email = Column(String(255))
    role = Column(String(100))
    trade_level = Column(String(50))
    hourly_rate = Column(Numeric(10, 2))
    burden_rate = Column(Numeric(10, 2))
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    worker_type = Column(String(20), default="employee", nullable=False)

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
    street = Column(String(255))
    city = Column(String(100))
    province = Column(String(50))
    postal_code = Column(String(20))
    status = Column(String(50), default="active")
    contract_value = Column(Numeric(12, 2))
    budgeted_hours = Column(Numeric(8, 2))
    budgeted_materials_cost = Column(Numeric(12, 2))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    job_code = Column(String(50), nullable=True)

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
    overtime_hours = Column(Numeric(5, 2), default=0)
    premium_hours = Column(JSONB, nullable=True)
    field_notes = Column(Text)
    billed = Column(Boolean, default=False)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Material(Base):
    __tablename__ = "materials"

    material_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"))
    cost_code_id = Column(Integer, ForeignKey("cost_codes.cost_code_id"))
    purchased_by = Column(Integer, ForeignKey("employees.employee_id"))
    description = Column(String(255), nullable=False)
    supplier = Column(String(255))
    quantity = Column(Numeric(10, 2))
    unit_cost = Column(Numeric(10, 2))
    total_cost = Column(Numeric(12, 2))
    purchase_date = Column(Date)
    receipt_image_url = Column(String(500))
    notes = Column(Text)
    billed = Column(Boolean, default=False)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Mileage(Base):
    __tablename__ = "mileage"

    mileage_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    trip_date = Column(Date, nullable=False)
    km_driven = Column(Numeric(8, 2), nullable=False)
    purpose = Column(String(255))
    notes = Column(Text)
    billed = Column(Boolean, default=False)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Schedule(Base):
    __tablename__ = "schedules"

    schedule_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    scheduled_hours = Column(Numeric(5, 2))
    cost_code_id = Column(Integer, ForeignKey("cost_codes.cost_code_id"), nullable=True)
    notes = Column(Text)
    color = Column(String(20), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    start_time = Column(String(5), nullable=True)
    end_time = Column(String(5), nullable=True)

class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    name = Column(String(255), nullable=False)
    unit = Column(String(50), nullable=False)
    quantity = Column(Numeric(10, 2), default=0)
    purchase_price = Column(Numeric(10, 2))
    charge_out_price = Column(Numeric(10, 2))
    notes = Column(Text)
    item_type = Column(String(50), nullable=True)
    image_path = Column(String(500), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Request(Base):
    __tablename__ = "requests"

    request_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    request_type = Column(String(50), nullable=False)
    description = Column(Text)
    inventory_id = Column(Integer, ForeignKey("inventory.inventory_id"))
    quantity_requested = Column(Numeric(10, 2))
    status = Column(String(20), default="pending")
    denial_reason = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    reviewed_at = Column(DateTime)
    reviewed_by = Column(Integer, ForeignKey("users.user_id"))

class RequestComment(Base):
    __tablename__ = "request_comments"

    comment_id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.request_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class ChangeOrder(Base):
    __tablename__ = "change_orders"

    change_order_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    order_type = Column(String(20), default="addition")
    created_by = Column(Integer, ForeignKey("users.user_id"))
    created_at = Column(DateTime, server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    related_id = Column(Integer)
    related_type = Column(String(50))
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class ShiftTemplate(Base):
    __tablename__ = "shift_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    name = Column(String(255), nullable=False)
    job_id = Column(Integer, nullable=False)
    cost_code_id = Column(Integer, nullable=False)
    hours = Column(Numeric(5, 2), default=8.0)
    color = Column(String(20), default="#1a3d2b")
    notes = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
    start_time = Column(String(5), nullable=True)
    end_time = Column(String(5), nullable=True)


class JobType(Base):
    __tablename__ = "job_types"

    job_type_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    name = Column(String(255), nullable=False)
    hint = Column(String(500), nullable=True)
    cost_code_ids = Column(JSONB, nullable=True)
    sort_order = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class WorkCategoryTemplate(Base):
    __tablename__ = "work_category_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    cost_code_id = Column(Integer, ForeignKey("cost_codes.cost_code_id"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    estimated_hours = Column(Numeric(8, 2), default=0)
    estimated_material_cost = Column(Numeric(12, 2), default=0)
    estimated_labor_cost = Column(Numeric(12, 2), default=0)
    sort_order = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Estimate(Base):
    __tablename__ = "estimates"

    estimate_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    title = Column(String(255), default="Cost-Plus Estimate")
    status = Column(String(20), default="draft")
    total_hours = Column(Numeric(10, 2), default=0)
    total_material_cost = Column(Numeric(12, 2), default=0)
    total_labor_cost = Column(Numeric(12, 2), default=0)
    total_cost = Column(Numeric(12, 2), default=0)
    crew_count = Column(Integer, nullable=True)
    estimated_mileage_km = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text)
    pdf_path = Column(String(500), nullable=True)
    customer_email = Column(String(255), nullable=True)
    sent_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    last_edited_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    last_edited_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    field_notes = Column(Text)
    scope_summary = Column(Text)
    rejection_reason = Column(Text)
    source = Column(String(20), default="office")
    created_at = Column(DateTime, server_default=func.now())


class EstimateComment(Base):
    __tablename__ = "estimate_comments"

    comment_id = Column(Integer, primary_key=True, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.estimate_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class EstimateAttachment(Base):
    __tablename__ = "estimate_attachments"

    attachment_id = Column(Integer, primary_key=True, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.estimate_id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())


class EstimateLineItem(Base):
    __tablename__ = "estimate_line_items"

    line_item_id = Column(Integer, primary_key=True, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.estimate_id"), nullable=False)
    template_id = Column(Integer, ForeignKey("work_category_templates.template_id"), nullable=True)
    cost_code_id = Column(Integer, ForeignKey("cost_codes.cost_code_id"), nullable=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Numeric(8, 2), default=1)
    estimated_hours = Column(Numeric(8, 2), default=0)
    material_cost = Column(Numeric(12, 2), default=0)
    labor_cost = Column(Numeric(12, 2), default=0)
    sort_order = Column(Integer, default=0)


class Invoice(Base):
    __tablename__ = "invoices"

    invoice_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    invoice_number = Column(String(50), nullable=False)
    status = Column(String(20), default="draft")
    markup_percent = Column(Numeric(5, 2), default=15)
    raw_subtotal = Column(Numeric(12, 2), default=0)
    markup_amount = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    include_receipts = Column(Boolean, default=False)
    pdf_path = Column(String(500), nullable=True)
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    invoice_line_id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    cost_code_id = Column(Integer, ForeignKey("cost_codes.cost_code_id"), nullable=True)
    raw_amount = Column(Numeric(12, 2), default=0)
    billed_amount = Column(Numeric(12, 2), default=0)
    source_ids = Column(JSONB, nullable=True)


class MagicLink(Base):
    __tablename__ = "magic_links"

    magic_link_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    token = Column(String(64), unique=True, nullable=False, index=True)
    purpose = Column(String(50), nullable=False)
    subcontractor_name = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class SubcontractorSubmission(Base):
    __tablename__ = "subcontractor_submissions"

    submission_id = Column(Integer, primary_key=True, index=True)
    magic_link_id = Column(Integer, ForeignKey("magic_links.magic_link_id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    submission_type = Column(String(50), nullable=False)
    subcontractor_name = Column(String(255))
    amount = Column(Numeric(12, 2))
    description = Column(Text)
    file_url = Column(String(500))
    signature_name = Column(String(255))
    material_id = Column(Integer, ForeignKey("materials.material_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
