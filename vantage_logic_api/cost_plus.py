"""Cost-Plus estimating, invoicing, and magic-link routes."""

from datetime import datetime, timedelta, date
import os
import secrets

from fastapi import Depends, HTTPException, Body, File, UploadFile, Form, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

import models

MILEAGE_RATE_DEFAULT = 0.70
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://app.vantagelogic.ca")

DEFAULT_TEMPLATES = [
    {"name": "Bathroom Demo", "estimated_hours": 8, "estimated_material_cost": 150, "category": "Demo"},
    {"name": "Rough Plumbing", "estimated_hours": 12, "estimated_material_cost": 800, "category": "Plumbing"},
    {"name": "Tile Install", "estimated_hours": 16, "estimated_material_cost": 600, "category": "Tile"},
    {"name": "Electrical Rough-In", "estimated_hours": 10, "estimated_material_cost": 450, "category": "Electrical"},
    {"name": "Drywall & Mud", "estimated_hours": 20, "estimated_material_cost": 350, "category": "Drywall"},
    {"name": "Paint — Interior", "estimated_hours": 14, "estimated_material_cost": 280, "category": "Paint"},
]


class EstimateLineIn(BaseModel):
    template_id: int | None = None
    cost_code_id: int | None = None
    description: str
    quantity: float = 1
    estimated_hours: float = 0
    material_cost: float = 0
    labor_cost: float = 0


class EstimateCreateIn(BaseModel):
    title: str = "Cost-Plus Estimate"
    notes: str | None = None
    crew_count: int | None = None
    estimated_mileage_km: float | None = None
    line_items: list[EstimateLineIn]


class EstimateUpdateIn(BaseModel):
    title: str | None = None
    notes: str | None = None
    estimated_mileage_km: float | None = None
    customer_email: str | None = None
    field_notes: str | None = None
    scope_summary: str | None = None
    line_items: list[EstimateLineIn] | None = None


class FieldEstimateCreateIn(BaseModel):
    job_id: int | None = None
    client_name: str | None = None
    city: str | None = None
    customer_email: str | None = None
    field_notes: str | None = None
    scope_summary: str | None = None
    estimated_mileage_km: float | None = None
    line_items: list[EstimateLineIn] | None = None


class FieldEstimateGenerateIn(BaseModel):
    transcript: str | None = None
    description: str | None = None
    scope_summary: str | None = None
    field_notes: str | None = None
    job_type: str | None = None


class EstimateReturnIn(BaseModel):
    reason: str | None = None


class JobTypeIn(BaseModel):
    name: str
    hint: str | None = None
    cost_code_ids: list[int] = []


class JobTypeSaveIn(JobTypeIn):
    job_type_id: int | None = None


class TemplateIn(BaseModel):
    name: str
    cost_code_id: int | None = None
    description: str | None = None
    estimated_hours: float = 0
    estimated_material_cost: float = 0
    estimated_labor_cost: float = 0


class TemplateSaveIn(TemplateIn):
    template_id: int | None = None


class InvoiceGenerateIn(BaseModel):
    markup_percent: float | None = None
    include_receipts: bool = False
    period_start: str | None = None
    period_end: str | None = None


class MagicLinkCreateIn(BaseModel):
    purpose: str
    subcontractor_name: str | None = None
    expires_days: int = 7


class EstimateSuggestIn(BaseModel):
    description: str
    job_type: str | None = None


class EstimateSendIn(BaseModel):
    customer_email: str | None = None
    customer_name: str | None = None


def register_cost_plus_routes(app, get_db, get_current_user, require_owner, timesheet_labour_cost, limiter=None):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    def _next_invoice_number(db: Session, company_id: int) -> str:
        count = db.query(models.Invoice).filter(models.Invoice.company_id == company_id).count()
        return f"INV-{company_id:03d}-{count + 1:04d}"

    def _company_labor_rate(company) -> float:
        return float(getattr(company, "estimate_labor_rate_per_hour", None) or 75)

    def _estimate_tax(company, subtotal: float) -> dict:
        rate = float(getattr(company, "tax_rate_percent", None) or 0)
        label = getattr(company, "tax_label", None) or "HST"
        tax_amount = round(subtotal * rate / 100, 2) if rate > 0 else 0.0
        return {
            "tax_rate_percent": rate,
            "tax_label": label,
            "tax_amount": tax_amount,
            "total_with_tax": round(subtotal + tax_amount, 2),
        }

    def _pdf_company_lines(company) -> list[str]:
        lines = []
        addr = getattr(company, "company_address", None)
        if addr:
            lines.append(addr.replace("\n", "<br/>"))
        phone = getattr(company, "company_phone", None)
        email = getattr(company, "company_email", None)
        if phone:
            lines.append(f"Phone: {phone}")
        if email:
            lines.append(f"Email: {email}")
        tax_num = getattr(company, "tax_number", None)
        if tax_num:
            lines.append(f"Tax / Business #: {tax_num}")
        return lines

    def _pdf_add_header(story, styles, company, title: str, meta_lines: list[str]):
        from reportlab.platypus import Paragraph, Spacer
        story.append(Paragraph(f"<b>{company.company_name}</b>", styles["Title"]))
        for line in _pdf_company_lines(company):
            story.append(Paragraph(line, styles["Normal"]))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>{title}</b>", styles["Heading2"]))
        for line in meta_lines:
            story.append(Paragraph(line, styles["Normal"]))
        story.append(Spacer(1, 14))

    def _user_display_name(db: Session, user_id: int | None) -> str | None:
        if not user_id:
            return None
        user = db.query(models.User).filter(models.User.user_id == user_id).first()
        if not user:
            return None
        if user.employee_id:
            emp = db.query(models.Employee).filter(models.Employee.employee_id == user.employee_id).first()
            if emp:
                return f"{emp.first_name} {emp.last_name}".strip()
        return user.email

    def _is_owner_role(user) -> bool:
        return user.role in ("owner", "admin")

    def _notify_users(db: Session, company_id: int, user_ids: list[int], ntype: str, title: str, message: str, related_id: int, related_type: str):
        for uid in user_ids:
            if not uid:
                continue
            db.add(models.Notification(
                company_id=company_id,
                user_id=uid,
                type=ntype,
                title=title,
                message=message[:500] if message else None,
                related_id=related_id,
                related_type=related_type,
            ))

    def _notify_company_owners(db: Session, company_id: int, exclude_user_id: int | None, ntype: str, title: str, message: str, related_id: int, related_type: str):
        owners = db.query(models.User).filter(
            models.User.company_id == company_id,
            models.User.role.in_(["owner", "admin"]),
        ).all()
        ids = [o.user_id for o in owners if o.user_id != exclude_user_id]
        _notify_users(db, company_id, ids, ntype, title, message, related_id, related_type)

    def _get_estimate(db: Session, estimate_id: int, company_id: int):
        estimate = db.query(models.Estimate).filter(
            models.Estimate.estimate_id == estimate_id,
            models.Estimate.company_id == company_id,
        ).first()
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        return estimate

    def _can_edit_estimate_lines(user, estimate) -> bool:
        if estimate.status == "approved":
            return False
        if _is_owner_role(user):
            return estimate.status in ("draft", "sent", "field_draft", "pending_review")
        if user.role == "crew":
            return estimate.status == "field_draft" and estimate.created_by == user.user_id
        return False

    def _apply_line_items(db: Session, estimate: models.Estimate, line_items: list[EstimateLineIn]):
        db.query(models.EstimateLineItem).filter(
            models.EstimateLineItem.estimate_id == estimate.estimate_id
        ).delete()
        for i, ln in enumerate(line_items):
            cc = db.query(models.CostCode).filter(models.CostCode.cost_code_id == ln.cost_code_id).first() if ln.cost_code_id else None
            desc = ln.description or (cc.description if cc else "Line item")
            db.add(models.EstimateLineItem(
                estimate_id=estimate.estimate_id,
                template_id=ln.template_id,
                cost_code_id=ln.cost_code_id,
                description=desc,
                quantity=ln.quantity,
                estimated_hours=ln.estimated_hours,
                material_cost=ln.material_cost,
                labor_cost=ln.labor_cost,
                sort_order=i,
            ))

    def _recalc_estimate_totals(db: Session, estimate: models.Estimate, company_id: int | None = None):
        company = None
        if company_id:
            company = db.query(models.Company).filter(models.Company.company_id == company_id).first()
        labor_rate = _company_labor_rate(company) if company else 0.0
        lines = db.query(models.EstimateLineItem).filter(
            models.EstimateLineItem.estimate_id == estimate.estimate_id
        ).all()
        total_hours = total_mat = total_lab = 0.0
        for ln in lines:
            qty = float(ln.quantity or 1)
            hrs = float(ln.estimated_hours or 0)
            mat = float(ln.material_cost or 0)
            lab = float(ln.labor_cost or 0)
            if lab <= 0 and hrs > 0 and labor_rate > 0:
                lab = round(hrs * labor_rate, 2)
                ln.labor_cost = lab
            total_hours += hrs * qty
            total_mat += mat * qty
            total_lab += lab * qty
        estimate.total_hours = round(total_hours, 2)
        estimate.total_material_cost = round(total_mat, 2)
        estimate.total_labor_cost = round(total_lab, 2)
        estimate.total_cost = round(total_mat + total_lab, 2)

    def _add_mileage_to_estimate_total(db: Session, estimate: models.Estimate, company_id: int):
        km = float(estimate.estimated_mileage_km or 0)
        if km <= 0:
            return
        company = db.query(models.Company).filter(models.Company.company_id == company_id).first()
        rate = float(getattr(company, "mileage_rate_per_km", None) or MILEAGE_RATE_DEFAULT)
        estimate.total_cost = round(float(estimate.total_cost or 0) + km * rate, 2)

    def _apply_estimate_baseline(db: Session, estimate: models.Estimate, job: models.Job):
        job.contract_value = float(estimate.total_cost or 0)
        job.budgeted_hours = float(estimate.total_hours or 0)
        job.budgeted_materials_cost = float(estimate.total_material_cost or 0)
        db.query(models.Estimate).filter(
            models.Estimate.job_id == job.job_id,
            models.Estimate.estimate_id != estimate.estimate_id,
            models.Estimate.status == "approved",
        ).update({"status": "superseded"})

    def _serialize_estimate(db: Session, estimate: models.Estimate):
        company = db.query(models.Company).filter(models.Company.company_id == estimate.company_id).first()
        lines = db.query(models.EstimateLineItem).filter(
            models.EstimateLineItem.estimate_id == estimate.estimate_id
        ).order_by(models.EstimateLineItem.sort_order).all()
        subtotal = float(estimate.total_cost or 0)
        tax_info = _estimate_tax(company, subtotal) if company else {
            "tax_rate_percent": 0, "tax_label": "HST", "tax_amount": 0, "total_with_tax": subtotal,
        }
        comments = db.query(models.EstimateComment).filter(
            models.EstimateComment.estimate_id == estimate.estimate_id
        ).order_by(models.EstimateComment.created_at.desc()).all()
        attachments = db.query(models.EstimateAttachment).filter(
            models.EstimateAttachment.estimate_id == estimate.estimate_id
        ).all()
        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        return {
            "estimate_id": estimate.estimate_id,
            "job_id": estimate.job_id,
            "job_name": job.job_name if job else None,
            "title": estimate.title,
            "status": estimate.status,
            "source": getattr(estimate, "source", None) or "office",
            "total_hours": float(estimate.total_hours or 0),
            "total_material_cost": float(estimate.total_material_cost or 0),
            "total_labor_cost": float(estimate.total_labor_cost or 0),
            "total_cost": subtotal,
            "subtotal": subtotal,
            "tax_rate_percent": tax_info["tax_rate_percent"],
            "tax_label": tax_info["tax_label"],
            "tax_amount": tax_info["tax_amount"],
            "total_with_tax": tax_info["total_with_tax"],
            "estimated_mileage_km": float(estimate.estimated_mileage_km or 0) if estimate.estimated_mileage_km else None,
            "customer_email": estimate.customer_email,
            "field_notes": getattr(estimate, "field_notes", None),
            "scope_summary": getattr(estimate, "scope_summary", None),
            "rejection_reason": getattr(estimate, "rejection_reason", None),
            "created_by": getattr(estimate, "created_by", None),
            "created_by_name": _user_display_name(db, getattr(estimate, "created_by", None)),
            "reviewed_by": getattr(estimate, "reviewed_by", None),
            "reviewed_at": str(estimate.reviewed_at) if getattr(estimate, "reviewed_at", None) else None,
            "submitted_at": str(estimate.submitted_at) if getattr(estimate, "submitted_at", None) else None,
            "sent_at": str(estimate.sent_at) if estimate.sent_at else None,
            "comment_count": len(comments),
            "last_activity_at": str(comments[0].created_at) if comments else str(estimate.created_at),
            "attachment_count": len(attachments),
            "pdf_url": f"/estimates/{estimate.estimate_id}/pdf" if getattr(estimate, "pdf_path", None) else None,
            "pdf_path": getattr(estimate, "pdf_path", None),
            "line_items": [{
                "line_item_id": l.line_item_id,
                "description": l.description,
                "quantity": float(l.quantity or 1),
                "estimated_hours": float(l.estimated_hours or 0),
                "material_cost": float(l.material_cost or 0),
                "labor_cost": float(l.labor_cost or 0),
                "cost_code_id": l.cost_code_id,
                "template_id": l.template_id,
            } for l in lines],
        }

    def _parse_date(val: str | None):
        if not val:
            return None
        return datetime.strptime(val, "%Y-%m-%d").date()

    def _is_unbilled(record) -> bool:
        billed = getattr(record, "billed", False)
        return not billed

    def _sweep_unbilled_costs(db: Session, job_id: int, company_id: int, period_start=None, period_end=None):
        company = db.query(models.Company).filter(models.Company.company_id == company_id).first()
        mileage_rate = float(getattr(company, "mileage_rate_per_km", None) or MILEAGE_RATE_DEFAULT)

        timesheets = db.query(models.Timesheet).filter(
            models.Timesheet.job_id == job_id,
            models.Timesheet.company_id == company_id,
        ).all()
        timesheets = [t for t in timesheets if _is_unbilled(t)]

        materials = db.query(models.Material).filter(
            models.Material.job_id == job_id,
            models.Material.company_id == company_id,
        ).all()
        materials = [m for m in materials if _is_unbilled(m)]

        mileage = db.query(models.Mileage).filter(
            models.Mileage.job_id == job_id,
            models.Mileage.company_id == company_id,
        ).all()
        mileage = [m for m in mileage if _is_unbilled(m)]

        if period_start:
            timesheets = [t for t in timesheets if t.shift_date and t.shift_date >= period_start]
            materials = [m for m in materials if m.purchase_date and m.purchase_date >= period_start]
            mileage = [m for m in mileage if m.trip_date and m.trip_date >= period_start]
        if period_end:
            timesheets = [t for t in timesheets if t.shift_date and t.shift_date <= period_end]
            materials = [m for m in materials if m.purchase_date and m.purchase_date <= period_end]
            mileage = [m for m in mileage if m.trip_date and m.trip_date <= period_end]

        labor_groups = {}
        for ts in timesheets:
            emp = db.query(models.Employee).filter(models.Employee.employee_id == ts.employee_id).first()
            cost = timesheet_labour_cost(ts, emp, company)
            cc_id = ts.cost_code_id or 0
            cc = db.query(models.CostCode).filter(models.CostCode.cost_code_id == cc_id).first() if cc_id else None
            if cc_id not in labor_groups:
                labor_groups[cc_id] = {
                    "cost_code_id": cc_id or None,
                    "label": cc.description if cc else "General Labor",
                    "amount": 0,
                    "ids": [],
                }
            labor_groups[cc_id]["amount"] += cost
            labor_groups[cc_id]["ids"].append(ts.timesheet_id)

        mat_groups = {}
        for m in materials:
            cc_id = m.cost_code_id or 0
            cc = db.query(models.CostCode).filter(models.CostCode.cost_code_id == cc_id).first() if cc_id else None
            if cc_id not in mat_groups:
                mat_groups[cc_id] = {
                    "cost_code_id": cc_id or None,
                    "label": cc.description if cc else "Materials",
                    "amount": 0,
                    "ids": [],
                    "receipts": [],
                }
            mat_groups[cc_id]["amount"] += float(m.total_cost or 0)
            mat_groups[cc_id]["ids"].append(m.material_id)
            if m.receipt_image_url:
                mat_groups[cc_id]["receipts"].append(m.receipt_image_url)

        mi_total = sum(float(m.km_driven or 0) * mileage_rate for m in mileage)
        mi_ids = [m.mileage_id for m in mileage]
        receipt_urls = [u for g in mat_groups.values() for u in g["receipts"]]

        return {
            "labor_groups": labor_groups,
            "mat_groups": mat_groups,
            "mi_total": mi_total,
            "mi_ids": mi_ids,
            "timesheets": timesheets,
            "materials": materials,
            "mileage": mileage,
            "receipt_urls": receipt_urls,
        }

    def _preview_from_sweep(sweep: dict, markup_pct: float) -> dict:
        line_items = []
        raw_subtotal = 0.0
        for g in sweep["labor_groups"].values():
            raw = round(g["amount"], 2)
            billed = round(raw * (1 + markup_pct / 100), 2)
            raw_subtotal += raw
            line_items.append({
                "category": "labor",
                "description": f"Labor — {g['label']}",
                "raw": raw,
                "billed": billed,
                "entry_count": len(g["ids"]),
            })
        for g in sweep["mat_groups"].values():
            raw = round(g["amount"], 2)
            billed = round(raw * (1 + markup_pct / 100), 2)
            raw_subtotal += raw
            line_items.append({
                "category": "materials",
                "description": f"Materials — {g['label']}",
                "raw": raw,
                "billed": billed,
                "entry_count": len(g["ids"]),
            })
        if sweep["mi_total"] > 0:
            raw = round(sweep["mi_total"], 2)
            billed = round(raw * (1 + markup_pct / 100), 2)
            raw_subtotal += raw
            line_items.append({
                "category": "mileage",
                "description": "Mileage Reimbursement",
                "raw": raw,
                "billed": billed,
                "entry_count": len(sweep["mi_ids"]),
            })
        markup_amount = round(raw_subtotal * (markup_pct / 100), 2)
        return {
            "line_items": line_items,
            "raw_subtotal": raw_subtotal,
            "markup_percent": markup_pct,
            "markup_amount": markup_amount,
            "total": round(raw_subtotal + markup_amount, 2),
            "entry_counts": {
                "timesheets": len(sweep["timesheets"]),
                "materials": len(sweep["materials"]),
                "mileage_trips": len(sweep["mileage"]),
            },
            "has_unbilled": bool(sweep["timesheets"] or sweep["materials"] or sweep["mileage"]),
        }

    def _generate_invoice_pdf(invoice, job, company, line_items, receipt_urls=None):
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch

        path = os.path.join(UPLOAD_DIR, f"invoice_{invoice.invoice_id}.pdf")
        styles = getSampleStyleSheet()
        doc = SimpleDocTemplate(path, pagesize=letter, topMargin=0.75 * inch)
        story = []

        created = invoice.created_at.strftime("%Y-%m-%d") if invoice.created_at else ""
        meta = [f"Invoice #: <b>{invoice.invoice_number}</b>", f"Date: {created}"]
        meta.append(f"Project: <b>{job.job_name}</b>")
        if job.city:
            meta.append(f"Location: {job.city}")
        if job.street:
            meta.append(f"Site: {job.street}")
        _pdf_add_header(story, styles, company, "Cost-Plus Invoice", meta)

        markup_pct = float(invoice.markup_percent or 0)
        table_data = [["Description", "Cost", f"+{markup_pct}% Markup", "Amount"]]
        for li in line_items:
            markup_part = round(li["billed"] - li["raw"], 2)
            table_data.append([
                li["description"],
                f"${li['raw']:,.2f}",
                f"${markup_part:,.2f}",
                f"${li['billed']:,.2f}",
            ])
        table_data.append(["", "", "Subtotal (cost)", f"${float(invoice.raw_subtotal):,.2f}"])
        table_data.append(["", "", f"Markup ({markup_pct}%)", f"${float(invoice.markup_amount):,.2f}"])
        table_data.append(["", "", "TOTAL DUE", f"${float(invoice.total):,.2f}"])

        t = Table(table_data, colWidths=[3.2 * inch, 1.1 * inch, 1.3 * inch, 1.1 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3d2b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, len(line_items)), 0.5, colors.grey),
            ("FONTNAME", (0, -3), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#fdf4e3")),
        ]))
        story.append(t)

        if receipt_urls:
            story.append(PageBreak())
            story.append(Paragraph("<b>Receipt Appendix</b>", styles["Heading2"]))
            for url in receipt_urls:
                if url and os.path.exists(url):
                    try:
                        story.append(Spacer(1, 12))
                        story.append(Image(url, width=5.5 * inch, height=4 * inch, kind="proportional"))
                    except Exception:
                        story.append(Paragraph(f"[Receipt: {os.path.basename(url)}]", styles["Normal"]))

        doc.build(story)
        return path

    def _generate_estimate_pdf(db: Session, estimate: models.Estimate, company, job):
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch

        lines = db.query(models.EstimateLineItem).filter(
            models.EstimateLineItem.estimate_id == estimate.estimate_id
        ).order_by(models.EstimateLineItem.sort_order).all()

        path = os.path.join(UPLOAD_DIR, f"estimate_{estimate.estimate_id}.pdf")
        styles = getSampleStyleSheet()
        doc = SimpleDocTemplate(path, pagesize=letter, topMargin=0.75 * inch)
        story = []

        created = estimate.created_at.strftime("%Y-%m-%d") if estimate.created_at else ""
        meta = [f"Estimate #: <b>EST-{estimate.estimate_id:04d}</b>", f"Date: {created}"]
        meta.append(f"Project: <b>{job.job_name}</b>")
        if job.city:
            meta.append(f"Location: {job.city}")
        if job.street:
            meta.append(f"Site: {job.street}")
        if estimate.customer_email:
            meta.append(f"Prepared for: {estimate.customer_email}")
        _pdf_add_header(story, styles, company, "Project Estimate", meta)
        story.append(Paragraph(
            "<i>This is a proposal for customer review. Work begins after written approval.</i>",
            styles["Normal"],
        ))
        if estimate.notes:
            story.append(Spacer(1, 6))
            story.append(Paragraph(f"<b>Notes:</b> {estimate.notes}", styles["Normal"]))
        story.append(Spacer(1, 12))

        table_data = [["Work type", "Hours", "Labour", "Materials", "Subtotal"]]
        for ln in lines:
            hrs = float(ln.estimated_hours or 0) * float(ln.quantity or 1)
            mat = float(ln.material_cost or 0) * float(ln.quantity or 1)
            lab = float(ln.labor_cost or 0) * float(ln.quantity or 1)
            row_total = mat + lab
            table_data.append([
                ln.description,
                f"{hrs:,.1f}",
                f"${lab:,.2f}",
                f"${mat:,.2f}",
                f"${row_total:,.2f}",
            ])

        km = float(estimate.estimated_mileage_km or 0)
        if km > 0:
            rate = float(getattr(company, "mileage_rate_per_km", None) or MILEAGE_RATE_DEFAULT)
            mi_cost = round(km * rate, 2)
            table_data.append(["Mileage / travel", "—", "—", f"{km:,.0f} km", f"${mi_cost:,.2f}"])

        subtotal = float(estimate.total_cost or 0)
        tax_info = _estimate_tax(company, subtotal)
        table_data.append(["", "", "", "Subtotal", f"${subtotal:,.2f}"])
        if tax_info["tax_rate_percent"] > 0:
            table_data.append([
                "", "", "",
                f"{tax_info['tax_label']} ({tax_info['tax_rate_percent']:g}%)",
                f"${tax_info['tax_amount']:,.2f}",
            ])
        table_data.append(["", "", "", "TOTAL", f"${tax_info['total_with_tax']:,.2f}"])

        t = Table(table_data, colWidths=[2.2 * inch, 0.7 * inch, 0.85 * inch, 0.95 * inch, 0.95 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3d2b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, len(lines)), 0.5, colors.grey),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#fdf4e3")),
        ]))
        story.append(t)
        story.append(Spacer(1, 24))
        story.append(Paragraph(f"<b>Estimated hours:</b> {float(estimate.total_hours or 0):,.1f}", styles["Normal"]))
        story.append(Spacer(1, 8))
        story.append(Paragraph(
            "<i>Payment terms and schedule to be confirmed upon approval. "
            "This estimate is valid for 30 days from the date above.</i>",
            styles["Normal"],
        ))
        story.append(Spacer(1, 24))
        story.append(Paragraph("Customer approval: _________________________  Date: __________", styles["Normal"]))

        doc.build(story)
        return path

    @app.get("/job-types")
    def list_job_types(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        types = db.query(models.JobType).filter(
            models.JobType.company_id == current_user.company_id,
            models.JobType.active == True,
        ).order_by(models.JobType.sort_order, models.JobType.name).all()
        return [{
            "job_type_id": j.job_type_id,
            "name": j.name,
            "hint": j.hint,
            "cost_code_ids": j.cost_code_ids or [],
        } for j in types]

    @app.post("/job-types")
    def create_job_type(
        body: JobTypeIn,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        if not body.name.strip():
            raise HTTPException(status_code=400, detail="Name is required")
        jt = models.JobType(
            company_id=current_user.company_id,
            name=body.name.strip(),
            hint=body.hint,
            cost_code_ids=body.cost_code_ids or [],
        )
        db.add(jt)
        db.commit()
        db.refresh(jt)
        return {"job_type_id": jt.job_type_id, "name": jt.name, "hint": jt.hint, "cost_code_ids": jt.cost_code_ids or []}

    @app.post("/job-types/save")
    def save_job_type(
        body: JobTypeSaveIn,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        if not body.name.strip():
            raise HTTPException(status_code=400, detail="Job type name is required")
        if body.job_type_id:
            jt = db.query(models.JobType).filter(
                models.JobType.job_type_id == body.job_type_id,
                models.JobType.company_id == current_user.company_id,
            ).first()
            if not jt:
                raise HTTPException(status_code=404, detail="Job type not found")
            jt.name = body.name.strip()
            jt.hint = body.hint
            jt.cost_code_ids = body.cost_code_ids or []
        else:
            jt = models.JobType(
                company_id=current_user.company_id,
                name=body.name.strip(),
                hint=body.hint,
                cost_code_ids=body.cost_code_ids or [],
            )
            db.add(jt)
        db.commit()
        db.refresh(jt)
        return {"job_type_id": jt.job_type_id, "name": jt.name, "hint": jt.hint, "cost_code_ids": jt.cost_code_ids or []}

    @app.patch("/job-types/{job_type_id}")
    @app.put("/job-types/{job_type_id}")
    def update_job_type(
        job_type_id: int,
        body: JobTypeIn,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        jt = db.query(models.JobType).filter(
            models.JobType.job_type_id == job_type_id,
            models.JobType.company_id == current_user.company_id,
        ).first()
        if not jt:
            raise HTTPException(status_code=404, detail="Job type not found")
        jt.name = body.name.strip()
        jt.hint = body.hint
        jt.cost_code_ids = body.cost_code_ids or []
        db.commit()
        return {"job_type_id": jt.job_type_id, "name": jt.name, "hint": jt.hint, "cost_code_ids": jt.cost_code_ids or []}

    @app.delete("/job-types/{job_type_id}")
    def delete_job_type(
        job_type_id: int,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        jt = db.query(models.JobType).filter(
            models.JobType.job_type_id == job_type_id,
            models.JobType.company_id == current_user.company_id,
        ).first()
        if not jt:
            raise HTTPException(status_code=404, detail="Job type not found")
        jt.active = False
        db.commit()
        return {"message": "Job type removed"}

    @app.get("/estimate-templates")
    def list_estimate_templates(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        templates = db.query(models.WorkCategoryTemplate).filter(
            models.WorkCategoryTemplate.company_id == current_user.company_id,
            models.WorkCategoryTemplate.active == True,
        ).order_by(models.WorkCategoryTemplate.sort_order, models.WorkCategoryTemplate.name).all()

        if not templates:
            cost_codes = {
                c.category: c.cost_code_id
                for c in db.query(models.CostCode).filter(
                    models.CostCode.company_id == current_user.company_id
                ).all()
                if c.category
            }
            for i, t in enumerate(DEFAULT_TEMPLATES):
                db.add(models.WorkCategoryTemplate(
                    company_id=current_user.company_id,
                    cost_code_id=cost_codes.get(t["category"]),
                    name=t["name"],
                    estimated_hours=t["estimated_hours"],
                    estimated_material_cost=t["estimated_material_cost"],
                    sort_order=i,
                ))
            db.commit()
            templates = db.query(models.WorkCategoryTemplate).filter(
                models.WorkCategoryTemplate.company_id == current_user.company_id,
                models.WorkCategoryTemplate.active == True,
            ).all()

        cc_map = {
            c.cost_code_id: c
            for c in db.query(models.CostCode).filter(
                models.CostCode.company_id == current_user.company_id
            ).all()
        }
        return [{
            "template_id": t.template_id,
            "cost_code_id": t.cost_code_id,
            "name": t.name,
            "description": t.description,
            "estimated_hours": float(t.estimated_hours or 0),
            "estimated_material_cost": float(t.estimated_material_cost or 0),
            "estimated_labor_cost": float(t.estimated_labor_cost or 0),
            "category": cc_map[t.cost_code_id].category if t.cost_code_id and t.cost_code_id in cc_map else None,
            "cost_code_label": cc_map[t.cost_code_id].description if t.cost_code_id and t.cost_code_id in cc_map else None,
        } for t in templates]

    @app.post("/estimate-templates")
    def create_estimate_template(
        body: TemplateIn,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        if not body.name.strip():
            raise HTTPException(status_code=400, detail="Template name is required")
        t = models.WorkCategoryTemplate(
            company_id=current_user.company_id,
            cost_code_id=body.cost_code_id,
            name=body.name.strip(),
            description=body.description,
            estimated_hours=body.estimated_hours,
            estimated_material_cost=body.estimated_material_cost,
            estimated_labor_cost=body.estimated_labor_cost,
        )
        db.add(t)
        db.commit()
        db.refresh(t)
        return {"template_id": t.template_id, "name": t.name}

    @app.post("/estimate-templates/save")
    def save_estimate_template(
        body: TemplateSaveIn,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        if not body.name.strip():
            raise HTTPException(status_code=400, detail="Template name is required")
        if body.template_id:
            t = db.query(models.WorkCategoryTemplate).filter(
                models.WorkCategoryTemplate.template_id == body.template_id,
                models.WorkCategoryTemplate.company_id == current_user.company_id,
            ).first()
            if not t:
                raise HTTPException(status_code=404, detail="Template not found")
            t.name = body.name.strip()
            t.cost_code_id = body.cost_code_id
            t.description = body.description
            t.estimated_hours = body.estimated_hours
            t.estimated_material_cost = body.estimated_material_cost
            t.estimated_labor_cost = body.estimated_labor_cost
        else:
            t = models.WorkCategoryTemplate(
                company_id=current_user.company_id,
                cost_code_id=body.cost_code_id,
                name=body.name.strip(),
                description=body.description,
                estimated_hours=body.estimated_hours,
                estimated_material_cost=body.estimated_material_cost,
                estimated_labor_cost=body.estimated_labor_cost,
            )
            db.add(t)
        db.commit()
        db.refresh(t)
        return {"template_id": t.template_id, "name": t.name}

    @app.patch("/estimate-templates/{template_id}")
    @app.put("/estimate-templates/{template_id}")
    def update_estimate_template(
        template_id: int,
        body: TemplateIn,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        t = db.query(models.WorkCategoryTemplate).filter(
            models.WorkCategoryTemplate.template_id == template_id,
            models.WorkCategoryTemplate.company_id == current_user.company_id,
        ).first()
        if not t:
            raise HTTPException(status_code=404, detail="Template not found")
        t.name = body.name.strip()
        t.cost_code_id = body.cost_code_id
        t.description = body.description
        t.estimated_hours = body.estimated_hours
        t.estimated_material_cost = body.estimated_material_cost
        t.estimated_labor_cost = body.estimated_labor_cost
        db.commit()
        return {"template_id": t.template_id, "name": t.name}

    @app.post("/estimates/suggest")
    @limiter.limit("10/minute")
    def suggest_estimate(
        request: Request,
        body: EstimateSuggestIn,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        import json
        from main import get_gemini_client

        if not body.description or len(body.description.strip()) < 8:
            raise HTTPException(status_code=400, detail="Describe the job in a few words first")

        templates = db.query(models.WorkCategoryTemplate).filter(
            models.WorkCategoryTemplate.company_id == current_user.company_id,
            models.WorkCategoryTemplate.active == True,
        ).order_by(models.WorkCategoryTemplate.sort_order, models.WorkCategoryTemplate.name).all()

        if not templates:
            raise HTTPException(status_code=400, detail="No estimate templates yet — add work categories in Settings first")

        template_list = [{
            "template_id": t.template_id,
            "name": t.name,
            "estimated_hours": float(t.estimated_hours or 0),
            "estimated_material_cost": float(t.estimated_material_cost or 0),
        } for t in templates]

        job_type_line = f"Job type: {body.job_type}\n" if body.job_type else ""
        prompt = f"""You are a construction estimator. Pick work packages from the template list for this job.

{job_type_line}Description: {body.description.strip()}

Templates (use template_id values exactly as shown):
{json.dumps(template_list)}

Return ONLY valid JSON, no markdown:
{{"items": [{{"template_id": <int>, "quantity": <int>}}], "summary": "<one short sentence>"}}

Pick 2-8 templates that fit. quantity is usually 1 unless the scope clearly repeats (e.g. two bathrooms)."""

        try:
            response = get_gemini_client().models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            raw = (response.text or "").strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw.strip())
            valid_ids = {t.template_id for t in templates}
            items = [
                {"template_id": int(i["template_id"]), "quantity": max(1, int(i.get("quantity") or 1))}
                for i in parsed.get("items", [])
                if int(i.get("template_id", 0)) in valid_ids
            ]
            return {
                "items": items,
                "summary": parsed.get("summary", ""),
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"Estimate suggest error: {e}")
            raise HTTPException(status_code=503, detail="Could not generate suggestion — try tapping templates manually")

    @app.post("/jobs/{job_id}/estimates")
    def create_estimate(
        job_id: int,
        body: EstimateCreateIn,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        job = db.query(models.Job).filter(
            models.Job.job_id == job_id,
            models.Job.company_id == current_user.company_id,
        ).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if not body.line_items:
            raise HTTPException(status_code=400, detail="At least one line item is required")

        estimate = models.Estimate(
            company_id=current_user.company_id,
            job_id=job_id,
            title=body.title,
            notes=body.notes,
            crew_count=body.crew_count,
            estimated_mileage_km=body.estimated_mileage_km,
            status="draft",
        )
        db.add(estimate)
        db.flush()

        for i, ln in enumerate(body.line_items):
            cc = db.query(models.CostCode).filter(models.CostCode.cost_code_id == ln.cost_code_id).first() if ln.cost_code_id else None
            desc = ln.description or (cc.description if cc else "Line item")
            db.add(models.EstimateLineItem(
                estimate_id=estimate.estimate_id,
                template_id=ln.template_id,
                cost_code_id=ln.cost_code_id,
                description=desc,
                quantity=ln.quantity,
                estimated_hours=ln.estimated_hours,
                material_cost=ln.material_cost,
                labor_cost=ln.labor_cost,
                sort_order=i,
            ))
        _recalc_estimate_totals(db, estimate, current_user.company_id)
        _add_mileage_to_estimate_total(db, estimate, current_user.company_id)
        db.commit()
        db.refresh(estimate)
        return _serialize_estimate(db, estimate)

    @app.get("/jobs/{job_id}/estimates")
    def list_estimates(
        job_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        estimates = db.query(models.Estimate).filter(
            models.Estimate.job_id == job_id,
            models.Estimate.company_id == current_user.company_id,
        ).order_by(models.Estimate.created_at.desc()).all()
        return [_serialize_estimate(db, e) for e in estimates]

    @app.get("/estimates/{estimate_id}")
    def get_estimate(
        estimate_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        estimate = db.query(models.Estimate).filter(
            models.Estimate.estimate_id == estimate_id,
            models.Estimate.company_id == current_user.company_id,
        ).first()
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        return _serialize_estimate(db, estimate)

    @app.patch("/estimates/{estimate_id}")
    def update_estimate(
        estimate_id: int,
        body: EstimateUpdateIn,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        estimate = _get_estimate(db, estimate_id, current_user.company_id)
        if estimate.status == "approved":
            raise HTTPException(status_code=400, detail="Approved estimates cannot be edited — use a change order")
        if estimate.status == "pending_review" and not _is_owner_role(current_user):
            raise HTTPException(status_code=403, detail="Estimate is under review — wait for office feedback")
        if not _can_edit_estimate_lines(current_user, estimate) and body.line_items is not None:
            raise HTTPException(status_code=403, detail="You cannot edit this estimate")

        if body.title is not None and _is_owner_role(current_user):
            estimate.title = body.title
        if body.notes is not None and _is_owner_role(current_user):
            estimate.notes = body.notes
        if body.estimated_mileage_km is not None:
            estimate.estimated_mileage_km = body.estimated_mileage_km if body.estimated_mileage_km > 0 else None
        if body.customer_email is not None:
            estimate.customer_email = body.customer_email.strip() if body.customer_email else None
        if body.field_notes is not None:
            estimate.field_notes = body.field_notes
        if body.scope_summary is not None:
            estimate.scope_summary = body.scope_summary

        if body.line_items is not None:
            if not body.line_items:
                raise HTTPException(status_code=400, detail="At least one line item is required")
            _apply_line_items(db, estimate, body.line_items)

        _recalc_estimate_totals(db, estimate, current_user.company_id)
        _add_mileage_to_estimate_total(db, estimate, current_user.company_id)
        if estimate.status == "sent" and _is_owner_role(current_user):
            estimate.status = "draft"
            estimate.sent_at = None
        estimate.pdf_path = None
        db.commit()
        db.refresh(estimate)
        return _serialize_estimate(db, estimate)

    @app.get("/estimates/{estimate_id}/pdf")
    def download_estimate_pdf(
        estimate_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        estimate = db.query(models.Estimate).filter(
            models.Estimate.estimate_id == estimate_id,
            models.Estimate.company_id == current_user.company_id,
        ).first()
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        company = db.query(models.Company).filter(models.Company.company_id == current_user.company_id).first()
        _recalc_estimate_totals(db, estimate, current_user.company_id)
        _add_mileage_to_estimate_total(db, estimate, current_user.company_id)
        path = _generate_estimate_pdf(db, estimate, company, job)
        estimate.pdf_path = path
        db.commit()
        return FileResponse(path, media_type="application/pdf", filename=f"estimate_{estimate_id}.pdf")

    @app.post("/estimates/{estimate_id}/send-customer")
    def send_estimate_to_customer(
        estimate_id: int,
        body: EstimateSendIn = Body(default_factory=EstimateSendIn),
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        estimate = db.query(models.Estimate).filter(
            models.Estimate.estimate_id == estimate_id,
            models.Estimate.company_id == current_user.company_id,
        ).first()
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        if estimate.status == "approved":
            raise HTTPException(status_code=400, detail="Estimate already approved for dashboard baseline")
        if estimate.status not in ("draft",):
            raise HTTPException(status_code=400, detail="Only office-approved draft estimates can be marked as sent to customer")

        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        company = db.query(models.Company).filter(models.Company.company_id == current_user.company_id).first()
        path = _generate_estimate_pdf(db, estimate, company, job)
        estimate.pdf_path = path
        estimate.status = "sent"
        estimate.sent_at = datetime.utcnow()
        if body.customer_email:
            estimate.customer_email = body.customer_email.strip()
        db.commit()

        return {
            "message": "Estimate marked as shared with customer",
            "status": "sent",
            "estimate_id": estimate_id,
            "pdf_url": f"/estimates/{estimate_id}/pdf",
            "email_sent": False,
            "email_status": "manual",
            "customer_email": estimate.customer_email,
        }

    @app.patch("/estimates/{estimate_id}/approve")
    def approve_estimate(
        estimate_id: int,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        estimate = db.query(models.Estimate).filter(
            models.Estimate.estimate_id == estimate_id,
            models.Estimate.company_id == current_user.company_id,
        ).first()
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        if estimate.status == "approved":
            raise HTTPException(status_code=400, detail="Already approved")
        if estimate.status not in ("draft", "sent"):
            raise HTTPException(status_code=400, detail="Estimate cannot be approved in its current state")
        if estimate.status == "pending_review" or estimate.status == "field_draft":
            raise HTTPException(status_code=400, detail="Field estimate must be reviewed and approved for customer first")

        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        estimate.status = "approved"
        estimate.approved_at = datetime.utcnow()
        estimate.approved_by = current_user.user_id
        _apply_estimate_baseline(db, estimate, job)
        db.commit()
        return {
            "message": "Dashboard baseline updated from approved estimate",
            "contract_value": float(job.contract_value),
            "budgeted_hours": float(job.budgeted_hours),
            "estimate_id": estimate.estimate_id,
        }

    # ── Field estimates (crew → owner review) ─────────────────────

    @app.post("/field-estimates")
    def create_field_estimate(
        body: FieldEstimateCreateIn,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        if body.job_id:
            job = db.query(models.Job).filter(
                models.Job.job_id == body.job_id,
                models.Job.company_id == current_user.company_id,
            ).first()
            if not job:
                raise HTTPException(status_code=404, detail="Project not found")
            if job.status != "active":
                raise HTTPException(status_code=400, detail="Project is not active")
        elif _is_owner_role(current_user) and body.client_name and body.client_name.strip():
            job_name = body.client_name.strip()
            if body.city and body.city.strip():
                job_name = f"{job_name}, {body.city.strip()}"
            job = models.Job(
                company_id=current_user.company_id,
                job_name=job_name,
                city=body.city.strip() if body.city else None,
                status="active",
            )
            db.add(job)
            db.flush()
        else:
            raise HTTPException(status_code=400, detail="Select a project")

        estimate = models.Estimate(
            company_id=current_user.company_id,
            job_id=job.job_id,
            title=f"Field Estimate — {job.job_name}",
            status="field_draft",
            source="field",
            created_by=current_user.user_id,
            field_notes=body.field_notes,
            scope_summary=body.scope_summary,
            customer_email=body.customer_email.strip() if body.customer_email else None,
            estimated_mileage_km=body.estimated_mileage_km if body.estimated_mileage_km and body.estimated_mileage_km > 0 else None,
        )
        db.add(estimate)
        db.flush()

        if body.line_items:
            _apply_line_items(db, estimate, body.line_items)
            _recalc_estimate_totals(db, estimate, current_user.company_id)
            _add_mileage_to_estimate_total(db, estimate, current_user.company_id)

        db.commit()
        db.refresh(estimate)
        return _serialize_estimate(db, estimate)

    @app.get("/field-estimates/mine")
    def list_my_field_estimates(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        q = db.query(models.Estimate).filter(
            models.Estimate.company_id == current_user.company_id,
            models.Estimate.source == "field",
        )
        if not _is_owner_role(current_user):
            q = q.filter(models.Estimate.created_by == current_user.user_id)
        estimates = q.order_by(models.Estimate.created_at.desc()).limit(50).all()
        return [_serialize_estimate(db, e) for e in estimates]

    @app.get("/estimates/pending-review")
    def list_pending_review_estimates(
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        estimates = db.query(models.Estimate).filter(
            models.Estimate.company_id == current_user.company_id,
            models.Estimate.status == "pending_review",
        ).order_by(models.Estimate.submitted_at.desc()).all()
        return [_serialize_estimate(db, e) for e in estimates]

    @app.patch("/estimates/{estimate_id}/submit-for-review")
    def submit_estimate_for_review(
        estimate_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        estimate = _get_estimate(db, estimate_id, current_user.company_id)
        if estimate.status != "field_draft":
            raise HTTPException(status_code=400, detail="Only field drafts can be submitted for review")
        if not _is_owner_role(current_user) and estimate.created_by != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not your estimate")

        lines = db.query(models.EstimateLineItem).filter(
            models.EstimateLineItem.estimate_id == estimate_id
        ).count()
        if lines == 0:
            raise HTTPException(status_code=400, detail="Add at least one line item before submitting")

        estimate.status = "pending_review"
        estimate.submitted_at = datetime.utcnow()
        estimate.rejection_reason = None
        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        _notify_company_owners(
            db, current_user.company_id, current_user.user_id,
            "field_estimate_submitted",
            "Field estimate ready for review",
            f"{job.job_name if job else 'Project'} — submitted by {_user_display_name(db, current_user.user_id) or 'crew'}",
            estimate.estimate_id, "estimate",
        )
        db.commit()
        db.refresh(estimate)
        return _serialize_estimate(db, estimate)

    @app.patch("/estimates/{estimate_id}/approve-review")
    def approve_estimate_for_customer(
        estimate_id: int,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        estimate = _get_estimate(db, estimate_id, current_user.company_id)
        if estimate.status != "pending_review":
            raise HTTPException(status_code=400, detail="Estimate is not pending review")

        estimate.status = "draft"
        estimate.reviewed_by = current_user.user_id
        estimate.reviewed_at = datetime.utcnow()
        estimate.rejection_reason = None
        estimate.pdf_path = None
        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        if estimate.created_by:
            _notify_users(
                db, current_user.company_id, [estimate.created_by],
                "field_estimate_approved",
                "Estimate approved for customer",
                f"{job.job_name if job else 'Project'} — office approved your quote for sending",
                estimate.estimate_id, "estimate",
            )
        db.commit()
        db.refresh(estimate)
        return _serialize_estimate(db, estimate)

    @app.patch("/estimates/{estimate_id}/return-to-field")
    def return_estimate_to_field(
        estimate_id: int,
        body: EstimateReturnIn = Body(default_factory=EstimateReturnIn),
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        estimate = _get_estimate(db, estimate_id, current_user.company_id)
        if estimate.status != "pending_review":
            raise HTTPException(status_code=400, detail="Only pending estimates can be returned")

        estimate.status = "field_draft"
        estimate.rejection_reason = (body.reason or "").strip() or "Please revise and resubmit."
        estimate.submitted_at = None
        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        if estimate.created_by:
            _notify_users(
                db, current_user.company_id, [estimate.created_by],
                "field_estimate_returned",
                "Estimate needs changes",
                f"{job.job_name if job else 'Project'}: {estimate.rejection_reason}",
                estimate.estimate_id, "estimate",
            )
        db.commit()
        db.refresh(estimate)
        return _serialize_estimate(db, estimate)

    @app.get("/estimates/{estimate_id}/comments")
    def get_estimate_comments(
        estimate_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        _get_estimate(db, estimate_id, current_user.company_id)
        comments = db.query(models.EstimateComment).filter(
            models.EstimateComment.estimate_id == estimate_id
        ).order_by(models.EstimateComment.created_at).all()
        result = []
        for c in comments:
            user = db.query(models.User).filter(models.User.user_id == c.user_id).first()
            result.append({
                "comment_id": c.comment_id,
                "message": c.message,
                "author": _user_display_name(db, c.user_id) or (user.email if user else "Unknown"),
                "role": user.role if user else "unknown",
                "created_at": str(c.created_at),
                "is_mine": c.user_id == current_user.user_id,
            })
        return result

    @app.post("/estimates/{estimate_id}/comments")
    def add_estimate_comment(
        estimate_id: int,
        message: str,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        estimate = _get_estimate(db, estimate_id, current_user.company_id)
        if estimate.status not in ("field_draft", "pending_review", "draft"):
            raise HTTPException(status_code=400, detail="Discussion closed for this estimate")
        msg = message.strip()
        if not msg:
            raise HTTPException(status_code=400, detail="Message required")

        comment = models.EstimateComment(
            estimate_id=estimate_id,
            user_id=current_user.user_id,
            company_id=current_user.company_id,
            message=msg,
        )
        db.add(comment)

        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        job_label = job.job_name if job else "Project"
        if _is_owner_role(current_user):
            targets = [estimate.created_by] if estimate.created_by else []
        else:
            owners = db.query(models.User).filter(
                models.User.company_id == current_user.company_id,
                models.User.role.in_(["owner", "admin"]),
            ).all()
            targets = [o.user_id for o in owners]
        _notify_users(
            db, current_user.company_id,
            [t for t in targets if t and t != current_user.user_id],
            "estimate_comment",
            f"New message on estimate — {job_label}",
            msg[:100],
            estimate_id, "estimate",
        )
        db.commit()
        db.refresh(comment)
        return {"comment_id": comment.comment_id, "message": comment.message}

    @app.post("/field-estimates/{estimate_id}/photos")
    async def upload_field_estimate_photo(
        estimate_id: int,
        file: UploadFile = File(...),
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        estimate = _get_estimate(db, estimate_id, current_user.company_id)
        if estimate.status not in ("field_draft", "pending_review"):
            raise HTTPException(status_code=400, detail="Photos can only be added while drafting or under review")
        if not _can_edit_estimate_lines(current_user, estimate) and not _is_owner_role(current_user):
            raise HTTPException(status_code=403, detail="Not allowed")

        ext = os.path.splitext(file.filename or "")[1] or ".jpg"
        fname = f"est_{estimate_id}_{secrets.token_hex(6)}{ext}"
        fpath = os.path.join(UPLOAD_DIR, fname)
        content = await file.read()
        with open(fpath, "wb") as f:
            f.write(content)

        att = models.EstimateAttachment(
            estimate_id=estimate_id,
            company_id=current_user.company_id,
            file_path=fpath,
            file_name=file.filename or fname,
        )
        db.add(att)
        db.commit()
        db.refresh(att)
        return {
            "attachment_id": att.attachment_id,
            "file_name": att.file_name,
        }

    @app.post("/field-estimates/{estimate_id}/generate")
    @limiter.limit("10/minute")
    def generate_field_estimate(
        request: Request,
        estimate_id: int,
        body: FieldEstimateGenerateIn = Body(default_factory=FieldEstimateGenerateIn),
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        import json
        from main import get_gemini_client

        estimate = _get_estimate(db, estimate_id, current_user.company_id)
        if estimate.status not in ("field_draft",):
            raise HTTPException(status_code=400, detail="AI generate only available on field drafts")
        if not _can_edit_estimate_lines(current_user, estimate):
            raise HTTPException(status_code=403, detail="Not allowed")

        if body.scope_summary is not None:
            estimate.scope_summary = body.scope_summary.strip() or None
        if body.field_notes is not None:
            estimate.field_notes = body.field_notes.strip() or None
        db.flush()

        attachments = db.query(models.EstimateAttachment).filter(
            models.EstimateAttachment.estimate_id == estimate_id
        ).all()

        text_parts = []
        if body.transcript and body.transcript.strip():
            text_parts.append(body.transcript.strip())
        if body.description and body.description.strip():
            text_parts.append(body.description.strip())
        if estimate.scope_summary:
            text_parts.append(estimate.scope_summary)
        if estimate.field_notes:
            text_parts.append(estimate.field_notes)
        combined = "\n".join(text_parts).strip()
        if len(combined) < 8:
            if attachments:
                combined = "Review the attached site photos and draft a conservative estimate for this project."
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Add a scope summary, site notes, or voice note first (a few words is enough)",
                )

        cost_codes = db.query(models.CostCode).filter(
            models.CostCode.company_id == current_user.company_id,
        ).all()
        if not cost_codes:
            raise HTTPException(status_code=400, detail="Add work types in Settings first")

        templates = db.query(models.WorkCategoryTemplate).filter(
            models.WorkCategoryTemplate.company_id == current_user.company_id,
            models.WorkCategoryTemplate.active == True,
        ).all()

        cc_list = [{"cost_code_id": c.cost_code_id, "label": c.description or c.code} for c in cost_codes]
        tpl_list = [{
            "template_id": t.template_id,
            "name": t.name,
            "cost_code_id": t.cost_code_id,
            "estimated_hours": float(t.estimated_hours or 0),
            "estimated_material_cost": float(t.estimated_material_cost or 0),
        } for t in templates]

        company = db.query(models.Company).filter(models.Company.company_id == current_user.company_id).first()
        labor_rate = _company_labor_rate(company)
        job_type_line = f"Job type hint: {body.job_type}\n" if body.job_type else ""

        prompt = f"""You are a construction estimator helping a field worker draft a customer estimate.

{job_type_line}Site notes:
{combined}

Company labour rate: ${labor_rate}/hr

Work types (use cost_code_id exactly):
{json.dumps(cc_list)}

Optional templates (use template_id when matching):
{json.dumps(tpl_list)}

Return ONLY valid JSON:
{{
  "scope_summary": "<2-3 sentence scope>",
  "assumptions": ["<assumption>"],
  "questions_for_office": ["<question if unsure>"],
  "line_items": [
    {{
      "cost_code_id": <int from list>,
      "description": "<work type label>",
      "estimated_hours": <number>,
      "material_cost": <number>,
      "quantity": 1
    }}
  ]
}}

Use conservative hours. Only use cost_code_id values from the list. Include 2-8 line items."""

        try:
            import re
            from google.genai import types
            contents = [prompt]
            for att in attachments[:6]:
                if att.file_path and os.path.exists(att.file_path):
                    ext = os.path.splitext(att.file_path)[1].lower()
                    mime = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png" if ext == ".png" else "application/pdf"
                    if mime.startswith("image"):
                        with open(att.file_path, "rb") as imgf:
                            contents.append(types.Part.from_bytes(data=imgf.read(), mime_type=mime))

            response = get_gemini_client().models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
            )
            raw = (response.text or "").strip()
            raw = re.sub(r"```json\s*", "", raw)
            raw = re.sub(r"```\s*", "", raw).strip()
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                raw = match.group(0)
            parsed = json.loads(raw)
        except HTTPException:
            raise
        except json.JSONDecodeError as e:
            print(f"Field estimate generate JSON error: {e}")
            raise HTTPException(status_code=503, detail="AI returned an invalid format — try again or add rows manually")
        except Exception as e:
            print(f"Field estimate generate error: {e}")
            raise HTTPException(status_code=503, detail="Could not generate estimate — try editing rows manually")

        valid_cc = {c.cost_code_id for c in cost_codes}
        line_items = []
        for item in parsed.get("line_items", []):
            cc_id = int(item.get("cost_code_id", 0))
            if cc_id not in valid_cc:
                continue
            hrs = float(item.get("estimated_hours") or 0)
            mat = float(item.get("material_cost") or 0)
            cc = next(c for c in cost_codes if c.cost_code_id == cc_id)
            line_items.append(EstimateLineIn(
                cost_code_id=cc_id,
                description=cc.description or cc.code,
                estimated_hours=hrs,
                material_cost=mat,
                labor_cost=round(hrs * labor_rate, 2),
                quantity=float(item.get("quantity") or 1),
            ))

        if not line_items:
            raise HTTPException(status_code=400, detail="AI could not map work types — add rows manually")

        if parsed.get("scope_summary"):
            estimate.scope_summary = parsed["scope_summary"]
        _apply_line_items(db, estimate, line_items)
        _recalc_estimate_totals(db, estimate, current_user.company_id)
        _add_mileage_to_estimate_total(db, estimate, current_user.company_id)
        estimate.pdf_path = None
        db.commit()
        db.refresh(estimate)

        return {
            "estimate": _serialize_estimate(db, estimate),
            "assumptions": parsed.get("assumptions") or [],
            "questions_for_office": parsed.get("questions_for_office") or [],
        }

    @app.get("/jobs/{job_id}/invoices/unbilled-preview")
    def preview_unbilled_invoice(
        job_id: int,
        markup_percent: float | None = None,
        period_start: str | None = None,
        period_end: str | None = None,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        job = db.query(models.Job).filter(
            models.Job.job_id == job_id,
            models.Job.company_id == current_user.company_id,
        ).first()
        if not job:
            raise HTTPException(status_code=404, detail="Project not found")

        company = db.query(models.Company).filter(
            models.Company.company_id == current_user.company_id
        ).first()
        markup = markup_percent
        if markup is None:
            markup = float(getattr(company, "default_markup_percent", 15) or 15)

        ps = _parse_date(period_start)
        pe = _parse_date(period_end)
        sweep = _sweep_unbilled_costs(db, job_id, current_user.company_id, ps, pe)
        preview = _preview_from_sweep(sweep, markup)
        preview["period_start"] = period_start
        preview["period_end"] = period_end
        return preview

    @app.post("/jobs/{job_id}/invoices/generate")
    def generate_cost_plus_invoice(
        job_id: int,
        body: InvoiceGenerateIn = Body(default_factory=InvoiceGenerateIn),
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        job = db.query(models.Job).filter(
            models.Job.job_id == job_id,
            models.Job.company_id == current_user.company_id,
        ).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        company = db.query(models.Company).filter(
            models.Company.company_id == current_user.company_id
        ).first()
        markup = body.markup_percent
        if markup is None:
            markup = float(getattr(company, "default_markup_percent", 15) or 15)

        period_start = _parse_date(body.period_start)
        period_end = _parse_date(body.period_end)
        sweep = _sweep_unbilled_costs(db, job_id, current_user.company_id, period_start, period_end)

        if not sweep["timesheets"] and not sweep["materials"] and not sweep["mileage"]:
            raise HTTPException(status_code=400, detail="No unbilled hours, materials, or mileage for this project")

        raw_subtotal = 0.0
        invoice = models.Invoice(
            company_id=current_user.company_id,
            job_id=job_id,
            invoice_number=_next_invoice_number(db, current_user.company_id),
            markup_percent=markup,
            include_receipts=body.include_receipts,
            period_start=period_start,
            period_end=period_end,
            created_by=current_user.user_id,
            status="draft",
        )
        db.add(invoice)
        db.flush()

        line_items_out = []

        for g in sweep["labor_groups"].values():
            raw = round(g["amount"], 2)
            billed = round(raw * (1 + markup / 100), 2)
            raw_subtotal += raw
            db.add(models.InvoiceLineItem(
                invoice_id=invoice.invoice_id,
                category="labor",
                description=f"Labor — {g['label']}",
                cost_code_id=g["cost_code_id"],
                raw_amount=raw,
                billed_amount=billed,
                source_ids={"timesheet_ids": g["ids"]},
            ))
            line_items_out.append({"category": "labor", "description": f"Labor — {g['label']}", "raw": raw, "billed": billed})

        for g in sweep["mat_groups"].values():
            raw = round(g["amount"], 2)
            billed = round(raw * (1 + markup / 100), 2)
            raw_subtotal += raw
            db.add(models.InvoiceLineItem(
                invoice_id=invoice.invoice_id,
                category="materials",
                description=f"Materials — {g['label']}",
                cost_code_id=g["cost_code_id"],
                raw_amount=raw,
                billed_amount=billed,
                source_ids={"material_ids": g["ids"]},
            ))
            line_items_out.append({"category": "materials", "description": f"Materials — {g['label']}", "raw": raw, "billed": billed})

        if sweep["mi_total"] > 0:
            raw = round(sweep["mi_total"], 2)
            billed = round(raw * (1 + markup / 100), 2)
            raw_subtotal += raw
            db.add(models.InvoiceLineItem(
                invoice_id=invoice.invoice_id,
                category="mileage",
                description="Mileage Reimbursement",
                raw_amount=raw,
                billed_amount=billed,
                source_ids={"mileage_ids": sweep["mi_ids"]},
            ))
            line_items_out.append({"category": "mileage", "description": "Mileage Reimbursement", "raw": raw, "billed": billed})

        markup_amount = round(raw_subtotal * (markup / 100), 2)
        invoice.raw_subtotal = raw_subtotal
        invoice.markup_amount = markup_amount
        invoice.total = round(raw_subtotal + markup_amount, 2)

        for ts in sweep["timesheets"]:
            ts.billed = True
            ts.invoice_id = invoice.invoice_id
        for m in sweep["materials"]:
            m.billed = True
            m.invoice_id = invoice.invoice_id
        for mi in sweep["mileage"]:
            mi.billed = True
            mi.invoice_id = invoice.invoice_id

        db.commit()

        try:
            pdf_path = _generate_invoice_pdf(
                invoice, job, company, line_items_out,
                receipt_urls=sweep["receipt_urls"] if body.include_receipts else [],
            )
            invoice.pdf_path = pdf_path
            db.commit()
        except ImportError:
            pass

        return {
            "invoice_id": invoice.invoice_id,
            "invoice_number": invoice.invoice_number,
            "markup_percent": float(markup),
            "raw_subtotal": float(invoice.raw_subtotal),
            "markup_amount": float(invoice.markup_amount),
            "total": float(invoice.total),
            "line_items": line_items_out,
            "pdf_url": f"/invoices/{invoice.invoice_id}/pdf" if invoice.pdf_path else None,
        }

    @app.get("/invoices/{invoice_id}/pdf")
    def download_invoice_pdf(
        invoice_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        inv = db.query(models.Invoice).filter(
            models.Invoice.invoice_id == invoice_id,
            models.Invoice.company_id == current_user.company_id,
        ).first()
        if not inv or not inv.pdf_path or not os.path.exists(inv.pdf_path):
            raise HTTPException(status_code=404, detail="PDF not found")
        return FileResponse(inv.pdf_path, media_type="application/pdf", filename=f"{inv.invoice_number}.pdf")

    @app.get("/jobs/{job_id}/invoices")
    def list_invoices(
        job_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        invoices = db.query(models.Invoice).filter(
            models.Invoice.job_id == job_id,
            models.Invoice.company_id == current_user.company_id,
        ).order_by(models.Invoice.created_at.desc()).all()
        return [{
            "invoice_id": i.invoice_id,
            "invoice_number": i.invoice_number,
            "status": i.status or "draft",
            "total": float(i.total or 0),
            "raw_subtotal": float(i.raw_subtotal or 0),
            "markup_percent": float(i.markup_percent or 0),
            "markup_amount": float(i.markup_amount or 0),
            "period_start": str(i.period_start) if i.period_start else None,
            "period_end": str(i.period_end) if i.period_end else None,
            "created_at": str(i.created_at) if i.created_at else None,
            "pdf_url": f"/invoices/{i.invoice_id}/pdf" if i.pdf_path else None,
        } for i in invoices]

    @app.post("/jobs/{job_id}/magic-links")
    def create_magic_link(
        job_id: int,
        body: MagicLinkCreateIn,
        current_user: models.User = Depends(require_owner),
        db: Session = Depends(get_db),
    ):
        job = db.query(models.Job).filter(
            models.Job.job_id == job_id,
            models.Job.company_id == current_user.company_id,
        ).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if body.purpose not in ("invoice_upload", "lien_waiver"):
            raise HTTPException(status_code=400, detail="Invalid purpose")

        token = secrets.token_urlsafe(32)
        link = models.MagicLink(
            company_id=current_user.company_id,
            job_id=job_id,
            token=token,
            purpose=body.purpose,
            subcontractor_name=body.subcontractor_name,
            expires_at=datetime.utcnow() + timedelta(days=body.expires_days),
            created_by=current_user.user_id,
        )
        db.add(link)
        db.commit()
        return {
            "url": f"{FRONTEND_URL}/magic-link/{token}",
            "token": token,
            "expires_at": str(link.expires_at),
        }

    @app.get("/magic-link/{token}")
    def get_magic_link(token: str, db: Session = Depends(get_db)):
        link = db.query(models.MagicLink).filter(models.MagicLink.token == token).first()
        if not link or link.expires_at < datetime.utcnow():
            raise HTTPException(status_code=404, detail="Link expired or invalid")
        job = db.query(models.Job).filter(models.Job.job_id == link.job_id).first()
        company = db.query(models.Company).filter(models.Company.company_id == link.company_id).first()
        return {
            "purpose": link.purpose,
            "job_name": job.job_name if job else "Project",
            "company_name": company.company_name if company else "",
            "subcontractor_name": link.subcontractor_name,
            "already_used": link.used_at is not None,
        }

    @app.post("/magic-link/{token}/submit")
    async def submit_magic_link(
        token: str,
        subcontractor_name: str = Form(None),
        amount: float = Form(None),
        description: str = Form(None),
        signature_name: str = Form(None),
        file: UploadFile = File(None),
        db: Session = Depends(get_db),
    ):
        link = db.query(models.MagicLink).filter(models.MagicLink.token == token).first()
        if not link or link.expires_at < datetime.utcnow():
            raise HTTPException(status_code=404, detail="Link expired or invalid")

        file_url = None
        if file and file.filename:
            ext = os.path.splitext(file.filename)[1] or ".jpg"
            fname = f"magic_{token[:8]}_{secrets.token_hex(4)}{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            content = await file.read()
            with open(fpath, "wb") as f:
                f.write(content)
            file_url = fpath

        material_id = None
        sub_name = subcontractor_name or link.subcontractor_name
        if link.purpose == "invoice_upload" and amount:
            mat = models.Material(
                company_id=link.company_id,
                job_id=link.job_id,
                description=description or f"Sub invoice — {sub_name or 'Subcontractor'}",
                supplier=sub_name,
                total_cost=amount,
                purchase_date=date.today(),
                receipt_image_url=file_url,
                notes="Submitted via magic link",
            )
            db.add(mat)
            db.flush()
            material_id = mat.material_id

        submission = models.SubcontractorSubmission(
            magic_link_id=link.magic_link_id,
            company_id=link.company_id,
            job_id=link.job_id,
            submission_type=link.purpose,
            subcontractor_name=sub_name,
            amount=amount,
            description=description,
            file_url=file_url,
            signature_name=signature_name,
            material_id=material_id,
        )
        link.used_at = datetime.utcnow()
        db.add(submission)
        db.commit()
        return {"message": "Submitted successfully", "material_id": material_id}
