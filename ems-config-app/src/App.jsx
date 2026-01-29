import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DeviceModelWizard from './pages/DeviceModelWizard';
import ProjectConfigWizard from './pages/ProjectConfigWizard';
import ProjectList from './pages/ProjectList';
import DeviceModelList from './pages/DeviceModelList';
import TemplateManager from './pages/TemplateManager';
import DataMonitor from './pages/DataMonitor';
import DebugTools from './pages/DebugTools';
import SystemMaintenance from './pages/SystemMaintenance';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageTitle, setPageTitle] = useState('系统概览');

  const handleNavigate = (page, title) => {
    setCurrentPage(page);
    setPageTitle(title);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'device-model-wizard':
        return <DeviceModelWizard onNavigate={handleNavigate} />;
      case 'project-config-wizard':
        return <ProjectConfigWizard onNavigate={handleNavigate} />;
      case 'project-list':
        return <ProjectList onNavigate={handleNavigate} />;
      case 'device-model-list':
        return <DeviceModelList onNavigate={handleNavigate} />;
      case 'template-manager':
        return <TemplateManager onNavigate={handleNavigate} />;
      case 'data-monitor':
        return <DataMonitor onNavigate={handleNavigate} />;
      case 'debug-tools':
        return <DebugTools onNavigate={handleNavigate} />;
      case 'system-maintenance':
        return <SystemMaintenance onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="main-content">
        <Header title={pageTitle} onNavigate={handleNavigate} />
        <div className="main-body">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
