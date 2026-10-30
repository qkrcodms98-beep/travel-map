# 여행일기 최대 글자 수 (화면의 DIARY_MAX_CHARS와 같다)
DIARY_MAX_CHARS = 2000


# 글자 세기: 문자 하나를 1자로 센다. 파이썬 len()이 이미 이렇게 센다 (😀 = 1자, DB와 같음)
def count_diary_chars(text: str) -> int:
    return len(text)
