import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Users, 
  Upload, 
  BarChart3, 
  Package, 
  Menu,
  X,
  FileText
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'cfc', 'interno', 'operador'] },
    { id: 'upload', label: 'Novo Lote', icon: Upload, roles: ['admin', 'operador'] },
    { id: 'separacao', label: 'Separação', icon: Package, roles: ['operador'] },
    { id: 'users', label: 'Usuários', icon: Users, roles: ['admin'] },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const handleLogout = () => {
    logout();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'operador': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cfc': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'interno': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'operador': return 'Operador';
      case 'cfc': return 'CFC';
      case 'interno': return 'Interno';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-stone-200/50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-xl hover:bg-stone-100/80 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Seu Logo</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-gray-800">{user?.name}</div>
              <div className={`text-xs px-2 py-1 rounded-full border font-medium ${getRoleColor(user?.role || '')}`}>
                {getRoleLabel(user?.role || '')}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-sm shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-stone-200/50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-6 border-b border-stone-200/50 lg:hidden">
            <span className="text-xl font-bold text-gray-800">Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-xl hover:bg-stone-100/80"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="mt-6 lg:mt-6">
            <ul className="space-y-3 px-6">
              {visibleMenuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium
                      ${currentView === item.id 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg transform scale-105' 
                        : 'text-gray-700 hover:bg-stone-100/80 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Overlay para mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-8 lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;