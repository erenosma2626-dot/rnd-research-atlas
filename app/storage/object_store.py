import io
import os
from typing import Optional
from urllib.parse import urlparse
from minio import Minio
from minio.error import S3Error


def get_minio_client() -> Minio:
    """MinIO Python SDK istemcisi oluşturur."""
    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    access_key = os.getenv("MINIO_ACCESS_KEY", "devadmin")
    secret_key = os.getenv("MINIO_SECRET_KEY", "devpassword123")
    secure = os.getenv("MINIO_SECURE", "false").lower().strip() == "true"

    return Minio(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure,
    )


def ensure_bucket_exists(bucket_name: Optional[str] = None) -> None:
    """Belirtilen bucket yoksa otomatik olarak oluşturur."""
    bucket = bucket_name or os.getenv("MINIO_BUCKET", "documents")
    client = get_minio_client()
    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
    except S3Error as e:
        raise RuntimeError(f"MinIO bucket kontrolü/oluşturması başarısız: {str(e)}")


def parse_storage_path(storage_path: str) -> tuple[str, str]:
    """'s3://bucket/object_name' veya 'bucket/object_name' formatındaki URI'yi (bucket, object_name) çiftine ayrıştırır."""
    if storage_path.startswith("s3://"):
        parsed = urlparse(storage_path)
        bucket = parsed.netloc
        object_name = parsed.path.lstrip("/")
        return bucket, object_name
    elif "/" in storage_path:
        parts = storage_path.split("/", 1)
        return parts[0], parts[1]
    else:
        bucket = os.getenv("MINIO_BUCKET", "documents")
        return bucket, storage_path


def upload_file(
    file_path: str,
    bucket: Optional[str] = None,
    object_name: Optional[str] = None,
) -> str:
    """Yerel bir dosyayı MinIO'ya yükler ve kalıcı 's3://bucket/object_name' URI'si döner."""
    target_bucket = bucket or os.getenv("MINIO_BUCKET", "documents")
    ensure_bucket_exists(target_bucket)

    target_object_name = object_name or os.path.basename(file_path)
    client = get_minio_client()

    try:
        client.fput_object(
            bucket_name=target_bucket,
            object_name=target_object_name,
            file_path=file_path,
        )
        return f"s3://{target_bucket}/{target_object_name}"
    except S3Error as e:
        raise RuntimeError(f"Dosya MinIO'ya yüklenirken hata oluştu: {str(e)}")


def upload_bytes(
    data: bytes,
    bucket: Optional[str] = None,
    object_name: str = "document.pdf",
    content_type: str = "application/pdf",
) -> str:
    """Bayt akışını MinIO'ya yükler ve 's3://bucket/object_name' URI'si döner."""
    target_bucket = bucket or os.getenv("MINIO_BUCKET", "documents")
    ensure_bucket_exists(target_bucket)

    client = get_minio_client()
    data_stream = io.BytesIO(data)

    try:
        client.put_object(
            bucket_name=target_bucket,
            object_name=object_name,
            data=data_stream,
            length=len(data),
            content_type=content_type,
        )
        return f"s3://{target_bucket}/{object_name}"
    except S3Error as e:
        raise RuntimeError(f"Bayt verisi MinIO'ya yüklenirken hata oluştu: {str(e)}")


def download_file(storage_path: str, destination_path: str) -> None:
    """MinIO'daki nesneyi yerel dosya sistemine indirir."""
    bucket, object_name = parse_storage_path(storage_path)
    client = get_minio_client()

    try:
        client.fget_object(
            bucket_name=bucket,
            object_name=object_name,
            file_path=destination_path,
        )
    except S3Error as e:
        raise RuntimeError(f"Dosya MinIO'dan indirilirken hata oluştu: {str(e)}")


def delete_file(storage_path: str) -> None:
    """MinIO'daki nesneyi kalıcı olarak siler."""
    bucket, object_name = parse_storage_path(storage_path)
    client = get_minio_client()

    try:
        client.remove_object(
            bucket_name=bucket,
            object_name=object_name,
        )
    except S3Error as e:
        raise RuntimeError(f"Dosya MinIO'dan silinirken hata oluştu: {str(e)}")


def get_presigned_url(storage_path: str, expires_seconds: int = 3600) -> str:
    """MinIO nesnesine doğrudan erişim sağlayan geçici imzalı URL döner."""
    from datetime import timedelta
    bucket, object_name = parse_storage_path(storage_path)
    client = get_minio_client()

    try:
        url = client.presigned_get_object(
            bucket_name=bucket,
            object_name=object_name,
            expires=timedelta(seconds=expires_seconds),
        )
        return url
    except S3Error as e:
        raise RuntimeError(f"İmzalı URL üretilirken hata oluştu: {str(e)}")
