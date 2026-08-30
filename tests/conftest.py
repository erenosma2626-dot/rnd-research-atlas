from datetime import datetime, timezone
from uuid import uuid4
import pytest
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.config.constants import DEFAULT_PROJECT_ID, DEFAULT_USER_ID
from app.db.models import ProjectMember, User
from app.main import app


@pytest.fixture(autouse=True)
def override_auth_dependency():
    """Tüm testlerde authentication ve role dependency'lerini mock ile override eder."""
    mock_user = User(
        id=DEFAULT_USER_ID,
        email="testuser@rndpapercanvas.com",
        display_name="Test User",
        created_at=datetime.now(timezone.utc),
    )
    mock_member = ProjectMember(
        id=uuid4(),
        project_id=DEFAULT_PROJECT_ID,
        user_id=DEFAULT_USER_ID,
        role="owner",
        invited_by=DEFAULT_USER_ID,
        joined_at=datetime.now(timezone.utc),
        invited_at=datetime.now(timezone.utc),
    )

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[require_role("owner")] = lambda: mock_member
    app.dependency_overrides[require_role("editor")] = lambda: mock_member
    app.dependency_overrides[require_role("viewer")] = lambda: mock_member

    yield mock_user

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(require_role("owner"), None)
    app.dependency_overrides.pop(require_role("editor"), None)
    app.dependency_overrides.pop(require_role("viewer"), None)
