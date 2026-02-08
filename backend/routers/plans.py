from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from services.plan_store import plan_store

router = APIRouter()


class PlanCreate(BaseModel):
    title: str
    region: str
    capability_gap: str
    priority: str
    assets: List[str] = Field(default_factory=list)
    actions: List[str] = Field(default_factory=list)
    notes: Optional[str] = ""
    created_at: str


class PlanUpdate(BaseModel):
    title: Optional[str] = None
    region: Optional[str] = None
    capability_gap: Optional[str] = None
    priority: Optional[str] = None
    assets: Optional[List[str]] = None
    actions: Optional[List[str]] = None
    notes: Optional[str] = None
    updated_at: Optional[str] = None


@router.get("/plans")
def list_plans():
    return {"plans": plan_store.list()}


@router.post("/plans")
def create_plan(plan: PlanCreate):
    record = plan_store.create(plan.model_dump())
    return record


@router.put("/plans/{plan_id}")
def update_plan(plan_id: str, plan: PlanUpdate):
    try:
        record = plan_store.update(plan_id, {k: v for k, v in plan.model_dump().items() if v is not None})
        return record
    except KeyError:
        raise HTTPException(status_code=404, detail="Plan not found")
