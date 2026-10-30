# Alembic 설정: DB 주소는 backend/.env에서 읽는다 (alembic.ini에 적지 않는다)
# 기본은 DATABASE_URL, "-x db=test"를 붙이면 DATABASE_URL_TEST
from logging.config import fileConfig

from sqlalchemy import create_engine, pool

from alembic import context
from app.config import get_database_url, get_test_database_url
from app.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 자동으로 마이그레이션을 만들 때 비교할 표 모양
target_metadata = Base.metadata


def get_url() -> str:
    target = context.get_x_argument(as_dictionary=True).get("db", "main")
    return get_test_database_url() if target == "test" else get_database_url()


# DB에 연결하지 않고 SQL만 출력하는 모드
def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# DB에 연결해서 적용하는 모드
def run_migrations_online() -> None:
    connectable = create_engine(get_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
