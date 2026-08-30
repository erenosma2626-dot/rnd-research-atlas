import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { DEFAULT_PROJECT_ID } from './api/client';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { CanvasPage } from './pages/CanvasPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectListPage } from './pages/ProjectListPage';
import { ProjectPage } from './pages/ProjectPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { ReportPage } from './pages/ReportPage';
import { SignupPage } from './pages/SignupPage';
import { UploadPage } from './pages/UploadPage';
import { ThemeProvider } from './theme/ThemeContext';

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // URL path'inden davet token'ı yakalama (/invite/:token)
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
      return path.split('/invite/')[1];
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('invite');
  });

  const [currentView, setCurrentView] = useState<
    'project_list' | 'project' | 'settings' | 'upload' | 'report' | 'canvas' | 'accept_invite'
  >(() => (inviteToken ? 'accept_invite' : 'project_list'));

  const [activeProjectId, setActiveProjectId] = useState<string>(DEFAULT_PROJECT_ID);
  const [activeProjectName, setActiveProjectName] = useState<string>('Varsayılan Proje');
  const [activeUserRole, setActiveUserRole] = useState<string>('owner');

  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>('');
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);

  useEffect(() => {
    if (inviteToken) {
      setCurrentView('accept_invite');
    }
  }, [inviteToken]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark animate-pulse">
          Oturum kontrol ediliyor...
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'signup' ? (
      <SignupPage onNavigateToLogin={() => setAuthView('login')} />
    ) : (
      <LoginPage onNavigateToSignup={() => setAuthView('signup')} />
    );
  }

  const handleSelectProject = (projectId: string, projectName: string, userRole: string) => {
    setActiveProjectId(projectId);
    setActiveProjectName(projectName);
    setActiveUserRole(userRole);
    setCurrentView('project');
  };

  const handleNavigateProjectsList = () => {
    setCurrentView('project_list');
  };

  const handleNavigateHome = () => {
    setCurrentView('project');
  };

  const handleNavigateSettings = () => {
    setCurrentView('settings');
  };

  const handleNavigateUpload = () => {
    setCurrentView('upload');
  };

  const handleOpenCanvas = (canvasId: string) => {
    setActiveCanvasId(canvasId);
    setCurrentView('canvas');
  };

  const handleSelectDocument = (documentId: string) => {
    setActiveDocumentId(documentId);
    setActiveFilename('');
    setCurrentView('report');
  };

  const handleUploadSuccess = (documentId: string, filename: string) => {
    setActiveDocumentId(documentId);
    setActiveFilename(filename);
    setCurrentView('report');
  };

  const handleAcceptInviteSuccess = (projectId: string, projectName: string) => {
    window.history.pushState({}, '', '/');
    setInviteToken(null);
    setActiveProjectId(projectId);
    setActiveProjectName(projectName);
    setActiveUserRole('editor');
    setCurrentView('project');
  };

  return (
    <>
      {currentView === 'accept_invite' && inviteToken && (
        <AcceptInvitePage
          inviteToken={inviteToken}
          onAcceptSuccess={handleAcceptInviteSuccess}
          onNavigateHome={() => {
            window.history.pushState({}, '', '/');
            setInviteToken(null);
            setCurrentView('project_list');
          }}
        />
      )}

      {currentView === 'project_list' && (
        <ProjectListPage onSelectProject={handleSelectProject} />
      )}

      {currentView === 'project' && (
        <ProjectPage
          projectId={activeProjectId}
          projectName={activeProjectName}
          userRole={activeUserRole}
          onNavigateUpload={handleNavigateUpload}
          onSelectDocument={handleSelectDocument}
          onOpenCanvas={handleOpenCanvas}
          onNavigateSettings={handleNavigateSettings}
          onNavigateProjectsList={handleNavigateProjectsList}
        />
      )}

      {currentView === 'settings' && (
        <ProjectSettingsPage
          projectId={activeProjectId}
          projectName={activeProjectName}
          userRole={activeUserRole}
          onNavigateBack={handleNavigateHome}
        />
      )}

      {currentView === 'upload' && (
        <UploadPage
          onUploadSuccess={handleUploadSuccess}
          onNavigateHome={handleNavigateHome}
        />
      )}

      {currentView === 'report' && activeDocumentId && (
        <ReportPage
          documentId={activeDocumentId}
          filename={activeFilename}
          onNavigateHome={handleNavigateHome}
          onNavigateUpload={handleNavigateUpload}
        />
      )}

      {currentView === 'canvas' && activeCanvasId && (
        <CanvasPage
          canvasId={activeCanvasId}
          onNavigateHome={handleNavigateHome}
          onSelectDocument={handleSelectDocument}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
