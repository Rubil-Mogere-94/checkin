from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/checkin", tags=["checkin"])


@router.post("/log", response_model=schemas.CheckInResponse)
def log_checkin(data: schemas.CheckInCreate, db: Session = Depends(get_db)):
    """Record a check-in event for an employee. Called by the admin when a QR pass is scanned."""
    employee = db.query(models.User).filter(models.User.email == data.employee_email).first()
    if not employee:
        raise HTTPException(
            status_code=404,
            detail=f"Employee '{data.employee_email}' not found. Ensure the account is registered before scanning.",
        )
    log = models.CheckInLog(
        employee_email=data.employee_email,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Return KPI summary: total logs, today's logs, flagged (no GPS), employee count, location count."""
    today = date.today()

    total = db.query(func.count(models.CheckInLog.id)).scalar() or 0

    today_count = (
        db.query(func.count(models.CheckInLog.id))
        .filter(func.date(models.CheckInLog.arrival_time) == today)
        .scalar()
        or 0
    )

    flagged = (
        db.query(func.count(models.CheckInLog.id))
        .filter(models.CheckInLog.latitude.is_(None))
        .scalar()
        or 0
    )

    employees = (
        db.query(func.count(models.User.id))
        .filter(models.User.role == "employee")
        .scalar()
        or 0
    )

    locations = db.query(func.count(models.Location.id)).scalar() or 0

    return schemas.StatsResponse(
        total=total,
        today=today_count,
        flagged=flagged,
        employees=employees,
        locations=locations,
    )


@router.get("/logs", response_model=List[schemas.CheckInResponse])
def get_logs(email: Optional[str] = None, db: Session = Depends(get_db)):
    """Return all check-in logs, optionally filtered by employee email."""
    query = db.query(models.CheckInLog)
    if email:
        query = query.filter(models.CheckInLog.employee_email == email)
    return query.order_by(models.CheckInLog.arrival_time.desc()).all()


@router.get("/logs/{email}", response_model=List[schemas.CheckInResponse])
def get_employee_logs(email: str, db: Session = Depends(get_db)):
    """Return all check-in logs for a specific employee."""
    return (
        db.query(models.CheckInLog)
        .filter(models.CheckInLog.employee_email == email)
        .order_by(models.CheckInLog.arrival_time.desc())
        .all()
    )
