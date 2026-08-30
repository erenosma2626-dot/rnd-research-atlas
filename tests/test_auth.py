import os
from unittest.mock import patch
from uuid import uuid4
import jwt
import pytest
from fastapi import HTTPException
from app.auth.supabase_client import verify_jwt


def test_verify_jwt_with_secret():
    secret = "testsecretkey32characterslongforhs256!"
    user_id = str(uuid4())
    token = jwt.encode({"sub": user_id, "email": "researcher@lab.io"}, secret, algorithm="HS256")

    with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": secret}):
        claims = verify_jwt(token)
        assert claims["user_id"] == user_id
        assert claims["email"] == "researcher@lab.io"


def test_verify_jwt_without_secret_fallback():
    user_id = str(uuid4())
    token = jwt.encode({"sub": user_id, "email": "researcher@lab.io"}, "anysecret", algorithm="HS256")

    with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": ""}):
        claims = verify_jwt(token)
        assert claims["user_id"] == user_id
        assert claims["email"] == "researcher@lab.io"


def test_verify_jwt_missing_sub():
    token = jwt.encode({"email": "test@domain.com"}, "anysecret", algorithm="HS256")
    with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": ""}):
        with pytest.raises(HTTPException) as exc_info:
            verify_jwt(token)
        assert exc_info.value.status_code == 401
