"""Load demo data for a company (jobs, crew, timesheets, schedule, etc.)."""
from datetime import date, timedelta

import models


def seed_company_demo(db, company_id: int, force: bool = False) -> dict:
    company = db.query(models.Company).filter(models.Company.company_id == company_id).first()
    if not company:
        raise ValueError("Company not found")

    job_count = db.query(models.Job).filter(models.Job.company_id == company_id).count()
    if job_count > 0 and not force:
        return {
            "skipped": True,
            "message": "Company already has jobs. Pass force=true to add demo data anyway.",
        }

    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    company.track_overtime = True
    company.overtime_rate_multiplier = 1.5

    employees = [
        models.Employee(
            company_id=company_id,
            first_name="Mike",
            last_name="Torres",
            role="Foreman",
            trade_level="Journeyman",
            hourly_rate=42,
            burden_rate=58,
            worker_type="employee",
        ),
        models.Employee(
            company_id=company_id,
            first_name="Sarah",
            last_name="Chen",
            role="Electrician",
            trade_level="Journeyman",
            hourly_rate=38,
            burden_rate=52,
            worker_type="employee",
        ),
        models.Employee(
            company_id=company_id,
            first_name="Jake",
            last_name="Miller",
            role="Apprentice",
            trade_level="3rd Year",
            hourly_rate=28,
            burden_rate=38,
            worker_type="employee",
        ),
        models.Employee(
            company_id=company_id,
            first_name="Alex",
            last_name="Rivera",
            role="Subcontractor",
            trade_level="Licensed",
            hourly_rate=55,
            worker_type="contractor",
        ),
    ]
    db.add_all(employees)
    db.flush()

    cost_codes = [
        models.CostCode(company_id=company_id, code="01", description="General", category="Labour"),
        models.CostCode(company_id=company_id, code="02", description="Electrical", category="Labour"),
        models.CostCode(company_id=company_id, code="03", description="Framing", category="Labour"),
        models.CostCode(company_id=company_id, code="04", description="Materials", category="Materials"),
        models.CostCode(company_id=company_id, code="05", description="Finishing", category="Labour"),
    ]
    db.add_all(cost_codes)
    db.flush()

    jobs = [
        models.Job(
            company_id=company_id,
            job_name="Johnson Basement Reno",
            job_code="JBR-2026",
            street="142 Maple Street",
            city="Vancouver",
            province="BC",
            postal_code="V6K 1A1",
            contract_value=85000,
            budgeted_hours=520,
            budgeted_materials_cost=12000,
            status="active",
            notes="Full basement finish — electrical rough-in underway.",
        ),
        models.Job(
            company_id=company_id,
            job_name="Maple Street Addition",
            job_code="MSA-2026",
            street="88 West 12th Ave",
            city="Burnaby",
            province="BC",
            postal_code="V5C 3Z4",
            contract_value=125000,
            budgeted_hours=680,
            budgeted_materials_cost=18000,
            status="active",
            notes="Two-storey rear addition, framing phase.",
        ),
    ]
    db.add_all(jobs)
    db.flush()

    mike, sarah, jake, alex = employees
    cc_general, cc_elec, cc_frame, cc_mat, cc_finish = cost_codes
    johnson, maple = jobs

    timesheets = []
    for i in range(8):
        d = today - timedelta(days=i)
        if d.weekday() >= 5:
            continue
        timesheets.extend([
            models.Timesheet(
                company_id=company_id,
                job_id=johnson.job_id,
                employee_id=sarah.employee_id,
                cost_code_id=cc_elec.cost_code_id,
                shift_date=d,
                hours_worked=8 if i != 2 else 6,
                overtime_hours=2 if i == 2 else 0,
                field_notes="Panel rough-in and conduit runs" if i == 0 else None,
            ),
            models.Timesheet(
                company_id=company_id,
                job_id=johnson.job_id,
                employee_id=jake.employee_id,
                cost_code_id=cc_general.cost_code_id,
                shift_date=d,
                hours_worked=7.5,
                field_notes="Demo and cleanup",
            ),
            models.Timesheet(
                company_id=company_id,
                job_id=maple.job_id,
                employee_id=mike.employee_id,
                cost_code_id=cc_frame.cost_code_id,
                shift_date=d,
                hours_worked=8,
                field_notes="Wall framing and layout",
            ),
        ])
    if today.weekday() < 5:
        timesheets.append(
            models.Timesheet(
                company_id=company_id,
                job_id=johnson.job_id,
                employee_id=alex.employee_id,
                cost_code_id=cc_elec.cost_code_id,
                shift_date=today - timedelta(days=1),
                hours_worked=6,
                field_notes="Sub panel install",
            )
        )
    db.add_all(timesheets)

    materials = [
        models.Material(
            company_id=company_id,
            job_id=johnson.job_id,
            cost_code_id=cc_mat.cost_code_id,
            purchased_by=sarah.employee_id,
            description="12/2 NM-B wire (250 ft roll)",
            supplier="Home Depot",
            quantity=2,
            unit_cost=189.99,
            total_cost=379.98,
            purchase_date=today - timedelta(days=3),
        ),
        models.Material(
            company_id=company_id,
            job_id=johnson.job_id,
            cost_code_id=cc_mat.cost_code_id,
            purchased_by=mike.employee_id,
            description="3/4\" EMT conduit (10 sticks)",
            supplier="Westburne",
            quantity=10,
            unit_cost=12.50,
            total_cost=125.00,
            purchase_date=today - timedelta(days=5),
        ),
        models.Material(
            company_id=company_id,
            job_id=maple.job_id,
            cost_code_id=cc_mat.cost_code_id,
            purchased_by=mike.employee_id,
            description="2x6 SPF lumber (bundle)",
            supplier="Canfor",
            quantity=1,
            unit_cost=890.00,
            total_cost=890.00,
            purchase_date=today - timedelta(days=2),
        ),
    ]
    db.add_all(materials)

    mileage = [
        models.Mileage(
            company_id=company_id,
            job_id=johnson.job_id,
            employee_id=sarah.employee_id,
            trip_date=today - timedelta(days=1),
            km_driven=45,
            purpose="Material pickup",
            notes="Home Depot run",
        ),
        models.Mileage(
            company_id=company_id,
            job_id=maple.job_id,
            employee_id=mike.employee_id,
            trip_date=today - timedelta(days=2),
            km_driven=32,
            purpose="Site visit",
        ),
    ]
    db.add_all(mileage)

    schedules = []
    for day_offset in range(5):
        d = week_start + timedelta(days=day_offset)
        schedules.extend([
            models.Schedule(
                company_id=company_id,
                employee_id=sarah.employee_id,
                job_id=johnson.job_id,
                cost_code_id=cc_elec.cost_code_id,
                scheduled_date=d,
                scheduled_hours=8,
                start_time="07:00",
                end_time="15:30",
                color="#2563eb",
                notes="Electrical rough-in",
            ),
            models.Schedule(
                company_id=company_id,
                employee_id=mike.employee_id,
                job_id=maple.job_id,
                cost_code_id=cc_frame.cost_code_id,
                scheduled_date=d,
                scheduled_hours=8,
                start_time="07:00",
                end_time="15:30",
                color="#1a3d2b",
                notes="Framing",
            ),
            models.Schedule(
                company_id=company_id,
                employee_id=jake.employee_id,
                job_id=johnson.job_id,
                cost_code_id=cc_general.cost_code_id,
                scheduled_date=d,
                scheduled_hours=7.5,
                start_time="07:30",
                end_time="15:00",
                color="#7c3aed",
            ),
        ])
    db.add_all(schedules)

    inventory = [
        models.Inventory(
            company_id=company_id,
            name="Wire strippers",
            unit="each",
            quantity=4,
            purchase_price=24.99,
            charge_out_price=0,
            notes="Klein tools",
        ),
        models.Inventory(
            company_id=company_id,
            name="Safety vests (L/XL)",
            unit="each",
            quantity=8,
            purchase_price=18.00,
            charge_out_price=0,
        ),
        models.Inventory(
            company_id=company_id,
            name="Extension cord 50ft",
            unit="each",
            quantity=3,
            purchase_price=45.00,
            charge_out_price=5.00,
        ),
    ]
    db.add_all(inventory)

    change_order = models.ChangeOrder(
        company_id=company_id,
        job_id=johnson.job_id,
        description="Added 4 pot lights in rec room (client request)",
        amount=1200,
        order_type="addition",
    )
    db.add(change_order)

    db.commit()

    return {
        "skipped": False,
        "message": "Demo data loaded successfully.",
        "employees": len(employees),
        "jobs": len(jobs),
        "cost_codes": len(cost_codes),
        "timesheets": len(timesheets),
        "materials": len(materials),
        "schedules": len(schedules),
        "mileage": len(mileage),
        "inventory": len(inventory),
    }


if __name__ == "__main__":
    import sys
    from database import SessionLocal

    force = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    db = SessionLocal()
    try:
        if args:
            company_id = int(args[0])
        else:
            owner = db.query(models.User).filter(models.User.role == "owner").first()
            if not owner:
                print("No owner found. Usage: python seed_demo.py [company_id] [--force]")
                sys.exit(1)
            company_id = owner.company_id
            print(f"Seeding company {company_id} ({owner.email})")
        result = seed_company_demo(db, company_id, force=force)
        print(result)
    finally:
        db.close()
