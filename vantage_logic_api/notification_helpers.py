"""Shared notification helpers for VantageLogic."""

from sqlalchemy.orm import Session

import models


def notify_users(
    db: Session,
    company_id: int,
    user_ids: list[int],
    ntype: str,
    title: str,
    message: str,
    related_id: int | None = None,
    related_type: str | None = None,
):
    seen = set()
    for uid in user_ids:
        if not uid or uid in seen:
            continue
        seen.add(uid)
        db.add(models.Notification(
            company_id=company_id,
            user_id=uid,
            type=ntype,
            title=title,
            message=(message or "")[:500],
            related_id=related_id,
            related_type=related_type,
        ))


def notify_company_owners(
    db: Session,
    company_id: int,
    exclude_user_id: int | None,
    ntype: str,
    title: str,
    message: str,
    related_id: int | None = None,
    related_type: str | None = None,
):
    owners = db.query(models.User).filter(
        models.User.company_id == company_id,
        models.User.role.in_(["owner", "admin"]),
        models.User.active == True,
    ).all()
    ids = [o.user_id for o in owners if o.user_id != exclude_user_id]
    notify_users(db, company_id, ids, ntype, title, message, related_id, related_type)


def notify_employee_user(
    db: Session,
    company_id: int,
    employee_id: int | None,
    ntype: str,
    title: str,
    message: str,
    related_id: int | None = None,
    related_type: str | None = None,
):
    if not employee_id:
        return
    user = db.query(models.User).filter(
        models.User.employee_id == employee_id,
        models.User.company_id == company_id,
        models.User.active == True,
    ).first()
    if user:
        notify_users(db, company_id, [user.user_id], ntype, title, message, related_id, related_type)


def notify_schedule_crew(
    db: Session,
    company_id: int,
    employee_id: int,
    ntype: str,
    title: str,
    message: str,
    schedule_id: int,
):
    notify_employee_user(
        db, company_id, employee_id, ntype, title, message, schedule_id, "schedule",
    )


def maybe_notify_budget_warning(db: Session, company_id: int, job_id: int):
    """Notify owners once per unread cycle when a project exceeds 90% of budgeted hours."""
    job = db.query(models.Job).filter(
        models.Job.job_id == job_id,
        models.Job.company_id == company_id,
    ).first()
    if not job or not job.budgeted_hours or float(job.budgeted_hours) <= 0:
        return

    existing = db.query(models.Notification).filter(
        models.Notification.company_id == company_id,
        models.Notification.type == "budget_warning",
        models.Notification.related_id == job_id,
        models.Notification.related_type == "job",
        models.Notification.read == False,
    ).first()
    if existing:
        return

    timesheets = db.query(models.Timesheet).filter(models.Timesheet.job_id == job_id).all()
    total_hours = sum(float(t.hours_worked or 0) + float(t.overtime_hours or 0) for t in timesheets)
    budget = float(job.budgeted_hours)
    pct = total_hours / budget if budget else 0

    if pct < 0.9:
        return

    if pct >= 1.0:
        msg = f"{job.job_name}: {total_hours:.1f}h logged vs {budget:.1f}h budget — over budget"
    else:
        msg = f"{job.job_name}: {total_hours:.1f}h of {budget:.1f}h budget used ({int(pct * 100)}%)"

    notify_company_owners(
        db, company_id, None,
        "budget_warning",
        "Project hours alert",
        msg,
        job_id, "job",
    )
