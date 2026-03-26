"""SQLAlchemy 엔진·세션. MariaDB(MySQL 호환) 연결."""
from __future__ import annotations

import os
import re

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import scoped_session, sessionmaker

import models as _models  # noqa: F401 — 테이블 메타데이터 등록
from models import Base

load_dotenv()

_engine = None
SessionLocal: scoped_session | None = None


def get_database_url() -> str:
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if url:
        return url
    # Windows: localhost 대신 127.0.0.1 권장 (호스트가 DESKTOP-... 로 잡혀 root 인증 실패 방지)
    host = os.environ.get("MYSQL_HOST", "127.0.0.1")
    port = int(os.environ.get("MYSQL_PORT", "3306"))
    user = os.environ.get("MYSQL_USER", "root")
    password = os.environ.get("MYSQL_PASSWORD") or ""
    database = os.environ.get("MYSQL_DATABASE", "memos")
    if not all([user, database]):
        raise RuntimeError(
            "DATABASE_URL 또는 MYSQL_USER, MYSQL_DATABASE 를 .env에 설정하세요."
        )
    pw = password.replace("%", "%%")
    return f"mysql+pymysql://{user}:{pw}@{host}:{port}/{database}?charset=utf8mb4"


def _ensure_mysql_database_exists() -> None:
    """MYSQL_* 사용 시 DB가 없으면 생성 (DATABASE_URL 직접 사용 시에는 수동 생성)."""
    if (os.environ.get("DATABASE_URL") or "").strip():
        return
    database = (os.environ.get("MYSQL_DATABASE") or "").strip()
    if not database:
        return
    if not re.match(r"^[a-zA-Z0-9_]+$", database):
        raise ValueError(
            "MYSQL_DATABASE는 영문, 숫자, 밑줄만 사용하세요 (예: meca)."
        )
    host = os.environ.get("MYSQL_HOST", "127.0.0.1")
    port = int(os.environ.get("MYSQL_PORT", "3306"))
    user = os.environ.get("MYSQL_USER", "")
    password = os.environ.get("MYSQL_PASSWORD") or ""
    if not user:
        return
    pw = password.replace("%", "%%")
    server_url = f"mysql+pymysql://{user}:{pw}@{host}:{port}/?charset=utf8mb4"
    eng = create_engine(server_url, pool_pre_ping=True)
    with eng.connect() as conn:
        conn.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
        conn.commit()
    eng.dispose()


def init_db() -> None:
    global _engine, SessionLocal
    if _engine is not None:
        return
    _ensure_mysql_database_exists()
    url = get_database_url()
    _engine = create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=os.environ.get("SQL_ECHO", "").lower() in ("1", "true", "yes"),
    )
    SessionLocal = scoped_session(
        sessionmaker(bind=_engine, autoflush=False, autocommit=False)
    )
    Base.metadata.create_all(_engine)


def get_engine():
    init_db()
    return _engine


def register_teardown(app) -> None:
    @app.teardown_appcontext
    def _remove_session(_exc=None) -> None:
        if SessionLocal is not None:
            SessionLocal.remove()


# --- pymysql: users 테이블 (평문 비밀번호, 과제용) ---
import pymysql
from pymysql.cursors import DictCursor
from pymysql.err import IntegrityError

__all__ = [
    "IntegrityError",
    "ensure_users_table",
    "create_user",
    "get_user_by_id",
    "get_user_by_username",
    "verify_login",
]


def get_connection():
    return pymysql.connect(
        host=os.environ.get("MYSQL_HOST", "127.0.0.1"),
        port=int(os.environ.get("MYSQL_PORT", "3306")),
        user=os.environ.get("MYSQL_USER", "root"),
        password=os.environ.get("MYSQL_PASSWORD") or "",
        database=os.environ.get("MYSQL_DATABASE", "memos"),
        charset="utf8mb4",
        cursorclass=DictCursor,
    )


def ensure_users_table() -> None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # models.User 와 동일 컬럼 (SQLAlchemy create_all 과 호환)
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  username VARCHAR(80) NOT NULL UNIQUE,
                  password_hash VARCHAR(255) NOT NULL,
                  full_name VARCHAR(100) NULL,
                  email VARCHAR(120) NULL,
                  phone VARCHAR(30) NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """
            )
            # 기존 users 테이블(구버전)에 컬럼이 없을 수 있어 보강
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) NULL")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(120) NULL")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL")
        conn.commit()
    finally:
        conn.close()


def create_user(
    username: str,
    password: str,
    full_name: str | None = None,
    email: str | None = None,
    phone: str | None = None,
) -> int:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (username, password_hash, full_name, email, phone)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    username,
                    password,
                    (full_name or "").strip() or None,
                    (email or "").strip() or None,
                    (phone or "").strip() or None,
                ),
            )
            conn.commit()
            return int(cur.lastrowid)
    finally:
        conn.close()


def get_user_by_id(user_id: int | str) -> dict | None:
    uid = int(user_id)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, password_hash FROM users WHERE id = %s",
                (uid,),
            )
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_username(username: str) -> dict | None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, password_hash FROM users WHERE username = %s",
                (username,),
            )
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


def verify_login(username: str, password: str) -> dict | None:
    row = get_user_by_username(username)
    if not row:
        return None
    if row["password_hash"] != password:
        return None
    return row
