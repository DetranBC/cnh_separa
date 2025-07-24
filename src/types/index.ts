export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'cfc' | 'interno' | 'operador';
  cfcName?: string;
  name: string;
  createdAt: string;
  requirePasswordChange?: boolean;
}

export interface LoteItem {
  id: string;
  nome: string;
  cfc: string | null;
  tipo: 'CNH' | 'PID';
  numeroDocumento: string;
}

export interface Lote {
  id: string;
  numero: string;
  tipo: 'CNH' | 'PID';
  status: 'pendente' | 'recebido' | 'em_separacao';
  criadoPor: string;
  criadoEm: string;
  atualizadoPor?: string;
  atualizadoEm?: string;
  items: LoteItem[];
  pdfFileName?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  requirePasswordChange: boolean;
  updatePassword: (newPassword: string) => Promise<boolean>;
}