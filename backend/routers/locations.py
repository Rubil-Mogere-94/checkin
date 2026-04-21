from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/locations", tags=["locations"])

@router.get("", response_model=List[schemas.LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    locations = db.query(models.Location).all()
    return locations

@router.post("", response_model=schemas.LocationResponse, status_code=201)
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_location = db.query(models.Location).filter(models.Location.branch_id == location.branch_id).first()
    if db_location:
        raise HTTPException(status_code=400, detail="Location with this branch ID already exists")
    
    new_location = models.Location(**location.model_dump())
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location

@router.delete("/{location_id}", response_model=schemas.LocationResponse)
def delete_location(location_id: int, db: Session = Depends(get_db)):
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db.delete(location)
    db.commit()
    return location
