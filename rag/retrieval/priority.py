"""
Priority management: read/write tenant priority scores and expose
helper to update plan tiers (free → growth → enterprise).
"""

import psycopg2
import psycopg2.extras

from rag.config import get_settings
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()

# Priority scores per plan tier
PLAN_PRIORITY: dict[str, float] = {
    "free":       1.0,
    "growth":     2.0,
    "enterprise": 3.0,
}


def _get_conn():
    return psycopg2.connect(settings.supabase_db_url)


def get_tenant_priority(tenant_id: str) -> float:
    """Return current priority_score for a tenant."""
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT priority_score FROM tenants WHERE id = %s",
                (tenant_id,),
            )
            row = cur.fetchone()
    finally:
        conn.close()
    if not row:
        raise ValueError(f"Tenant not found: {tenant_id}")
    return float(row[0])


def set_tenant_plan(tenant_id: str, plan: str) -> float:
    """
    Update a tenant's plan and recalculate priority_score.

    Returns the new priority_score.
    """
    if plan not in PLAN_PRIORITY:
        raise ValueError(f"Unknown plan: {plan}. Choose from {list(PLAN_PRIORITY)}")
    new_priority = PLAN_PRIORITY[plan]

    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE tenants
                SET plan = %s, priority_score = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (plan, new_priority, tenant_id),
            )
        conn.commit()
    finally:
        conn.close()

    log.info("Tenant plan updated", tenant_id=tenant_id, plan=plan, priority=new_priority)
    return new_priority


def set_custom_priority(tenant_id: str, priority: float) -> None:
    """Set an arbitrary priority score (e.g. for enterprise overrides)."""
    if priority < 0:
        raise ValueError("priority_score must be >= 0")
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE tenants SET priority_score = %s, updated_at = NOW() WHERE id = %s",
                (priority, tenant_id),
            )
        conn.commit()
    finally:
        conn.close()
    log.info("Custom priority set", tenant_id=tenant_id, priority=priority)
