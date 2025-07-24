import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lote, LoteItem } from '../types';
import { Search, Eye, Package, Clock, CheckCircle, Filter, Users, FileText } from 'lucide-react';
import { apiService } from '../services/api';

// Função para vincular nomes aos CFCs baseado em dados históricos
const linkNameToCfc = (nome: string): string | null => {
  const savedLotes = JSON.parse(localStorage.getItem('lotes') || '[]');
  
  // Procura em todos os lotes por esse nome e retorna o CFC mais comum
  const cfcMatches: { [key: string]: number } = {};
  
  savedLotes.forEach((lote: any) => {
    lote.items?.forEach((item: any) => {
      if (item.nome?.toLowerCase().includes(nome.toLowerCase()) && item.cfc) {
        cfcMatches[item.cfc] = (cfcMatches[item.cfc] || 0) + 1;
      }
    });
  });
  
  // Retorna o CFC com mais ocorrências
  const mostCommonCfc = Object.keys(cfcMatches).reduce((a, b) => 
    cfcMatches[a] > cfcMatches[b] ? a : b, null
  );
  
  return mostCommonCfc;
};

// Função para normalizar nomes de CFC para comparação
const normalizeCfc = (cfc: string | null | undefined): string => {
  if (!cfc) return '';
  return cfc.toLowerCase().trim();
};

const LoteDashboard: React.FC = () => {
  const { user } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [filteredLotes, setFilteredLotes] = useState<Lote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

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
  }, [lotes, searchTerm, statusFilter, tipoFilter, user]);

  const loadLotes = async () => {
    try {
      const response = await apiService.getLotes();
      console.log(response);
      const data = response || [];
      setLotes(data);
    } catch(err){ 
      alert("Deu erro ao pegar os lotes do servidor" + err)
    }
  };

  const filterLotes = () => {
    let filtered = lotes;

    // Filtro por perfil de usuário
    if (user?.role === 'cfc') {
      filtered = filtered.map(lote => ({
        ...lote,
        items: lote.items.filter(item => {
          // Verifica se o item tem CFC direto ou se o nome está vinculado ao CFC do usuário
          const itemCfc = item.cfc || linkNameToCfc(item.nome);
          return normalizeCfc(itemCfc) === normalizeCfc(user.cfcName);
        })
      })).filter(lote => lote.items.length > 0);
    }

    // Filtro por busca melhorado
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(lote => {
        // Busca exata por número do lote
        const loteMatch = lote.numero.toLowerCase().includes(searchLower);
        
        // Busca exata por nome (apenas nos itens visíveis para o usuário)
        const visibleItems = user?.role === 'cfc' 
          ? lote.items.filter(item => 
              item.cfc && item.cfc.toLowerCase().includes(user.cfcName?.toLowerCase() || '')
            )
          : lote.items;
        
        const nameMatch = visibleItems.some(item => 
          item.nome.toLowerCase().includes(searchLower)
        );
        
        return loteMatch || nameMatch;
      });
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lote => lote.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'all') {
      filtered = filtered.filter(lote => lote.tipo === tipoFilter);
    }

    setFilteredLotes(filtered);
  };

  const updateLoteStatus = async (loteId: string, newStatus: Lote['status']) => {
    if (user?.role !== 'operador') return;

    const updatedLotes = lotes.map(lote => {
      if (lote.id === loteId) {
        return {
          ...lote,
          status: newStatus,
          atualizadoPor: user?.name || '',
          atualizadoEm: new Date().toISOString(),
        };
      }
      return lote;
    });
    
    setLotes(updatedLotes);
    localStorage.setItem('lotes', JSON.stringify(updatedLotes));
    window.dispatchEvent(new CustomEvent('loteUpdated'));
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

  const handleLoteClick = (lote: Lote) => {
    setSelectedLote(lote);
  };

  const canSeeWhoOpened = () => {
    return user?.role === 'admin' || user?.role === 'operador';
  };

  const canChangeStatus = () => {
    return user?.role === 'operador';
  };

  const getVisibleItems = (items: LoteItem[]) => {
    if (user?.role === 'cfc') {
      return items.filter(item => {
        const itemCfc = item.cfc || linkNameToCfc(item.nome);
        return normalizeCfc(itemCfc) === normalizeCfc(user.cfcName);
      });
    }
    return items;
  };

  const groupItemsByCfc = (items: LoteItem[]) => {
    const grouped: { [key: string]: LoteItem[] } = {};
    
    items.forEach(item => {
      const key = item.cfc || 'Particular';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    return grouped;
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard de Lotes</h2>
        <p className="text-gray-600">Gerencie e visualize os lotes de CNH e PID</p>
      </div>

      {/* Filtros */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por número do lote ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="recebido">Recebido</option>
                <option value="em_separacao">Em Separação</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
              >
                <option value="all">Todos os Tipos</option>
                <option value="CNH">CNH</option>
                <option value="PID">PID</option>
              </select>
            </div>
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
              onClick={() => handleLoteClick(lote)}
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
                    {getVisibleItems(lote.items).length} itens
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">Criado em:</span>
                  <p className="font-semibold text-gray-800">
                    {new Date(lote.criadoEm).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {canSeeWhoOpened() && (
                  <div>
                    <span className="text-gray-500 font-medium">Criado por:</span>
                    <p className="font-semibold text-gray-800">{lote.criadoPor}</p>
                  </div>
                )}
                {lote.pdfFileName && (
                  <div>
                    <span className="text-gray-500 font-medium">Arquivo:</span>
                    <p className="font-semibold text-gray-800 truncate">{lote.pdfFileName}</p>
                  </div>
                )}
              </div>

              {canChangeStatus() && (
                <div className="mt-4 pt-4 border-t border-stone-200/50 flex gap-2">
                  {lote.status === 'pendente' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLoteStatus(lote.id, 'em_separacao');
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Iniciar Separação
                    </button>
                  )}
                  {lote.status === 'em_separacao' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLoteStatus(lote.id, 'recebido');
                      }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium"
                    >
                      Marcar como Recebido
                    </button>
                  )}
                </div>
              )}
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
                    {getVisibleItems(selectedLote.items).length} itens
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
                {canSeeWhoOpened() && (
                  <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/50">
                    <span className="text-sm text-gray-500 font-medium">Criado por:</span>
                    <p className="font-semibold text-gray-800 mt-2">{selectedLote.criadoPor}</p>
                  </div>
                )}
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/50">
                  <span className="text-sm text-gray-500 font-medium">Total de itens:</span>
                  <p className="font-semibold text-gray-800 mt-2">{getVisibleItems(selectedLote.items).length}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold mb-6 text-gray-800">Itens do Lote</h4>
                <div className="space-y-6">
                  {Object.entries(groupItemsByCfc(getVisibleItems(selectedLote.items))).map(([cfcName, items]) => (
                    <div key={cfcName} className="bg-stone-50/80 rounded-2xl border border-stone-200/50">
                      <div className="p-4 border-b border-stone-200/50 bg-stone-100/80 rounded-t-2xl">
                        <h5 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          {cfcName} ({items.length} itens)
                        </h5>
                      </div>
                      <div className="p-4">
                        <div className="grid gap-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-4 bg-white/80 rounded-xl border border-stone-200/50 hover:border-emerald-300 transition-colors"
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
    </div>
  );
};

export default LoteDashboard;