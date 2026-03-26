"""Hugging Face Inference API 요약 호출."""
import os
from typing import Any

import requests


def _parse_summary_payload(data: Any) -> str:
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, dict):
            for key in ("summary_text", "generated_text", "summary"):
                if key in first and first[key]:
                    return str(first[key]).strip()
    if isinstance(data, dict):
        for key in ("summary_text", "generated_text", "summary"):
            if key in data and data[key]:
                return str(data[key]).strip()
    if isinstance(data, str):
        return data.strip()
    return ""


def summarize_with_hf(full_text: str) -> str:
    token = os.environ.get("HF_TOKEN", "").strip()
    model = os.environ.get(
        "HF_SUMMARIZATION_MODEL", "facebook/bart-large-cnn"
    ).strip()
    if not token:
        raise ValueError("HF_TOKEN이 .env에 없습니다. Hugging Face 토큰을 설정하세요.")

    url = f"https://router.huggingface.co/hf-inference/models/{model}"
    payload = full_text[:4000]
    r = requests.post(
        url,
        headers={"Authorization": f"Bearer {token}"},
    json={
        "inputs": payload,
        "parameters": {
            "min_length": 50,
            "max_length": 200,
        }
    },
        timeout=120,
    )
    if r.status_code == 503:
        raise RuntimeError(
            "모델이 로딩 중입니다. 잠시 후 다시 시도하세요."
        )
    if r.status_code != 200:
        raise RuntimeError(f"HF API 오류 {r.status_code}: {r.text[:300]}")

    data = r.json()
    text = _parse_summary_payload(data)
    if not text:
        raise RuntimeError("요약 결과를 파싱할 수 없습니다.")
    return text
