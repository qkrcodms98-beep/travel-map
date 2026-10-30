# DB 표 모양 (DATA_MODEL 2장). 표는 trips 하나뿐이다
import uuid
from datetime import date, datetime

from sqlalchemy import ARRAY, CheckConstraint, Date, DateTime, MetaData, String, Text, Uuid, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# 제약조건 이름을 정해진 모양으로 붙인다 (마이그레이션에서 이름이 바뀌지 않게)
NAMING_CONVENTION = {
    "pk": "pk_%(table_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


# 여행 한 개가 한 줄
class TripRow(Base):
    __tablename__ = "trips"
    __table_args__ = (
        # DB에서도 검사하는 규칙 (DATA_MODEL 2장 "제약조건을 어디서 검사하는지")
        CheckConstraint("region_code ~ '^[0-9]{5}$'", name="region_code_5_digits"),
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="end_date_not_before_start"),
        CheckConstraint("char_length(diary) <= 2000", name="diary_max_2000"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text("gen_random_uuid()"))
    region_code: Mapped[str] = mapped_column(String(5), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # 비어 있으면 당일치기
    diary: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    dong_codes: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, server_default=text("'{}'"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
