from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient
import pytest

from app.auth.permissions import require_role
from app.db.models import Project, ProjectInvite, ProjectMember, User
from app.main import app

client = TestClient(app)


def test_list_user_projects_endpoint(override_auth_dependency):
    mock_projects = [
        {
            "id": uuid4(),
            "name": "ArGe Projesi 1",
            "owner_id": override_auth_dependency.id,
            "role": "owner",
            "created_at": datetime.now(timezone.utc),
        }
    ]

    with patch("app.routers.invites.ProjectRepository.list_by_user", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = mock_projects

        response = client.get("/projects")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "ArGe Projesi 1"
        assert data[0]["role"] == "owner"


def test_create_project_endpoint(override_auth_dependency):
    proj_id = uuid4()
    mock_project = Project(
        id=proj_id,
        name="Yeni Çoklu Kullanıcı Projesi",
        owner_id=override_auth_dependency.id,
        created_at=datetime.now(timezone.utc),
    )

    with patch("app.routers.invites.ProjectRepository.create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_project

        response = client.post(
            "/projects",
            json={"name": "Yeni Çoklu Kullanıcı Projesi", "description": "Açıklama"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == str(proj_id)
        assert data["name"] == "Yeni Çoklu Kullanıcı Projesi"


def test_create_project_invite_endpoint(override_auth_dependency):
    proj_id = uuid4()
    invite_id = uuid4()
    mock_member = ProjectMember(
        id=uuid4(),
        project_id=proj_id,
        user_id=override_auth_dependency.id,
        role="owner",
        invited_by=override_auth_dependency.id,
        joined_at=datetime.now(timezone.utc),
        invited_at=datetime.now(timezone.utc),
    )
    mock_invite = ProjectInvite(
        id=invite_id,
        project_id=proj_id,
        invited_email="colleague@lab.io",
        role="editor",
        invite_token="token-abc-123",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        status="pending",
        created_at=datetime.now(timezone.utc),
    )

    with patch("app.auth.permissions.ProjectMemberRepository.get_member", new_callable=AsyncMock) as mock_get_mem, \
         patch("app.routers.invites.ProjectInviteRepository.create_invite", new_callable=AsyncMock) as mock_create_inv:
        mock_get_mem.return_value = mock_member
        mock_create_inv.return_value = mock_invite

        response = client.post(
            f"/projects/{proj_id}/invite",
            json={"email": "colleague@lab.io", "role": "editor"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["invite_token"] == "token-abc-123"
        assert data["role"] == "editor"
        assert "/invite/token-abc-123" in data["invite_link"]


def test_get_invite_info_endpoint():
    proj_id = uuid4()
    mock_invite = ProjectInvite(
        id=uuid4(),
        project_id=proj_id,
        invited_email="friend@lab.io",
        role="editor",
        invite_token="valid-token-777",
        expires_at=datetime.now(timezone.utc) + timedelta(days=5),
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    mock_project = Project(
        id=proj_id,
        name="Kuantum Hesaplama",
        owner_id=uuid4(),
        created_at=datetime.now(timezone.utc),
    )

    with patch("app.routers.invites.ProjectInviteRepository.get_by_token", new_callable=AsyncMock) as mock_get_inv, \
         patch("app.routers.invites.ProjectRepository.get_by_id", new_callable=AsyncMock) as mock_get_proj:
        mock_get_inv.return_value = mock_invite
        mock_get_proj.return_value = mock_project

        response = client.get("/invites/valid-token-777")
        assert response.status_code == 200
        data = response.json()
        assert data["project_name"] == "Kuantum Hesaplama"
        assert data["invited_email"] == "friend@lab.io"
        assert data["role"] == "editor"


def test_accept_project_invite_endpoint(override_auth_dependency):
    proj_id = uuid4()
    invite_id = uuid4()
    mock_invite = ProjectInvite(
        id=invite_id,
        project_id=proj_id,
        invited_email=override_auth_dependency.email,
        role="editor",
        invite_token="token-for-user",
        expires_at=datetime.now(timezone.utc) + timedelta(days=3),
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    mock_project = Project(
        id=proj_id,
        name="Paylaşılan Proje",
        owner_id=uuid4(),
        created_at=datetime.now(timezone.utc),
    )

    with patch("app.routers.invites.ProjectInviteRepository.get_by_token", new_callable=AsyncMock) as mock_get_inv, \
         patch("app.routers.invites.ProjectMemberRepository.add_member", new_callable=AsyncMock) as mock_add_mem, \
         patch("app.routers.invites.ProjectInviteRepository.mark_accepted", new_callable=AsyncMock) as mock_mark, \
         patch("app.routers.invites.ProjectRepository.get_by_id", new_callable=AsyncMock) as mock_get_proj:
        mock_get_inv.return_value = mock_invite
        mock_get_proj.return_value = mock_project
        mock_mark.return_value = True

        response = client.post("/invites/token-for-user/accept")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "accepted"
        assert data["project_id"] == str(proj_id)
        mock_add_mem.assert_called_once()
