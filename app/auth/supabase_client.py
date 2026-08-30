import os
from typing import Any
import jwt
from fastapi import HTTPException, status


def verify_jwt(token: str) -> dict[str, Any]:
    """
    Supabase JWT token'ını doğrular ve payload'dan user_id (sub) ile email'i döner.
    """
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()

    try:
        if jwt_secret:
            # Supabase HS256 secret ile imza ve süre doğrulaması
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Geliştirme/test ortamında secret girilmediyse imza kontrolsüz decode
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": True},
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz token: 'sub' (kullanıcı kimliği) bulunamadı.",
            )

        email = payload.get("email", f"{user_id}@supabase.user")
        return {
            "user_id": user_id,
            "email": email,
            "payload": payload,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum süresi dolmuş. Lütfen tekrar giriş yapın.",
        )
    except (jwt.InvalidTokenError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Geçersiz yetkilendirme token'ı: {str(e)}",
        )
