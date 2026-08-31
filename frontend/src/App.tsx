import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { DEFAULT_PROJECT_ID } from './api/client';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { CanvasPage } from './pages/CanvasPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PlanningPage } from './pages/PlanningPage';
import { ProjectListPage } from './pages/ProjectListPage';
import { ProjectPage } from './pages/ProjectPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { ReportPage } from './pages/ReportPage';
import { UploadPage } from './pages/UploadPage';
import { ThemeProvider } from './theme/ThemeContext';

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  // Unauthenticated routing: 'landing' or 'login'
  const [unauthView, setUnauthView] = useState<'landing' | 'login'>(() => {
    const path = window.location.pathname;
    return path === '/login' ? 'login' : 'landing';
  });

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
    'project_list' | 'project' | 'settings' | 'upload' | 'report' | 'plan' | 'canvas' | 'accept_invite'
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
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white">
        <div className="text-xs text-black/50 dark:text-white/50 font-mono animate-pulse">
          Oturum kontrol ediliyor...
        </div>
      </div>
    );
  }

  // 1. Ziyaretçi (Giriş Yapılmamış) Durumu:
  if (!user) {
    if (inviteToken) {
      return (
        <AcceptInvitePage
          inviteToken={inviteToken}
          onAcceptSuccess={(projectId, projectName) => {
            window.history.pushState({}, '', '/');
            setInviteToken(null);
            setActiveProjectId(projectId);
            setActiveProjectName(projectName);
            setActiveUserRole('editor');
            setCurrentView('project');
          }}
          onNavigateHome={() => {
            window.history.pushState({}, '', '/');
            setInviteToken(null);
            setUnauthView('landing');
          }}
        />
      );
    }

    if (unauthView === 'login') {
      return (
        <LoginPage
          onNavigateHome={() => {
            window.history.pushState({}, '', '/');
            setUnauthView('landing');
          }}
        />
      );
    }

    return (
      <LandingPage
        onNavigateLogin={() => {
          window.history.pushState({}, '', '/login');
          setUnauthView('login');
        }}
      />
    );
  }

  // 2. Giriş Yapmış Kullanıcı (Uygulama İçi Rotalar):
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
          projectId={activeProjectId}
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
          onNavigatePlan={(docId) => {
            setActiveDocumentId(docId);
            setCurrentView('plan');
          }}
        />
      )}

      {currentView === 'plan' && activeDocumentId && (
        <PlanningPage
          documentId={activeDocumentId}
          onNavigateBack={handleNavigateHome}
          onPlanApproved={(docId) => {
            setActiveDocumentId(docId);
            setCurrentView('report');
          }}
        />
      )}

      {currentView === 'canvas' && activeCanvasId && (
        <CanvasPage
          canvasId={activeCanvasId}
          projectId={activeProjectId}
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
