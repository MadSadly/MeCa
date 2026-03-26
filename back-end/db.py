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
    host = os.environ.get("MYSQL_HOST", "127.0.0.1")
    port = int(os.environ.get("MYSQL_PORT", "3306"))
    user = os.environ.get("MYSQL_USER", "root")
    password = os.environ.get("MYSQL_PASSWORD", "5555")
    database = os.environ.get("MYSQL_DATABASE", "MeCa")
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
    password = os.environ.get("MYSQL_PASSWORD", "")
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
