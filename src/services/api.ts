// Configuração da API para conectar com o servidor local
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://10.121.202.145:3001/api' 
  : 'http://localhost:3001/api';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro na requisição');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  // Autenticação
  async login(username: string, password: string) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    
    return response.user;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  // Usuários
  async getUsers() {
    return await this.request('/users');
  }

  async createUser(userData: any) {
    return await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return await this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return await this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Lotes
  async getLotes() {
    return await this.request('/lotes');
  }

  async createLote(loteData: any, pdfFile?: File) {
    const formData = new FormData();
    formData.append('loteData', JSON.stringify(loteData));
    
    if (pdfFile) {
      formData.append('pdf', pdfFile);
    }

    const response = await fetch(`${this.baseUrl}/lotes`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }

    return await response.json();
  }

  async updateLoteStatus(id: string, status: string) {
    return await this.request(`/lotes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Informações do servidor
  async getServerInfo() {
    return await this.request('/server-info');
  }
}

export const apiService = new ApiService();