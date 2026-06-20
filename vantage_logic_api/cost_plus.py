"""Cost-Plus estimating, invoicing, and magic-link routes."""

from datetime import datetime, timedelta, date
import os
import secrets

from fastapi import Depends, HTTPException, Body, File, UploadFile, Form
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
    line_items: list[EstimateLineIn]


class InvoiceGenerateIn(BaseModel):
    markup_percent: float | None = None
    include_receipts: bool = False
    period_start: str | None = None
    period_end: str | None = None


class MagicLinkCreateIn(BaseModel):
    purpose: str
    subcontractor_name: str | None = None
    expires_days: int = 7


def register_cost_plus_routes(app, get_db, get_current_user, require_owner, timesheet_labour_cost):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    def _next_invoice_number(db: Session, company_id: int) -> str:
        count = db.query(models.Invoice).filter(models.Invoice.company_id == company_id).count()
        return f"INV-{company_id:03d}-{count + 1:04d}"

    def _recalc_estimate_totals(db: Session, estimate: models.Estimate):
        lines = db.query(models.EstimateLineItem).filter(
            models.EstimateLineItem.estimate_id == estimate.estimate_id
        ).all()
        total_hours = total_mat = total_lab = 0.0
        for ln in lines:
            qty = float(ln.quantity or 1)
            total_hours += float(ln.estimated_hours or 0) * qty
            total_mat += float(ln.material_cost or 0) * qty
            total_lab += float(ln.labor_cost or 0) * qty
        estimate.total_hours = round(total_hours, 2)
        estimate.total_material_cost = round(total_mat, 2)
        estimate.total_labor_cost = round(total_lab, 2)
        estimate.total_cost = round(total_mat + total_lab, 2)

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
        lines = db.query(models.EstimateLineItem).filter(
            models.EstimateLineItem.estimate_id == estimate.estimate_id
        ).order_by(models.EstimateLineItem.sort_order).all()
        return {
            "estimate_id": estimate.estimate_id,
            "job_id": estimate.job_id,
            "title": estimate.title,
            "status": estimate.status,
            "total_hours": float(estimate.total_hours or 0),
            "total_material_cost": float(estimate.total_material_cost or 0),
            "total_labor_cost": float(estimate.total_labor_cost or 0),
            "total_cost": float(estimate.total_cost or 0),
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

        story.append(Paragraph(f"<b>{company.company_name}</b>", styles["Title"]))
        story.append(Paragraph(f"Cost-Plus Invoice {invoice.invoice_number}", styles["Heading2"]))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Project: <b>{job.job_name}</b>", styles["Normal"]))
        if job.city:
            story.append(Paragraph(f"Location: {job.city}", styles["Normal"]))
        created = invoice.created_at.strftime("%Y-%m-%d") if invoice.created_at else ""
        story.append(Paragraph(f"Date: {created}", styles["Normal"]))
        story.append(Spacer(1, 20))

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

        return [{
            "template_id": t.template_id,
            "cost_code_id": t.cost_code_id,
            "name": t.name,
            "description": t.description,
            "estimated_hours": float(t.estimated_hours or 0),
            "estimated_material_cost": float(t.estimated_material_cost or 0),
            "estimated_labor_cost": float(t.estimated_labor_cost or 0),
        } for t in templates]

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
            status="draft",
        )
        db.add(estimate)
        db.flush()

        for i, ln in enumerate(body.line_items):
            db.add(models.EstimateLineItem(
                estimate_id=estimate.estimate_id,
                template_id=ln.template_id,
                cost_code_id=ln.cost_code_id,
                description=ln.description,
                quantity=ln.quantity,
                estimated_hours=ln.estimated_hours,
                material_cost=ln.material_cost,
                labor_cost=ln.labor_cost,
                sort_order=i,
            ))
        _recalc_estimate_totals(db, estimate)
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

        job = db.query(models.Job).filter(models.Job.job_id == estimate.job_id).first()
        estimate.status = "approved"
        estimate.approved_at = datetime.utcnow()
        estimate.approved_by = current_user.user_id
        _apply_estimate_baseline(db, estimate, job)
        db.commit()
        return {
            "message": "Estimate approved — project baseline updated",
            "contract_value": float(job.contract_value),
            "budgeted_hours": float(job.budgeted_hours),
            "estimate_id": estimate.estimate_id,
        }

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
            "total": float(i.total or 0),
            "markup_percent": float(i.markup_percent or 0),
            "created_at": str(i.created_at),
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
