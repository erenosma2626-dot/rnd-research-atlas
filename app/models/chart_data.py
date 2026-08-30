from pydantic import BaseModel, Field


class ChartSeries(BaseModel):
    """Grafik serisi (Örn: Model, Yöntem veya Koşul)."""

    name: str = Field(description="Seri adı (Örn: AIM, Diffusion, BNN, vb.)")
    values: list[float] = Field(description="X ekseni etiketlerine karşılık gelen sayısal değerler")


class ChartData(BaseModel):
    """Bar ve Line grafikleri için yapılandırılmış veri şeması."""

    chart_type: str = Field(default="bar", description="Grafik tipi: 'bar' | 'line'")
    x_labels: list[str] = Field(description="X ekseni kategorileri / etiketleri (Örn: Veri setleri veya Epoch)")
    series: list[ChartSeries] = Field(description="Karşılaştırmalı veri serileri")
    y_axis_label: str = Field(default="Değer", description="Y ekseni birimi veya metriği (Örn: F1 Score, RMSE, Accuracy %)")
    title: str = Field(description="Grafik başlığı")
