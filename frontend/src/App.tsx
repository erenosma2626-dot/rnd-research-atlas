import { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { CanvasPage } from './pages/CanvasPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectPage } from './pages/ProjectPage';
import { ReportPage } from './pages/ReportPage';
import { SignupPage } from './pages/SignupPage';
import { UploadPage } from './pages/UploadPage';
import { ThemeProvider } from './theme/ThemeContext';

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  const [currentView, setCurrentView] = useState<'project' | 'upload' | 'report' | 'canvas'>('project');
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>('');
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);

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

  const handleNavigateHome = () => {
    setCurrentView('project');
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

  return (
    <>
      {currentView === 'project' && (
        <ProjectPage
          onNavigateUpload={handleNavigateUpload}
          onSelectDocument={handleSelectDocument}
          onOpenCanvas={handleOpenCanvas}
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
