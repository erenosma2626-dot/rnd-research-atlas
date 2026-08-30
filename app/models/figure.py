from pydantic import BaseModel, Field


class ExtractedFigure(BaseModel):
    """Docling tarafından PDF'ten ayıklanan görsel/şema/fotoğraf modeli."""

    figure_id: str = Field(description="Benzersiz figür kimliği")
    page: int = Field(description="Görselin yer aldığı sayfa numarası")
    caption: str | None = Field(default=None, description="Figür başlığı veya altyazısı")
    image_storage_path: str = Field(description="MinIO/S3 veya yerel dosya depolama URI'si")
    figure_type: str = Field(
        default="unknown",
        description="Görsel türü: 'diagram' | 'chart' | 'photo' | 'table_image' | 'unknown'",
    )
