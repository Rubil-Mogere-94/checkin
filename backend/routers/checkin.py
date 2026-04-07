from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/checkin", tags=["checkin"])


@router.post("/log", response_model=schemas.CheckInResponse)
def log_checkin(data: schemas.CheckInCreate, db: Session = Depends(get_db)):
    # Verify the employee exists
    employee = db.query(models.User).filter(models.User.email == data.employee_email).first()
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee '{data.employee_email}' not found")

    log = models.CheckInLog(
        employee_email=data.employee_email,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/logs", response_model=List[schemas.CheckInResponse])
def get_logs(email: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.CheckInLog)
    if email:
        query = query.filter(models.CheckInLog.employee_email == email)
    return query.order_by(models.CheckInLog.arrival_time.desc()).all()


@router.get("/logs/{email}", response_model=List[schemas.CheckInResponse])
def get_employee_logs(email: str, db: Session = Depends(get_db)):
    return (
        db.query(models.CheckInLog)
        .filter(models.CheckInLog.employee_email == email)
        .order_by(models.CheckInLog.arrival_time.desc())
        .all()
    )
