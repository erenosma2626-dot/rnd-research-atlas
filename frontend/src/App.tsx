import { useState } from 'react';
import { ProjectPage } from './pages/ProjectPage';
import { ReportPage } from './pages/ReportPage';
import { UploadPage } from './pages/UploadPage';
import { ThemeProvider } from './theme/ThemeContext';

export function App() {
  const [currentView, setCurrentView] = useState<'project' | 'upload' | 'report'>('project');
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>('');

  const handleNavigateHome = () => {
    setCurrentView('project');
  };

  const handleNavigateUpload = () => {
    setCurrentView('upload');
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
    <ThemeProvider>
      {currentView === 'project' && (
        <ProjectPage
          onNavigateUpload={handleNavigateUpload}
          onSelectDocument={handleSelectDocument}
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
    </ThemeProvider>
  );
}

export default App;
