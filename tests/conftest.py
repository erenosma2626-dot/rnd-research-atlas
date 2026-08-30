from uuid import uuid4
from datetime import datetime, timezone
import pytest
from app.auth.dependencies import get_current_user
from app.db.models import User
from app.main import app


@pytest.fixture(autouse=True)
def override_auth_dependency():
    """Tüm testlerde authentication dependency'sini mock kullanıcı ile override eder."""
    mock_user = User(
        id=uuid4(),
        email="testuser@rndpapercanvas.com",
        display_name="Test User",
        created_at=datetime.now(timezone.utc),
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield mock_user
    app.dependency_overrides.pop(get_current_user, None)
