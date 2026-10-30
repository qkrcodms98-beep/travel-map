# DB 연결. 처음 쓸 때 한 번만 만든다 (DB 주소가 없어도 메모리 테스트는 돌 수 있게)
from functools import cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_database_url


# Neon은 쉬다가 연결을 끊을 수 있어서, 쓰기 전에 연결이 살아 있는지 확인한다
def make_engine(url: str) -> Engine:
    return create_engine(url, pool_pre_ping=True)


# 세션을 만드는 함수. 저장한 뒤에도 값을 다시 읽지 않고 그대로 쓸 수 있게 한다
def make_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(engine, expire_on_commit=False)


@cache
def get_engine() -> Engine:
    return make_engine(get_database_url())


@cache
def get_session_factory() -> sessionmaker[Session]:
    return make_session_factory(get_engine())
