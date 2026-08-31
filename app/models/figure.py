from typing import Any, Optional
from pydantic import BaseModel, Field


class ExtractedFigure(BaseModel):
    """Docling ve PyMuPDF tarafından PDF'ten ayıklanan görsel/şema/fotoğraf modeli."""

    figure_id: str = Field(description="Benzersiz figür kimliği")
    page: int = Field(default=1, description="Görselin yer aldığı sayfa numarası")
    page_number: Optional[int] = Field(default=None, description="Sayfa numarası takma adı")
    caption: Optional[str] = Field(default=None, description="Figür başlığı veya altyazısı")
    image_storage_path: Optional[str] = Field(
        default=None, description="MinIO/S3 veya yerel dosya depolama URI'si"
    )
    image_url: Optional[str] = Field(default=None, description="Görsel URL takma adı")
    figure_type: str = Field(
        default="diagram",
        description="Görsel türü: 'diagram' | 'chart' | 'photo' | 'table_image' | 'unknown'",
    )

    def __init__(self, **data: Any):
        if "page_number" in data and "page" not in data:
            data["page"] = data["page_number"]
        if "image_url" in data and "image_storage_path" not in data:
            data["image_storage_path"] = data["image_url"]
        super().__init__(**data)
        if not self.image_url and self.image_storage_path:
            self.image_url = self.image_storage_path
        if not self.image_storage_path and self.image_url:
            self.image_storage_path = self.image_url

