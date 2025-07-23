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

  useEffect(() => {
    // Check if user is logged in
    const loggedUser = localStorage.getItem('current_user');
    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Verificar credenciais hardcoded
    if (username === 'vini' && password === '328624') {
      const userData = {
        id: '1',
        username: 'vini',
        role: 'admin',
        cfcName: '',
        name: 'Administrador'
      };
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
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
        name: foundUser.name
      };
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};