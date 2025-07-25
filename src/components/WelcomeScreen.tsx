import React from 'react';
import { User, Upload, BarChart3, Users, FileText, Settings } from 'lucide-react';

interface WelcomeScreenProps {
  user: any;
  onNavigate: (section: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onNavigate }) => {
  const isAdmin = user?.role === 'admin';
  const isCFC = user?.role === 'cfc';

  const adminButtons = [
    { id: 'upload', label: 'Upload de Lotes', icon: Upload, color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'dashboard', label: 'Dashboard de Lotes', icon: BarChart3, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'separacao', label: 'Separação de Lotes', icon: FileText, color: 'bg-purple-500 hover:bg-purple-600' },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3, color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'users', label: 'Gerenciar Usuários', icon: Users, color: 'bg-red-500 hover:bg-red-600' },
  ];

  const cfcButtons = [
    { id: 'dashboard', label: 'Meus Lotes', icon: BarChart3, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'relatorios', label: 'Relatórios', icon: FileText, color: 'bg-orange-500 hover:bg-orange-600' },
  ];

  const buttons = isAdmin ? adminButtons : cfcButtons;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header de Boas-vindas */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
              <FileText className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Bem-vindo ao Sistema de Gestão CNH
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Olá, <span className="font-semibold text-blue-600">{user?.username}</span>!
          </p>
          <p className="text-lg text-gray-500">
            {isAdmin ? 'Painel Administrativo' : 'Painel do CFC'}
          </p>
        </div>

        {/* Botões de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {buttons.map((button) => {
            const IconComponent = button.icon;
            return (
              <button
                key={button.id}
                onClick={() => onNavigate(button.id)}
                className={`${button.color} text-white p-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl group`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white bg-opacity-20 rounded-full group-hover:bg-opacity-30 transition-all duration-200">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <span className="text-lg font-semibold text-center">
                    {button.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Informações do Sistema */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Informações do Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Usuário:</span>
                <br />
                {user?.username}
              </div>
              <div>
                <span className="font-medium">Perfil:</span>
                <br />
                {isAdmin ? 'Administrador' : 'CFC'}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <br />
                <span className="text-green-600 font-medium">Conectado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Sistema de Gestão de CNH - Versão 1.0</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;