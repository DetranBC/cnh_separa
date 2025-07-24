import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lote } from '../types';
import { 
  Search, 
  Filter, 
  Users, 
  FileText, 
  Calendar,
  User,
  Package,
  Clock,
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';
import { apiService } from '../services/api';

const Relatorios: React.FC = () => {
  const { user } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [filteredLotes, setFilteredLotes] = useState<Lote[]>([]);
  const [activeTab, setActiveTab] = useState<'CNH' | 'PID'>('CNH');
  const [searchTerm, setSearchTerm] = useState('');
  const [cfcFilter, setCfcFilter] = useState<string>('all');
  const [operadorFilter, setOperadorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dataFilter, setDataFilter] = useState<string>('');
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [availableCfcs, setAvailableCfcs] = useState<string[]>([]);
  const [availableOperadores, setAvailableOperadores] = useState<string[]>([]);

  useEffect(() => {
    loadLotes();
    
    const handleLoteUpdate = () => {
      loadLotes();
    };

    window.addEventListener('loteUpdated', handleLoteUpdate);
    return () => window.removeEventListener('loteUpdated', handleLoteUpdate);
  }, []);

  useEffect(() => {
    filterLotes();
    extractFilters();
  }, [lotes, searchTerm, cfcFilter, operadorFilter, statusFilter, dataFilter]);

  const loadLotes = async () => {
    try {
      const response = await apiService.getLotes();
      const data = JSON.parse(response.data || "[]");
      setLotes(data);
    } catch(err){ 
      alert("Deu erro ao pegar os lotes do servidor" + err)
    }
  };

  const extractFilters = () => {
    // Extrai CFCs únicos
    const cfcs = new Set<string>();
    lotes.forEach(lote => {
      lote.items.forEach(item => {
        if (item.cfc) cfcs.add(item.cfc);
      });
    });
    setAvailableCfcs(Array.from(cfcs).sort());

    // Extrai operadores únicos
    const operadores = new Set<string>();
    lotes.forEach(lote => {
      if (lote.criadoPor) operadores.add(lote.criadoPor);
      if (lote.atualizadoPor) operadores.add(lote.atualizadoPor);
    });
    setAvailableOperadores(Array.from(operadores).sort());
  };

  const filterLotes = () => {
    let filtered = lotes;

    // Filtro por tipo (CNH/PID)
    filtered = filtered.filter(lote => lote.tipo === activeTab);

    // Filtro por perfil de usuário (apenas para CNH)
    if (user?.role === 'cfc' && activeTab === 'CNH') {
      filtered = filtered.map(lote => ({
        ...lote,
        items: lote.items.filter(item => {
          const itemCfc = item.cfc || linkNameToCfc(item.nome);
          return normalizeCfc(itemCfc ?? undefined) === normalizeCfc(user.cfcName);
        })
      })).filter(lote => lote.items.length > 0);
    }

    // Filtro por busca (nome ou número do lote)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(lote => {
        const loteMatch = lote.numero.toLowerCase().includes(searchLower);
        const nameMatch = lote.items.some(item =>
          item.nome.toLowerCase().includes(searchLower)
        );
        return loteMatch || nameMatch;
      });
    }

    // Filtro por CFC
    if (cfcFilter !== 'all') {
      if (cfcFilter === 'particular') {
        filtered = filtered.filter(lote => 
          lote.items.some(item => !item.cfc)
        );
      } else {
        filtered = filtered.filter(lote =>
          lote.items.some(item => item.cfc === cfcFilter)
        );
      }
    }

    // Filtro por operador
    if (operadorFilter !== 'all') {
      filtered = filtered.filter(lote =>
        lote.criadoPor === operadorFilter || lote.atualizadoPor === operadorFilter
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lote => lote.status === statusFilter);
    }

    // Filtro por data
    if (dataFilter) {
      const filterDate = new Date(dataFilter);
      filtered = filtered.filter(lote => {
        const loteDate = new Date(lote.criadoEm);
        return loteDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredLotes(filtered);
  };

  // Função para vincular nomes aos CFCs
  const linkNameToCfc = (nome: string): string | null => {
    const cfcMatches: { [key: string]: number } = {};
    
    lotes.forEach((lote) => {
      lote.items?.forEach((item) => {
        if (item.nome?.toLowerCase().includes(nome.toLowerCase()) && item.cfc) {
          cfcMatches[item.cfc] = (cfcMatches[item.cfc] || 0) + 1;
        }
      });
    });
    
    const mostCommonCfc = Object.keys(cfcMatches).reduce((a, b) => 
      cfcMatches[a] > cfcMatches[b] ? a : b, null
    );
    
    return mostCommonCfc;
  };

  const normalizeCfc = (cfc?: string) =>
    cfc?.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim() || '';

  const changePassword = () => {
    if (!newPassword.trim()) return;
    
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = savedUsers.map((u: any) => 
      u.username === user?.username ? { ...u, password: newPassword } : u
    );
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Atualiza também o usuário atual se for o admin hardcoded
    if (user?.username === 'vini') {
      // Para o admin hardcoded, apenas mostra mensagem de sucesso
      alert('Senha alterada com sucesso!');
    }
    
    setNewPassword('');
    setShowPasswordModal(false);
    alert('Senha alterada com sucesso!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'recebido': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'em_separacao': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'recebido': return 'Recebido';
      case 'em_separacao': return 'Em Separação';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'recebido': return <CheckCircle className="w-4 h-4" />;
      case 'em_separacao': return <Package className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'PID' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const groupItemsByCfc = (items: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    items.forEach(item => {
      const key = item.cfc || 'Particular';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Relatórios Completos</h2>
            <p className="text-gray-600">Visualize todos os lotes com filtros avançados</p>
          </div>
          {user?.role === 'cfc' && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
            >
              <Settings className="w-4 h-4" />
              Alterar Senha
            </button>
          )}
        </div>
      </div>

      {/* Abas CNH/PID */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-200/50">
        <div className="flex border-b border-stone-200/50">
          <button
            onClick={() => setActiveTab('CNH')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'CNH'
                ? 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-500'
                : 'text-gray-600 hover:text-gray-800 hover:bg-stone-50'
            }`}
          >
            CNH
          </button>
          <button
            onClick={() => setActiveTab('PID')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'PID'
                ? 'bg-rose-100 text-rose-700 border-b-2 border-rose-500'
                : 'text-gray-600 hover:text-gray-800 hover:bg-stone-50'
            }`}
          >
            PID
          </button>
        </div>
      </div>

      {/* Filtros Avançados */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar lote ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm bg-white/70"
            />
          </div>

          {/* Filtro CFC */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <select
              value={cfcFilter}
              onChange={(e) => setCfcFilter(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm bg-white/70"
            >
              <option value="all">Todos os CFCs</option>
              <option value="particular">Particular</option>
              {availableCfcs.map(cfc => (
                <option key={cfc} value={cfc}>{cfc}</option>
              ))}
            </select>
          </div>

          {/* Filtro Operador */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <select
              value={operadorFilter}
              onChange={(e) => setOperadorFilter(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm bg-white/70"
            >
              <option value="all">Todos os Operadores</option>
              {availableOperadores.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm bg-white/70"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="em_separacao">Em Separação</option>
              <option value="recebido">Recebido</option>
            </select>
          </div>

          {/* Filtro Data */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dataFilter}
              onChange={(e) => setDataFilter(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm bg-white/70"
            />
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{filteredLotes.length}</div>
            <div className="text-sm text-gray-600">Total de Lotes</div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {filteredLotes.filter(l => l.status === 'pendente').length}
            </div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredLotes.filter(l => l.status === 'em_separacao').length}
            </div>
            <div className="text-sm text-gray-600">Em Separação</div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {filteredLotes.filter(l => l.status === 'recebido').length}
            </div>
            <div className="text-sm text-gray-600">Recebidos</div>
          </div>
        </div>
      </div>

      {/* Lista de Lotes */}
      <div className="grid gap-6">
        {filteredLotes.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-stone-200/50">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum lote encontrado</p>
          </div>
        ) : (
          filteredLotes.map((lote) => (
            <div
              key={lote.id}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border border-stone-200/50 hover:border-emerald-300"
              onClick={() => setSelectedLote(lote)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      Lote {lote.numero}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTipoColor(lote.tipo)}`}>
                      {lote.tipo}
                    </span>
                  </div>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {lote.items.length} itens
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border ${getStatusColor(lote.status)}`}>
                    {getStatusIcon(lote.status)}
                    {getStatusLabel(lote.status)}
                  </span>
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">Criado em:</span>
                  <p className="font-semibold text-gray-800">
                    {new Date(lote.criadoEm).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Criado por:</span>
                  <p className="font-semibold text-gray-800">{lote.criadoPor}</p>
                </div>
                {lote.atualizadoEm && (
                  <div>
                    <span className="text-gray-500 font-medium">Última alteração:</span>
                    <p className="font-semibold text-gray-800">
                      {new Date(lote.atualizadoEm).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {lote.atualizadoPor && (
                  <div>
                    <span className="text-gray-500 font-medium">Alterado por:</span>
                    <p className="font-semibold text-gray-800">{lote.atualizadoPor}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedLote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200/50">
            <div className="p-8 border-b border-stone-200/50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Lote {selectedLote.numero}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTipoColor(selectedLote.tipo)}`}>
                      {selectedLote.tipo}
                    </span>
                  </div>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {selectedLote.items.length} itens
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLote(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 hover:bg-stone-100/80 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/50">
                  <span className="text-sm text-gray-500 font-medium">Status:</span>
                  <div className={`mt-2 px-3 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 border ${getStatusColor(selectedLote.status)}`}>
                    {getStatusIcon(selectedLote.status)}
                    {getStatusLabel(selectedLote.status)}
                  </div>
                </div>
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/50">
                  <span className="text-sm text-gray-500 font-medium">Criado em:</span>
                  <p className="font-semibold text-gray-800 mt-2">
                    {new Date(selectedLote.criadoEm).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/50">
                  <span className="text-sm text-gray-500 font-medium">Criado por:</span>
                  <p className="font-semibold text-gray-800 mt-2">{selectedLote.criadoPor}</p>
                </div>
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/50">
                  <span className="text-sm text-gray-500 font-medium">Total de itens:</span>
                  <p className="font-semibold text-gray-800 mt-2">{selectedLote.items.length}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold mb-6 text-gray-800">Itens do Lote</h4>
                <div className="space-y-6">
                  {Object.entries(groupItemsByCfc(selectedLote.items)).map(([cfcName, items]) => (
                    <div key={cfcName} className="bg-stone-50/80 rounded-2xl border border-stone-200/50">
                      <div className="p-4 border-b border-stone-200/50 bg-stone-100/80 rounded-t-2xl">
                        <h5 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          {cfcName} ({items.length} itens)
                        </h5>
                      </div>
                      <div className="p-4">
                        <div className="grid gap-3">
                          {items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-4 bg-white/80 rounded-xl border border-stone-200/50"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{item.nome}</p>
                                <p className="text-sm text-gray-600">
                                  {item.numeroDocumento}
                                </p>
                              </div>
                              <div className={`text-sm font-semibold px-2 py-1 rounded border ${getTipoColor(item.tipo)}`}>
                                {item.tipo}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-stone-200/50">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Alterar Senha</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
                  placeholder="Digite a nova senha"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={changePassword}
                  className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-white py-3 px-4 rounded-xl hover:from-emerald-500 hover:to-teal-600 transition-all duration-200 font-medium shadow-lg"
                >
                  Alterar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Relatorios;