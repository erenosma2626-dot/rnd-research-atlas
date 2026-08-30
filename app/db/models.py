from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    """UTC zaman damgası döner."""
    return datetime.now(timezone.utc)


class User(Base):
    """Kullanıcı tablosu (Faz 4 Auth için temel şema)."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # İlişkiler
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    notes: Mapped[list["Note"]] = relationship("Note", back_populates="author", cascade="all, delete-orphan")


class Project(Base):
    """Kullanıcı projeleri tablosu."""

    __tablename__ = "projects"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # İlişkiler
    owner: Mapped["User"] = relationship("User", back_populates="projects")
    project_documents: Mapped[list["ProjectDocument"]] = relationship(
        "ProjectDocument", back_populates="project", cascade="all, delete-orphan"
    )


class Document(Base):
    """Yüklenen PDF dokümanları tablosu."""

    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)  # s3://documents/path
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    processing_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, default=None, nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None, nullable=True)

    # İlişkiler
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="document", cascade="all, delete-orphan")
    project_documents: Mapped[list["ProjectDocument"]] = relationship(
        "ProjectDocument", back_populates="document", cascade="all, delete-orphan"
    )
    document_tags: Mapped[list["DocumentTag"]] = relationship(
        "DocumentTag", back_populates="document", cascade="all, delete-orphan"
    )


class ProjectDocument(Base):
    """Proje ile doküman arasındaki çoktan-çoğa ilişki tablosu."""

    __tablename__ = "project_documents"

    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    added_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # İlişkiler
    project: Mapped["Project"] = relationship("Project", back_populates="project_documents")
    document: Mapped["Document"] = relationship("Document", back_populates="project_documents")


class Report(Base):
    """Makaleden üretilen rapor ve analiz versiyonları tablosu."""

    __tablename__ = "reports"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    paper_profile: Mapped[dict] = mapped_column(JSON, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # İlişkiler
    document: Mapped["Document"] = relationship("Document", back_populates="reports")
    sections: Mapped[list["Section"]] = relationship("Section", back_populates="report", cascade="all, delete-orphan")


class Section(Base):
    """Rapor bölümleri tablosu."""

    __tablename__ = "sections"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    section_type: Mapped[str] = mapped_column(String(50), nullable=False)  # prose, table, list, error
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    diagram: Mapped[Optional[dict]] = mapped_column(JSON, default=None, nullable=True)

    # İlişkiler
    report: Mapped["Report"] = relationship("Report", back_populates="sections")
    notes: Mapped[list["Note"]] = relationship("Note", back_populates="section", cascade="all, delete-orphan")


class Note(Base):
    """Bölümlere veya tuvale eklenen kullanıcı notları tablosu."""

    __tablename__ = "notes"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    section_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("sections.id", ondelete="CASCADE"), default=None, nullable=True, index=True
    )
    canvas_item_id: Mapped[Optional[UUID]] = mapped_column(default=None, nullable=True)  # Faz 3'te FK olacak
    author_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # İlişkiler
    author: Mapped["User"] = relationship("User", back_populates="notes")
    section: Mapped[Optional["Section"]] = relationship("Section", back_populates="notes")


class Tag(Base):
    """Doküman etiketleri tablosu."""

    __tablename__ = "tags"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    color: Mapped[Optional[str]] = mapped_column(String(50), default=None, nullable=True)

    # İlişkiler
    document_tags: Mapped[list["DocumentTag"]] = relationship(
        "DocumentTag", back_populates="tag", cascade="all, delete-orphan"
    )


class DocumentTag(Base):
    """Doküman ve etiket arasındaki çoktan-çoğa ilişki tablosu."""

    __tablename__ = "document_tags"

    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[UUID] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    # İlişkiler
    document: Mapped["Document"] = relationship("Document", back_populates="document_tags")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="document_tags")


class Canvas(Base):
    """Proje altındaki görsel çalışma alanı (Canvas sayfası)."""

    __tablename__ = "canvases"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None, nullable=True)

    # İlişkiler
    items: Mapped[list["CanvasItem"]] = relationship("CanvasItem", back_populates="canvas", cascade="all, delete-orphan")


class CanvasItem(Base):
    """Canvas üzerindeki tekil elemanlar (doküman kutucuğu, not, bağlantı)."""

    __tablename__ = "canvas_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    canvas_id: Mapped[UUID] = mapped_column(ForeignKey("canvases.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type: Mapped[str] = mapped_column(String(50), nullable=False)  # document_box, note, connection
    ref_id: Mapped[Optional[UUID]] = mapped_column(default=None, nullable=True)  # document_box ise Document.id
    position_x: Mapped[float] = mapped_column(default=0.0, nullable=False)
    position_y: Mapped[float] = mapped_column(default=0.0, nullable=False)
    content: Mapped[Optional[dict]] = mapped_column(JSON, default=None, nullable=True)

    # İlişkiler
    canvas: Mapped["Canvas"] = relationship("Canvas", back_populates="items")
