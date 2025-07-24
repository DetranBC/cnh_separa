import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import UserManagement from './components/UserManagement';
import LoteUpload from './components/LoteUpload';
import LoteDashboard from './components/LoteDashboard';
import LoteSeparacao from './components/LoteSeparacao';
import Relatorios from './components/Relatorios';
import PasswordChangeModal from './components/PasswordChangeModal';

const AppContent: React.FC = () => {
  const { user, isLoading, requirePasswordChange } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Se o usuário precisa trocar a senha obrigatoriamente
  if (requirePasswordChange) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100">
        <PasswordChangeModal 
          isOpen={true} 
          onClose={() => {}} 
          isRequired={true} 
        />
      </div>
    );
  }
  const renderContent = () => {
    switch (currentView) {
      case 'relatorios':
        return <Relatorios />;
      case 'users':
        return <UserManagement />;
      case 'upload':
        return <LoteUpload />;
      case 'separacao':
        return <LoteSeparacao />;
      case 'dashboard':
      default:
        return <LoteDashboard />;
    }
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onShowPasswordModal={() => setShowPasswordModal(true)}
      >
        {renderContent()}
      </Layout>
      
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
        isRequired={false} 
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;