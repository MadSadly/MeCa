"""터미널에서 DB 연결만 빠르게 확인: python check_db.py"""
from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

import db as db_mod
from sqlalchemy import text


def main() -> None:
    db_mod.init_db()
    s = db_mod.SessionLocal()
    try:
        n = s.execute(text("SELECT 1")).scalar()
        print("OK: MariaDB 연결 성공, SELECT 1 =", n)
    finally:
        db_mod.SessionLocal.remove()


if __name__ == "__main__":
    main()
