from __future__ import annotations

import json

import db as db_mod
from sqlalchemy import text


def main() -> None:
    db_mod.init_db()
    s = db_mod.SessionLocal()
    try:
        tag = "회의"
        tests = [
            ("json.dumps(ensure_ascii=False)", json.dumps(tag, ensure_ascii=False)),
            ("json.dumps(ensure_ascii=True)", json.dumps(tag, ensure_ascii=True)),
            ("manual '\"tag\"'", f'"{tag}"'),
        ]

        for label, v in tests:
            rows = s.execute(
                text(
                    "SELECT id, tags_json, JSON_CONTAINS(tags_json, :v) AS ok "
                    "FROM memos WHERE user_id=:u"
                ),
                {"v": v, "u": 1},
            ).fetchall()
            print("==", label, "==")
            print("v =", v)
            for r in rows:
                # tags_json 출력은 client 인코딩에 따라 이스케이프가 보일 수 있습니다.
                print(r)
    finally:
        db_mod.SessionLocal.remove()


if __name__ == "__main__":
    main()

