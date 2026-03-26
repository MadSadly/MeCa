"""MariaDB 사용자(회원) 저장. 비밀번호는 평문 저장(과제용 단순 구성)."""
from __future__ import annotations

import os

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
        host=os.environ.get("MYSQL_HOST", "localhost"),
        port=int(os.environ.get("MYSQL_PORT", "3306")),
        user=os.environ.get("MYSQL_USER", "root"),
        password=os.environ.get("MYSQL_PASSWORD", ""),
        database=os.environ.get("MYSQL_DATABASE", "memos"),
        charset="utf8mb4",
        cursorclass=DictCursor,
    )


def ensure_users_table() -> None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  username VARCHAR(100) NOT NULL UNIQUE,
                  password VARCHAR(255) NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """
            )
        conn.commit()
    finally:
        conn.close()


def create_user(username: str, password: str) -> int:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (username, password) VALUES (%s, %s)",
                (username, password),
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
                "SELECT id, username, password FROM users WHERE id = %s",
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
                "SELECT id, username, password FROM users WHERE username = %s",
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
    if row["password"] != password:
        return None
    return row
