from unittest.mock import MagicMock, patch
from uuid import uuid4
import jwt
import pytest
from fastapi import HTTPException
from app.auth.supabase_client import verify_token


def test_verify_token_via_sdk_client():
    user_id = str(uuid4())
    mock_client = MagicMock()
    mock_user_obj = MagicMock()
    mock_user_obj.id = user_id
    mock_user_obj.email = "researcher@lab.io"
    mock_client.auth.get_user.return_value = MagicMock(user=mock_user_obj)

    with patch("app.auth.supabase_client.get_supabase_admin", return_value=mock_client):
        claims = verify_token("valid-supabase-token")
        assert claims["user_id"] == user_id
        assert claims["email"] == "researcher@lab.io"


def test_verify_token_via_payload_fallback():
    user_id = str(uuid4())
    token = jwt.encode({"sub": user_id, "email": "fallback@lab.io"}, "anysecret", algorithm="HS256")

    with patch("app.auth.supabase_client.get_supabase_admin", return_value=None):
        claims = verify_token(token)
        assert claims["user_id"] == user_id
        assert claims["email"] == "fallback@lab.io"


def test_verify_token_missing_sub():
    token = jwt.encode({"email": "test@domain.com"}, "anysecret", algorithm="HS256")
    with patch("app.auth.supabase_client.get_supabase_admin", return_value=None):
        with pytest.raises(HTTPException) as exc_info:
            verify_token(token)
        assert exc_info.value.status_code == 401
