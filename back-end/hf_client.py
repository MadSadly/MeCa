"""Hugging Face Inference API 요약 호출."""
import os
from typing import Any

import requests


'''
_parse_summary_payload() : HF 응답 파싱 전담

data:Any : 해당 함수의 파라미터 data는 어떤 타입이든 올 수 있다!
why? : HF 응답이 아래처럼 뭐가 올지 모름

-> str : 해당 함수는 반드시 str(문자열)로 반환한다.
summary_text : BART 모델 응답
generated_text : GPT 계열 모델 응답
summary : 일부 다른 모델 응답
'''
def _parse_summary_payload(data: Any) -> str:

    # 케이스 1 : 리스트로 온 경우 (가장 흔함)
    # isinstance(data, list) : data가 list(리스트) 타입인지 확인 -> True / False
    # and data : data가 빈 리스트가 아닌지 확인 -> True / False
    # 즉, data가 리스트고 비어있지 않으면 들어가기.
    # if []:   # False → 안으로 안 들어감
    # if [{"summary_text": "요약"}]:  # True → 안으로 들어감

    if isinstance(data, list) and data:

        first = data[0]

        if isinstance(first, dict):
            for key in ("summary_text", "generated_text", "summary"):
                if key in first and first[key]:
                    return str(first[key]).strip()

    # 케이스 2 : 딕셔너리로 온 경우
    # {"summary_text": "요약 내용"}
    if isinstance(data, dict):
        for key in ("summary_text", "generated_text", "summary"):
            if key in data and data[key]:
                return str(data[key]).strip()

    # 케이스 3 : 문자열로 온 경우
    # "요약 내용"
    if isinstance(data, str):
        return data.strip()
    return ""


'''
summarize_with_hf() : HF API 호출 전담

os.environ : 환경 변수 전체를 담은 딕셔너리
'''
def summarize_with_hf(full_text: str) -> str:
    # token = os.environ.get("HF_TOKEN", "").strip() : .env에서 HF_TOKEN을 읽음, 없으면 빈 문자열
    token = os.environ.get("HF_TOKEN", "").strip()
    # 모델명 읽기, .env에 없으면 기본값 csebuetnlp/mT5_multilingual_XLSum 사용
    model = os.environ.get(
        "HF_SUMMARIZATION_MODEL", "csebuetnlp/mT5_multilingual_XLSum"
    ).strip()

    # 이 줄에서 실행 중단
    # 호출한 쪽(app.py)으로 예외 전달
    # app.py의 except ValueError가 받아서 400 반환
    # ValueError : 값이 잘못됐을 때 (토큰 없음)
    if not token:
        raise ValueError("HF_TOKEN이 .env에 없습니다. Hugging Face 토큰을 설정하세요.")

    # 모델명을 URL에 끼워서 요청 URL 생성
    url = f"https://router.huggingface.co/hf-inference/models/{model}"

    # 입력 텍스트 최대 4000자로 제한
    # 너무 길면 API 실패/느려짐 방지
    payload = full_text[:4000]
    r = requests.post(
        url,
        # 내 토큰으로 인증하기 위해 Authorization 헤더 추가
        headers={"Authorization": f"Bearer {token}"},
    # inputs : 요약할 텍스트
    # min_length : 최소 요약 길이
    # max_length : 최대 요약 길이
    json={
        "inputs": payload,
        "parameters": {
            "min_length": 150,
            "max_length": 500,
        }
    },
        timeout=120,
    )
    # 503 : 모델이 아직 메모리에 안 올라온 상태. 잠시 후 재시도 필요
    # RuntimeError : 실행 중 문제 발생 (API 실패)
    if r.status_code == 503:
        raise RuntimeError(
            "모델이 로딩 중입니다. 잠시 후 다시 시도하세요."
        )

    # 200이 아닌 모든 응답은 에러로 처리. 응답 본문 앞 300자만 출력
    if r.status_code != 200:
        raise RuntimeError(f"HF API 오류 {r.status_code}: {r.text[:300]}")

    # 응답 JSON 파싱
    data = r.json()

    # 요약 텍스트 추출
    text = _parse_summary_payload(data)

    # 요약 텍스트가 없으면 에러
    if not text:
        raise RuntimeError("요약 결과를 파싱할 수 없습니다.")

    # 정상이면 요약 반환
    return text
