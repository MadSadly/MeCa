import os
import re

from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from flask_cors import CORS

from sqlalchemy import text

import db as db_mod
from db import init_db, register_teardown
import db
from hf_client import summarize_with_hf
import store

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")

HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
PORT = int(os.environ.get("FLASK_PORT", "5000"))

_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    re.compile(r"http://192\.168\.\d+\.\d+:3000"),
]


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    CORS(
        app,
        resources={r"/api/*": {"origins": _CORS_ORIGINS}},
        supports_credentials=True,
    )
    init_db()
    register_teardown(app)
    return app


app = create_app()

db.ensure_users_table()


def require_user() -> tuple[str | None, tuple | None]:
    uid = session.get("user_id")
    if not uid:
        return None, (jsonify({"error": "로그인이 필요합니다."}), 401)
    u = db.get_user_by_id(uid)
    if not u:
        session.pop("user_id", None)
        return None, (jsonify({"error": "세션이 유효하지 않습니다."}), 401)
    return str(u["id"]), None


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.get("/api/health/db")
def health_db():
    """MariaDB 연결·쿼리 가능 여부 확인 (브라우저·curl 로 호출)."""
    try:
        init_db()
        s = db_mod.SessionLocal()
        try:
            ping = s.execute(text("SELECT 1")).scalar()
            n_tables = s.execute(
                text(
                    "SELECT COUNT(*) FROM information_schema.tables "
                    "WHERE table_schema = DATABASE()"
                )
            ).scalar()
            return jsonify(
                {
                    "ok": True,
                    "database": "connected",
                    "select_1": int(ping),
                    "tables_in_current_db": int(n_tables or 0),
                }
            )
        finally:
            db_mod.SessionLocal.remove()
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 503


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if len(username) < 2:
        return jsonify({"error": "사용자 이름은 2자 이상이어야 합니다."}), 400
    if len(password) < 4:
        return jsonify({"error": "비밀번호는 4자 이상이어야 합니다."}), 400
    try:
        new_id = db.create_user(username, password)
    except db.IntegrityError:
        return jsonify({"error": "이미 존재하는 사용자입니다."}), 409
    session["user_id"] = str(new_id)
    return jsonify({"user": {"id": str(new_id), "username": username}})


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    row = db.verify_login(username, password)
    if not row:
        return jsonify({"error": "아이디 또는 비밀번호가 올바르지 않습니다."}), 401
    session["user_id"] = str(row["id"])
    return jsonify(
        {"user": {"id": str(row["id"]), "username": row["username"]}}
    )


@app.post("/api/auth/logout")
def logout():
    session.pop("user_id", None)
    return jsonify({"ok": True})


@app.get("/api/auth/me")
def me():
    uid, err = require_user()
    if err:
        return err
    user = db.get_user_by_id(uid)
    assert user
    return jsonify(
        {"user": {"id": str(user["id"]), "username": user["username"]}}
    )


def _memo_to_json(m: store.MemoRecord) -> dict:
    return {
        "id": m.id,
        "title": m.title,
        "body": m.body,
        "tags": m.tags,
        "due_date": m.due_date,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }


@app.get("/api/memos")
def list_memos():
    uid, err = require_user()
    if err:
        return err
    q = request.args.get("q") or None
    tag = request.args.get("tag") or None
    memos = store.list_memos_for_user(uid)
    memos = store.filter_memos(memos, q, tag)
    return jsonify({"memos": [_memo_to_json(m) for m in memos]})


@app.post("/api/memos")
def create_memo():
    uid, err = require_user()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    title = data.get("title") or ""
    body = data.get("body") or ""
    tags = data.get("tags") or []
    due = data.get("due_date")
    if due is not None and due != "" and isinstance(due, str):
        pass
    else:
        due = None
    if not isinstance(tags, list):
        tags = []
    tags = [str(t).strip() for t in tags if str(t).strip()]
    m = store.create_memo(uid, title, body, tags, due)
    return jsonify({"memo": _memo_to_json(m)}), 201


@app.get("/api/memos/<memo_id>")
def get_memo(memo_id: str):
    uid, err = require_user()
    if err:
        return err
    m = store.get_memo(uid, memo_id)
    if not m:
        return jsonify({"error": "메모를 찾을 수 없습니다."}), 404
    return jsonify({"memo": _memo_to_json(m)})


@app.patch("/api/memos/<memo_id>")
def patch_memo(memo_id: str):
    uid, err = require_user()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    kw = {}
    if "title" in data:
        kw["title"] = data.get("title") or ""
    if "body" in data:
        kw["body"] = data.get("body") or ""
    if "tags" in data:
        tags = data.get("tags") or []
        if not isinstance(tags, list):
            return jsonify({"error": "tags는 배열이어야 합니다."}), 400
        kw["tags"] = [str(t).strip() for t in tags if str(t).strip()]
    if "due_date" in data:
        d = data.get("due_date")
        kw["due_date"] = d if d else None
    m = store.update_memo(uid, memo_id, **kw)
    if not m:
        return jsonify({"error": "메모를 찾을 수 없습니다."}), 404
    return jsonify({"memo": _memo_to_json(m)})


@app.delete("/api/memos/<memo_id>")
def delete_memo(memo_id: str):
    uid, err = require_user()
    if err:
        return err
    if not store.delete_memo(uid, memo_id):
        return jsonify({"error": "메모를 찾을 수 없습니다."}), 404
    return jsonify({"ok": True})


@app.post("/api/memos/<memo_id>/summarize")
def summarize_memo(memo_id: str):
    uid, err = require_user()
    if err:
        return err
    src = store.get_memo(uid, memo_id)
    if not src:
        return jsonify({"error": "메모를 찾을 수 없습니다."}), 404
    combined = f"{src.title}\n\n{src.body}".strip()
    if not combined:
        return jsonify({"error": "요약할 내용이 없습니다."}), 400
    try:
        summary = summarize_with_hf(combined)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 502
    short_title = summary.replace("\n", " ").strip()
    if len(short_title) > 80:
        short_title = short_title[:77] + "..."
    title = f"요약: {short_title}" if short_title else "요약 메모"
    new_m = store.create_memo(
        uid,
        title,
        summary,
        ["요약"],
        None,
    )
    return jsonify({"memo": _memo_to_json(new_m)}), 201


if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=True)
