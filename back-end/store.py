"""MariaDB(MySQL 호환) 저장소."""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timezone

import db as db_mod
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError

from models import Memo, User

_UNSET = object()


def _session():
    """init_db 이후의 SessionLocal 을 쓴다. `from db import SessionLocal` 캐시(None) 버그 방지."""
    db_mod.init_db()
    return db_mod.SessionLocal()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class UserRecord:
    id: str
    username: str
    password_hash: str


@dataclass
class MemoRecord:
    id: str
    user_id: str
    title: str
    body: str
    tags: list[str]
    due_date: str | None
    created_at: str
    updated_at: str


def _user_to_record(u: User) -> UserRecord:
    return UserRecord(
        id=str(u.id),
        username=u.username,
        password_hash=u.password_hash,
    )


def _memo_to_record(m: Memo) -> MemoRecord:
    tags = m.tags_json
    if not isinstance(tags, list):
        tags = []
    tags = [str(t) for t in tags]
    return MemoRecord(
        id=m.id,
        user_id=str(m.user_id),
        title=m.title or "",
        body=m.body or "",
        tags=tags,
        due_date=m.due_date.isoformat() if m.due_date else None,
        created_at=m.created_at.isoformat(),
        updated_at=m.updated_at.isoformat(),
    )


def _parse_due(due: str | None) -> date | None:
    if not due:
        return None
    try:
        return date.fromisoformat(due[:10])
    except ValueError:
        return None


def get_user_by_username(username: str) -> UserRecord | None:
    s = _session()
    u = s.scalar(select(User).where(User.username == username))
    return _user_to_record(u) if u else None


def get_user_by_id(user_id: str) -> UserRecord | None:
    try:
        uid = int(user_id)
    except ValueError:
        return None
    s = _session()
    u = s.get(User, uid)
    return _user_to_record(u) if u else None


def create_user(username: str, password_hash: str) -> UserRecord:
    s = _session()
    u = User(username=username, password_hash=password_hash)
    s.add(u)
    try:
        s.commit()
    except IntegrityError:
        s.rollback()
        raise
    s.refresh(u)
    return _user_to_record(u)


def list_memos_for_user(user_id: str) -> list[MemoRecord]:
    try:
        uid = int(user_id)
    except ValueError:
        return []
    s = _session()
    stmt = select(Memo).where(Memo.user_id == uid).order_by(Memo.updated_at.desc())
    rows = s.scalars(stmt).all()
    return [_memo_to_record(m) for m in rows]


def query_memos_for_user(
    user_id: str, q: str | None, tag: str | None
) -> list[MemoRecord]:
    """
    q(제목/내용 검색)와 tag(태그 포함)를 MariaDB에서 바로 필터한 뒤 가져옵니다.
    - tags_json 은 JSON 배열이므로 JSON_CONTAINS(tags_json, '"회의"') 형태로 검색합니다.
    """
    try:
        uid = int(user_id)
    except ValueError:
        return []

    ql = (q or "").strip().lower()
    tl = (tag or "").strip()

    s = _session()
    stmt = select(Memo).where(Memo.user_id == uid)

    if ql:
        like_expr = f"%{ql}%"
        stmt = stmt.where(
            or_(
                func.lower(Memo.title).like(like_expr),
                func.lower(Memo.body).like(like_expr),
            )
        )

    if tl:
        # JSON_CONTAINS는 "JSON 문자열"을 원하므로 json.dumps 로 따옴표 포함 JSON literal 생성
        # MariaDB에 저장된 tags_json 값이 unicode 이스케이프 형태로 들어가 있는 케이스가 있어
        # ensure_ascii=True 로 동일 포맷을 맞춰 매칭합니다.
        tag_json = json.dumps(tl, ensure_ascii=True)
        stmt = stmt.where(func.JSON_CONTAINS(Memo.tags_json, tag_json) == 1)

    stmt = stmt.order_by(Memo.updated_at.desc())
    rows = s.scalars(stmt).all()
    return [_memo_to_record(m) for m in rows]


def get_memo(user_id: str, memo_id: str) -> MemoRecord | None:
    try:
        uid = int(user_id)
    except ValueError:
        return None
    s = _session()
    m = s.get(Memo, memo_id)
    if not m or m.user_id != uid:
        return None
    return _memo_to_record(m)


def create_memo(
    user_id: str,
    title: str,
    body: str,
    tags: list[str],
    due_date: str | None,
) -> MemoRecord:
    uid = int(user_id)
    now = _utc_now()
    mid = str(uuid.uuid4())
    m = Memo(
        id=mid,
        user_id=uid,
        title=title or "",
        body=body or "",
        tags_json=list(tags or []),
        due_date=_parse_due(due_date),
        created_at=now,
        updated_at=now,
    )
    s = _session()
    s.add(m)
    s.commit()
    s.refresh(m)
    return _memo_to_record(m)


def update_memo(
    user_id: str,
    memo_id: str,
    *,
    title: str | None | object = _UNSET,
    body: str | None | object = _UNSET,
    tags: list[str] | None | object = _UNSET,
    due_date: str | None | object = _UNSET,
) -> MemoRecord | None:
    try:
        uid = int(user_id)
    except ValueError:
        return None
    s = _session()
    m = s.get(Memo, memo_id)
    if not m or m.user_id != uid:
        return None
    if title is not _UNSET:
        m.title = title or ""
    if body is not _UNSET:
        m.body = body or ""
    if tags is not _UNSET:
        m.tags_json = list(tags or [])
    if due_date is not _UNSET:
        m.due_date = _parse_due(due_date) if due_date else None
    m.updated_at = _utc_now()
    s.commit()
    s.refresh(m)
    return _memo_to_record(m)


def delete_memo(user_id: str, memo_id: str) -> bool:
    try:
        uid = int(user_id)
    except ValueError:
        return False
    s = _session()
    m = s.get(Memo, memo_id)
    if not m or m.user_id != uid:
        return False
    s.delete(m)
    s.commit()
    return True


def filter_memos(
    memos: list[MemoRecord],
    q: str | None,
    tag: str | None,
) -> list[MemoRecord]:
    out = memos
    if q:
        ql = q.lower().strip()
        out = [
            m
            for m in out
            if ql in (m.title or "").lower() or ql in (m.body or "").lower()
        ]
    if tag:
        tl = tag.strip()
        out = [m for m in out if tl in (m.tags or [])]
    return out


__all__ = [
    "UserRecord",
    "MemoRecord",
    "get_user_by_username",
    "get_user_by_id",
    "create_user",
    "list_memos_for_user",
    "get_memo",
    "create_memo",
    "update_memo",
    "delete_memo",
    "filter_memos",
]
