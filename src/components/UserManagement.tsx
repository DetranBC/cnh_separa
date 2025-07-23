import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Plus, Edit2, Trash2, User as UserIcon, Shield, Building, Users } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'cfc' as User['role'],
    cfcName: '',
    name: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(savedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setMessage('Erro ao carregar usuários');
      setMessageType('error');
    }
  };

  const saveUser = async () => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (editingUser) {
        const updatedUsers = savedUsers.map((user: User) => 
          user.id === editingUser.id 
            ? { ...user, ...formData, id: editingUser.id }
            : user
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setMessage('Usuário atualizado com sucesso');
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString()
        };
        savedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(savedUsers));
        setMessage('Usuário criado com sucesso');
      }
      setMessageType('success');
      loadUsers();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setMessage(error instanceof Error ? error.message : 'Erro ao salvar usuário');
      setMessageType('error');
    }
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = savedUsers.filter((user: User) => user.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setMessage('Usuário excluído com sucesso');
        setMessageType('success');
        loadUsers();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        setMessage('Erro ao excluir usuário');
        setMessageType('error');
      }
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: user.password,
        role: user.role,
        cfcName: user.cfcName || '',
        name: user.name,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'cfc',
        cfcName: '',
        name: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const getRoleLabel = (role: User['role']) => {
    const labels = {
      admin: 'Administrador',
      cfc: 'CFC',
      interno: 'Interno',
      operador: 'Operador',
    };
    return labels[role];
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'operador': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cfc': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'interno': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5" />;
      case 'operador': return <Users className="w-5 h-5" />;
      case 'cfc': return <Building className="w-5 h-5" />;
      case 'interno': return <UserIcon className="w-5 h-5" />;
      default: return <UserIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Gerenciamento de Usuários</h2>
            <p className="text-gray-600">Crie e gerencie usuários do sistema</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-500 hover:to-teal-600 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full border ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
                <p className="text-sm text-gray-600">@{user.username}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Perfil:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full border ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              {user.cfcName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">CFC:</span>
                  <span className="text-sm font-semibold text-gray-800">{user.cfcName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Criado em:</span>
                <span className="text-sm text-gray-800">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openModal(user)}
                className="flex-1 bg-stone-100/80 text-gray-700 px-4 py-2 rounded-xl hover:bg-stone-200/80 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              {user.role !== 'admin' && (
                <button
                  onClick={() => deleteUser(user.id)}
                  className="bg-rose-100 text-rose-700 px-4 py-2 rounded-xl hover:bg-rose-200 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-stone-200/50">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); saveUser(); }} className="space-y-6">
              {message && (
                <div className={`p-4 rounded-xl border-2 ${
                  messageType === 'success' 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50/80 border-rose-200 text-rose-800'
                }`}>
                  {message}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Usuário
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Perfil
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
                >
                  <option value="cfc">CFC</option>
                  <option value="interno">Interno</option>
                  <option value="operador">Operador</option>
                </select>
              </div>

              {formData.role === 'cfc' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome do CFC
                  </label>
                  <input
                    type="text"
                    value={formData.cfcName}
                    onChange={(e) => setFormData({ ...formData, cfcName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
                    required
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-white py-3 px-4 rounded-xl hover:from-emerald-500 hover:to-teal-600 transition-all duration-200 font-medium shadow-lg"
                >
                  {editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;