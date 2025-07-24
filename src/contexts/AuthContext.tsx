import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const loggedUser = localStorage.getItem('current_user');
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUser(userData);
      setRequirePasswordChange(userData.requirePasswordChange || false);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Tenta fazer login via API primeiro
      const response = await apiService.login(username, password);
      setUser(response);
      setRequirePasswordChange(response.requirePasswordChange || false);
      return true;
    } catch (error) {
      console.log('Login via API falhou, tentando credenciais locais...');
    }
    
    // Verificar credenciais hardcoded
    if (username === 'vini' && password === '328624') {
      const userData = {
        id: '1',
        username: 'vini',
        role: 'admin',
        cfcName: '',
        name: 'Administrador',
        requirePasswordChange: false
      };
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      setRequirePasswordChange(false);
      return true;
    }
    
    // Verificar outros usuários salvos no localStorage
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = savedUsers.find((u: any) => u.username === username && u.password === password);
    
    if (foundUser) {
      const userData = {
        id: foundUser.id,
        username: foundUser.username,
        role: foundUser.role,
        cfcName: foundUser.cfcName,
        name: foundUser.name,
        requirePasswordChange: foundUser.requirePasswordChange || false
      };
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      setRequirePasswordChange(userData.requirePasswordChange);
      return true;
    }
    
    return false;
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return false;
    
    try {
      // Atualiza via API se possível
      await apiService.updateUser(user.id, { password: newPassword });
    } catch (error) {
      console.log('Erro ao atualizar via API, atualizando localmente...');
    }
    
    // Atualiza localmente
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = savedUsers.map((u: any) => 
      u.id === user.id 
        ? { ...u, password: newPassword, requirePasswordChange: false }
        : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Atualiza o usuário atual
    const updatedUser = { ...user, requirePasswordChange: false };
    setUser(updatedUser);
    localStorage.setItem('current_user', JSON.stringify(updatedUser));
    setRequirePasswordChange(false);
    
    return true;
  };
  const logout = () => {
    setUser(null);
    setRequirePasswordChange(false);
    localStorage.removeItem('current_user');
    apiService.logout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      requirePasswordChange, 
      updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};