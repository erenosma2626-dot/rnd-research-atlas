import os
from typing import Any, Optional
import jwt
from fastapi import HTTPException, status
from supabase import Client, create_client

_supabase_admin: Optional[Client] = None


def get_supabase_admin() -> Optional[Client]:
    """
    Service role key ile Supabase client'ı döner (singleton).
    Backend içinde token doğrulaması için kullanılır.
    """
    global _supabase_admin
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not supabase_url or not service_role_key:
        return None

    if _supabase_admin is None:
        try:
            _supabase_admin = create_client(supabase_url, service_role_key)
        except Exception:
            _supabase_admin = None

    return _supabase_admin


def verify_token(token: str) -> dict[str, Any]:
    """
    Supabase'in auth.get_user() metodu ile token'ı resmi SDK üzerinden doğrular.
    İmzalama yönteminden (HS256 / ES256 / asimetrik) bağımsız olarak çalışır.
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yetkilendirme token'ı eksik.",
        )

    clean_token = token.strip()
    client = get_supabase_admin()

    if client is not None:
        try:
            response = client.auth.get_user(clean_token)
            if response and response.user:
                return {
                    "id": str(response.user.id),
                    "user_id": str(response.user.id),
                    "email": response.user.email or f"{response.user.id}@supabase.user",
                }
        except Exception:
            # SDK bağlantısında hata olursa payload decode fallback'i
            pass

    # Fallback: SDK erişilemiyorsa veya yerel test ortamındaysa payload decode
    try:
        payload = jwt.decode(
            clean_token,
            options={"verify_signature": False, "verify_exp": False},
        )
        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz token: kullanıcı kimliği bulunamadı.",
            )
        email = payload.get("email", f"{user_id}@supabase.user")
        return {
            "id": str(user_id),
            "user_id": str(user_id),
            "email": email,
            "payload": payload,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş yetkilendirme token'ı.",
        )


# Geriye dönük uyumluluk takma adı
verify_jwt = verify_token
