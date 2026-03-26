"""JSON 파일 기반 저장소 (추후 DB로 교체 가능)."""
from __future__ import annotations

import json
import threading
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_lock = threading.Lock()

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_FILE = DATA_DIR / "store.json"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


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


def _default_state() -> dict[str, Any]:
    return {"users": [], "memos": [], "next_user_num": 1}


def _load_raw() -> dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        state = _default_state()
        _save_raw(state)
        return state
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save_raw(state: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = DATA_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    tmp.replace(DATA_FILE)


def list_users() -> list[UserRecord]:
    with _lock:
        raw = _load_raw()
    return [UserRecord(**u) for u in raw["users"]]


def get_user_by_username(username: str) -> UserRecord | None:
    for u in list_users():
        if u.username == username:
            return u
    return None


def get_user_by_id(user_id: str) -> UserRecord | None:
    for u in list_users():
        if u.id == user_id:
            return u
    return None


def create_user(username: str, password_hash: str) -> UserRecord:
    with _lock:
        raw = _load_raw()
        num = raw["next_user_num"]
        uid = str(num)
        raw["next_user_num"] = num + 1
        rec = UserRecord(id=uid, username=username, password_hash=password_hash)
        raw["users"].append(asdict(rec))
        _save_raw(raw)
    return rec


def list_memos_for_user(user_id: str) -> list[MemoRecord]:
    with _lock:
        raw = _load_raw()
    out = []
    for m in raw["memos"]:
        if m["user_id"] == user_id:
            out.append(MemoRecord(**m))
    out.sort(key=lambda x: x.updated_at, reverse=True)
    return out


def get_memo(user_id: str, memo_id: str) -> MemoRecord | None:
    with _lock:
        raw = _load_raw()
    for m in raw["memos"]:
        if m["user_id"] == user_id and m["id"] == memo_id:
            return MemoRecord(**m)
    return None


def create_memo(
    user_id: str,
    title: str,
    body: str,
    tags: list[str],
    due_date: str | None,
) -> MemoRecord:
    now = _utc_now()
    mid = str(uuid.uuid4())
    rec = MemoRecord(
        id=mid,
        user_id=user_id,
        title=title or "",
        body=body or "",
        tags=tags or [],
        due_date=due_date,
        created_at=now,
        updated_at=now,
    )
    with _lock:
        raw = _load_raw()
        raw["memos"].append(asdict(rec))
        _save_raw(raw)
    return rec


_UNSET = object()


def update_memo(
    user_id: str,
    memo_id: str,
    *,
    title: str | None | object = _UNSET,
    body: str | None | object = _UNSET,
    tags: list[str] | None | object = _UNSET,
    due_date: str | None | object = _UNSET,
) -> MemoRecord | None:
    with _lock:
        raw = _load_raw()
        found = None
        for i, m in enumerate(raw["memos"]):
            if m["user_id"] == user_id and m["id"] == memo_id:
                found = i
                break
        if found is None:
            return None
        m = raw["memos"][found]
        if title is not _UNSET:
            m["title"] = title or ""
        if body is not _UNSET:
            m["body"] = body or ""
        if tags is not _UNSET:
            m["tags"] = tags or []
        if due_date is not _UNSET:
            m["due_date"] = due_date
        m["updated_at"] = _utc_now()
        _save_raw(raw)
        return MemoRecord(**m)


def delete_memo(user_id: str, memo_id: str) -> bool:
    with _lock:
        raw = _load_raw()
        before = len(raw["memos"])
        raw["memos"] = [
            m
            for m in raw["memos"]
            if not (m["user_id"] == user_id and m["id"] == memo_id)
        ]
        if len(raw["memos"]) == before:
            return False
        _save_raw(raw)
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
