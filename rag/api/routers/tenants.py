"""
Tenant management endpoints.
"""

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from rag.config import get_settings
from rag.retrieval.priority import set_tenant_plan, set_custom_priority, get_tenant_priority
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()
router = APIRouter()


def _conn():
    return psycopg2.connect(settings.supabase_db_url)


class TenantCreate(BaseModel):
    name: str
    slug: str
    plan: str = "free"


class PlanUpdate(BaseModel):
    plan: str = Field(..., pattern="^(free|growth|enterprise)$")


class PriorityUpdate(BaseModel):
    priority: float = Field(..., ge=0)


@router.post("", status_code=201)
def create_tenant(body: TenantCreate):
    from rag.retrieval.priority import PLAN_PRIORITY
    priority = PLAN_PRIORITY.get(body.plan, 1.0)
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO tenants (name, slug, plan, priority_score)
                VALUES (%s, %s, %s, %s)
                RETURNING id, name, slug, plan, priority_score, created_at
                """,
                (body.name, body.slug, body.plan, priority),
            )
            row = dict(cur.fetchone())
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail=f"Slug '{body.slug}' already exists")
    finally:
        conn.close()
    return row


@router.get("/{tenant_id}")
def get_tenant(tenant_id: str):
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM tenants WHERE id = %s", (tenant_id,))
            row = cur.fetchone()
    finally:
        conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return dict(row)


@router.patch("/{tenant_id}/plan")
def update_plan(tenant_id: str, body: PlanUpdate):
    new_priority = set_tenant_plan(tenant_id, body.plan)
    return {"tenant_id": tenant_id, "plan": body.plan, "priority_score": new_priority}


@router.patch("/{tenant_id}/priority")
def update_priority(tenant_id: str, body: PriorityUpdate):
    set_custom_priority(tenant_id, body.priority)
    return {"tenant_id": tenant_id, "priority_score": body.priority}
