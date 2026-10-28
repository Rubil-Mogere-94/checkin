from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/locations", tags=["locations"])


@router.get("", response_model=List[schemas.LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    """Return all registered branch locations."""
    return db.query(models.Location).all()


@router.get("/{location_id}", response_model=schemas.LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
    """Return a single location by ID."""
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc


@router.post("", response_model=schemas.LocationResponse, status_code=201)
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    """Create a new branch location. branch_id must be unique."""
    existing = db.query(models.Location).filter(
        models.Location.branch_id == location.branch_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Location with this branch ID already exists")
    new_location = models.Location(**location.dict())
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location


@router.put("/{location_id}", response_model=schemas.LocationResponse)
def update_location(
    location_id: int,
    updates: schemas.LocationUpdate,
    db: Session = Depends(get_db),
):
    """Update a location's name and/or branch_id."""
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    if updates.name is not None:
        loc.name = updates.name
    if updates.branch_id is not None:
        # Check uniqueness for the new branch_id
        conflict = db.query(models.Location).filter(
            models.Location.branch_id == updates.branch_id,
            models.Location.id != location_id,
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Branch ID already in use by another location")
        loc.branch_id = updates.branch_id
    db.commit()
    db.refresh(loc)
    return loc


@router.delete("/{location_id}", response_model=schemas.LocationResponse)
def delete_location(location_id: int, db: Session = Depends(get_db)):
    """Remove a branch location."""
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
    return loc
