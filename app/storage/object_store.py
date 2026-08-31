import io
import os
from typing import Optional
from urllib.parse import urlparse
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError


def get_storage_config() -> dict[str, str]:
    """Depolama sağlayıcısını (Cloudflare R2 veya MinIO/S3) ve bağlantı parametrelerini belirler."""
    r2_endpoint = os.getenv("R2_ENDPOINT")
    r2_access_key = os.getenv("R2_ACCESS_KEY")
    r2_secret_key = os.getenv("R2_SECRET_KEY")

    if r2_endpoint and r2_access_key:
        return {
            "provider": "r2",
            "endpoint_url": r2_endpoint,
            "access_key": r2_access_key,
            "secret_key": r2_secret_key or "",
            "bucket": os.getenv("R2_BUCKET", "papercanvas-documents"),
            "public_url": os.getenv("R2_PUBLIC_URL", ""),
            "region_name": "auto",
        }

    # Varsayılan MinIO / S3 ayarları
    minio_endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    minio_secure = os.getenv("MINIO_SECURE", "false").lower().strip() == "true"
    protocol = "https" if minio_secure else "http"
    if not minio_endpoint.startswith("http://") and not minio_endpoint.startswith("https://"):
        endpoint_url = f"{protocol}://{minio_endpoint}"
    else:
        endpoint_url = minio_endpoint

    return {
        "provider": "minio",
        "endpoint_url": endpoint_url,
        "access_key": os.getenv("MINIO_ACCESS_KEY", "devadmin"),
        "secret_key": os.getenv("MINIO_SECRET_KEY", "devpassword123"),
        "bucket": os.getenv("MINIO_BUCKET", "documents"),
        "public_url": "",
        "region_name": "us-east-1",
    }


def get_s3_client():
    """Boto3 S3 / R2 istemcisini başlatır."""
    cfg = get_storage_config()
    return boto3.client(
        "s3",
        endpoint_url=cfg["endpoint_url"],
        aws_access_key_id=cfg["access_key"],
        aws_secret_access_key=cfg["secret_key"],
        region_name=cfg["region_name"],
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


# Geriye dönük uyumluluk takma adı
get_minio_client = get_s3_client


def ensure_bucket_exists(bucket_name: Optional[str] = None) -> None:
    """Hedef bucket yoksa otomatik oluşturur veya erişimi doğrular."""
    cfg = get_storage_config()
    target_bucket = bucket_name or cfg["bucket"]
    client = get_s3_client()

    try:
        client.head_bucket(Bucket=target_bucket)
    except ClientError as e:
        error_code = str(e.response.get("Error", {}).get("Code", ""))
        if error_code in ("404", "NoSuchBucket"):
            try:
                client.create_bucket(Bucket=target_bucket)
            except Exception as create_err:
                print(f"Bucket otomatik oluşturulamadı (izin gerekebilir): {create_err}")
        else:
            # R2 veya yetki kısıtlamalarında head_bucket hata verebilir, devam et
            pass


def parse_storage_path(storage_path: str) -> tuple[str, str]:
    """'s3://bucket/object_name' veya 'bucket/object_name' formatındaki URI'yi (bucket, object_name) çiftine ayrıştırır."""
    cfg = get_storage_config()
    if storage_path.startswith("s3://"):
        parsed = urlparse(storage_path)
        bucket = parsed.netloc or cfg["bucket"]
        object_name = parsed.path.lstrip("/")
        return bucket, object_name
    elif "/" in storage_path and not storage_path.startswith("http"):
        parts = storage_path.split("/", 1)
        return parts[0], parts[1]
    else:
        return cfg["bucket"], storage_path


def upload_file(
    file_path: str,
    bucket: Optional[str] = None,
    object_name: Optional[str] = None,
) -> str:
    """Yerel bir dosyayı R2 / MinIO depolamaya yükler ve 's3://bucket/object_name' URI'si döner."""
    cfg = get_storage_config()
    target_bucket = bucket or cfg["bucket"]
    ensure_bucket_exists(target_bucket)

    target_object_name = object_name or os.path.basename(file_path)
    client = get_s3_client()

    try:
        client.upload_file(
            Filename=file_path,
            Bucket=target_bucket,
            Key=target_object_name,
            ExtraArgs={"ContentType": "application/pdf"} if target_object_name.endswith(".pdf") else None,
        )
        return f"s3://{target_bucket}/{target_object_name}"
    except Exception as e:
        raise RuntimeError(f"Dosya obje depolamaya yüklenirken hata oluştu: {str(e)}")


def upload_bytes(
    data: bytes,
    bucket: Optional[str] = None,
    object_name: str = "document.pdf",
    content_type: str = "application/pdf",
) -> str:
    """Bayt akışını R2 / MinIO depolamaya yükler ve 's3://bucket/object_name' URI'si döner."""
    cfg = get_storage_config()
    target_bucket = bucket or cfg["bucket"]
    ensure_bucket_exists(target_bucket)

    client = get_s3_client()
    data_stream = io.BytesIO(data)

    try:
        client.upload_fileobj(
            Fileobj=data_stream,
            Bucket=target_bucket,
            Key=object_name,
            ExtraArgs={"ContentType": content_type},
        )
        return f"s3://{target_bucket}/{object_name}"
    except Exception as e:
        raise RuntimeError(f"Bayt verisi obje depolamaya yüklenirken hata oluştu: {str(e)}")


def download_file(storage_path: str, destination_path: str) -> None:
    """Obje deposundaki nesneyi yerel dosya sistemine indirir."""
    bucket, object_name = parse_storage_path(storage_path)
    client = get_s3_client()

    try:
        client.download_file(
            Bucket=bucket,
            Key=object_name,
            Filename=destination_path,
        )
    except Exception as e:
        raise RuntimeError(f"Dosya obje deposundan indirilirken hata oluştu: {str(e)}")


def delete_file(storage_path: str) -> None:
    """Obje deposundaki nesneyi kalıcı olarak siler."""
    bucket, object_name = parse_storage_path(storage_path)
    client = get_s3_client()

    try:
        client.delete_object(
            Bucket=bucket,
            Key=object_name,
        )
    except Exception as e:
        raise RuntimeError(f"Dosya obje deposundan silinirken hata oluştu: {str(e)}")


def get_presigned_url(storage_path: str, expires_seconds: int = 3600) -> str:
    """Doğrudan erişim sağlayan geçici imzalı URL (veya R2 Public URL) döner."""
    cfg = get_storage_config()
    bucket, object_name = parse_storage_path(storage_path)

    # R2 Public Domain tanımlıysa doğrudan genel erişim URL'i dönebilir
    if cfg.get("public_url"):
        base_url = cfg["public_url"].rstrip("/")
        return f"{base_url}/{object_name}"

    client = get_s3_client()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": object_name},
            ExpiresIn=expires_seconds,
        )
        return url
    except Exception as e:
        raise RuntimeError(f"İmzalı URL üretilirken hata oluştu: {str(e)}")
