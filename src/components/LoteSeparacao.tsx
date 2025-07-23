import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lote, LoteItem } from '../types';
import { Package, CheckCircle, Search, Filter, Users, ArrowLeft, FileText, Clock } from 'lucide-react';

const normalizeCfc = (cfc?: string) =>
  cfc?.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim() || '';

// Função para vincular nomes aos CFCs
const linkNameToCfc = (nome: string): string | null => {
  const savedLotes = JSON.parse(localStorage.getItem('lotes') || '[]');
  const cfcMatches: { [key: string]: number } = {};
  
  savedLotes.forEach((lote: any) => {
    lote.items?.forEach((item: any) => {
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

const LoteSeparacao: React.FC = () => {
  const { user } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cfcFilter, setCfcFilter] = useState<string>('all');
  const [availableCfcs, setAvailableCfcs] = useState<string[]>([]);

  useEffect(() => {
    loadLotes();
    
    const handleLoteUpdate = () => {
      loadLotes();
    };

    window.addEventListener('loteUpdated', handleLoteUpdate);
    return () => window.removeEventListener('loteUpdated', handleLoteUpdate);
  }, []);

  useEffect(() => {
    if (selectedLote && user?.role !== 'cfc') {
      const cfcs = Array.from(new Set(selectedLote.items.map(item => item.cfc).filter(Boolean)));
      setAvailableCfcs(cfcs as string[]);
    }
  }, [selectedLote, user]);

  const loadLotes = () => {
    const savedLotes = JSON.parse(localStorage.getItem('lotes') || '[]');
    let filteredLotes = savedLotes;
    
    // Se for CFC, filtrar apenas lotes que contenham itens do seu CFC
    if (user?.role === 'cfc') {
      filteredLotes = savedLotes
        .map((lote: Lote) => ({
          ...lote,
          items: lote.items.filter((item: LoteItem) => {
            const itemCfc = item.cfc || linkNameToCfc(item.nome);
            return normalizeCfc(itemCfc) === normalizeCfc(user.cfcName);
          })
        }))
        .filter((lote: Lote) => lote.items.length > 0);
    }
    
    setLotes(filteredLotes);
  };

  const updateLoteStatus = (loteId: string, newStatus: Lote['status']) => {
    const savedLotes = JSON.parse(localStorage.getItem('lotes') || '[]');
    const updatedLotes = savedLotes.map((lote: Lote) => {
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
    
    localStorage.setItem('lotes', JSON.stringify(updatedLotes));
    loadLotes(); // Recarrega os lotes
    
    // Atualiza o lote selecionado se necessário
    if (selectedLote && selectedLote.id === loteId) {
      const updatedLote = updatedLotes.find((lote: Lote) => lote.id === loteId);
      if (updatedLote) {
        setSelectedLote(updatedLote);
      }
    }
    
    window.dispatchEvent(new CustomEvent('loteUpdated'));
  };

  const startSeparation = (lote: Lote) => {
    setSelectedLote(lote);
    updateLoteStatus(lote.id, 'em_separacao');
  };

  const finalizeSeparation = () => {
    if (selectedLote) {
      updateLoteStatus(selectedLote.id, 'recebido');
      setSelectedLote(null);
    }
  };
    

  const getFilteredItems = () => {
    if (!selectedLote) return [];
    
    let items = selectedLote.items;
    const searchLower = searchTerm.toLowerCase();
    
    // Filtro por busca melhorado - busca exata
    if (searchTerm.trim()) {
      items = items.filter(item =>
        item.nome.toLowerCase().includes(searchLower) ||
        item.numeroDocumento?.toLowerCase().includes(searchLower) ||
        selectedLote.numero.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por CFC
    if (cfcFilter !== 'all') {
      if (cfcFilter === 'particular') {
        items = items.filter(item => !item.cfc);
      } else {
        items = items.filter(item => item.cfc === cfcFilter);
      }
    }
    
    return items;
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

  const detectLoteFromB2 = (numero: string): 'CNH' | 'PID' => {
    const firstChar = numero.charAt(0).toUpperCase();
    return firstChar === 'P' ? 'PID' : 'CNH';
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'PID' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'recebido': return <CheckCircle className="w-4 h-4" />;
      case 'em_separacao': return <Package className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const canChangeStatus = () => user?.role === 'operador';

  if (selectedLote) {
    const filteredItems = getFilteredItems();
    const groupedItems = groupItemsByCfc(filteredItems);
    const totalItems = selectedLote.items.length;
    const cfcItems = selectedLote.items.filter(item => item.cfc).length;
    const particularItems = selectedLote.items.filter(item => !item.cfc).length;

    return (
      <div className="space-y-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-3xl font-bold text-gray-800">
                  {user?.role === 'cfc' ? 'Visualização' : 'Separação'} do Lote {selectedLote.numero}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTipoColor(selectedLote.tipo)}`}>
                  {selectedLote.tipo}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1 ${getStatusColor(selectedLote.status)}`}>
                  {getStatusIcon(selectedLote.status)}
                  {getStatusLabel(selectedLote.status)}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Total: {user?.role === 'cfc' ? filteredItems.length : totalItems}
                </span>
                {user?.role !== 'cfc' && (
                  <>
                    <span>CFCs: {cfcItems}</span>
                    <span>Particulares: {particularItems}</span>
                  </>
                )}
                {selectedLote.atualizadoPor && (
                  <span>Última alteração: {selectedLote.atualizadoPor} em {new Date(selectedLote.atualizadoEm || '').toLocaleString()}</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedLote(null)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              {canChangeStatus() && (
                <div className="flex items-center gap-3">
                  <select
                    value={selectedLote.status}
                    onChange={(e) => updateLoteStatus(selectedLote.id, e.target.value as Lote['status'])}
                    className="px-4 py-3 border-2 border-stone-200 rounded-xl bg-white/70 font-medium"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_separacao">Em Separação</option>
                    <option value="recebido">Recebido</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        {user?.role !== 'cfc' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, número do documento ou lote..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={cfcFilter}
                  onChange={(e) => setCfcFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
                >
                  <option value="all">Todos os CFCs</option>
                  <option value="particular">Particular</option>
                  {availableCfcs.map(cfc => (
                    <option key={cfc} value={cfc}>{cfc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filtro simplificado para CFC */}
        {user?.role === 'cfc' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou número do lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 bg-white/70"
              />
            </div>
          </div>
        )}

        {/* Estatísticas */}
        {user?.role !== 'cfc' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{totalItems}</div>
                <div className="text-sm text-gray-600">Total de Itens</div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{cfcItems}</div>
                <div className="text-sm text-gray-600">CFCs</div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{particularItems}</div>
                <div className="text-sm text-gray-600">Particulares</div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Object.keys(groupedItems).length}</div>
                <div className="text-sm text-gray-600">Grupos</div>
              </div>
            </div>
          </div>
        )}

        {/* Itens Agrupados por CFC */}
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([cfcName, items]) => {
            // Para CFCs, mostrar apenas se for o CFC do usuário ou se for particular
            if (user?.role === 'cfc' && cfcName !== 'Particular' && 
                normalizeCfc(cfcName) !== normalizeCfc(user.cfcName)) {
              return null;
            }
            
            return (
            <div key={cfcName} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-200/50">
              <div className="p-6 border-b border-stone-200/50 bg-stone-50/80 rounded-t-2xl">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  {cfcName}
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold border border-emerald-200">
                    {items.length} itens
                  </span>
                </h3>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 bg-stone-50/80 rounded-xl hover:bg-stone-100/80 transition-colors border border-stone-200/50"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{item.nome}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.numeroDocumento || 'N/A'}
                        </p>
                      </div>
                      <div className={`text-sm font-semibold px-3 py-1 rounded-full border ${getTipoColor(item.tipo)}`}>
                        {item.tipo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );})}
        </div>
      </div>
    );
  }

  // Filtrar lotes baseado no papel do usuário
  const availableLotes = user?.role === 'cfc' 
    ? lotes.filter(lote => lote.items.length > 0) // CFCs só veem lotes que têm itens deles
    : lotes.filter(lote => lote.status === 'pendente' || lote.status === 'em_separacao');

  return (
    <div className="space-y-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {user?.role === 'cfc' ? 'Visualização de Lotes' : 'Separação de Lotes'}
        </h2>
        <p className="text-gray-600">Selecione um lote para iniciar a separação</p>
      </div>

      <div className="grid gap-6">
        {lotes.filter(lote => 
          lote.status === 'pendente' || 
          lote.status === 'em_separacao' || 
          lote.status === 'recebido'
        ).map(lote => (
          <div
            key={lote.id}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-stone-200/50 hover:border-emerald-300"
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
              <span className={`px-3 py-2 rounded-full text-sm font-semibold border ${getStatusColor(lote.status)}`}>
                {getStatusLabel(lote.status)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <div>Criado em: {new Date(lote.criadoEm).toLocaleDateString('pt-BR')}</div>
                {(user?.role === 'operador' || user?.role === 'admin') && lote.atualizadoPor && (
                  <div className="mt-1">
                    Separado por: {lote.atualizadoPor} em {new Date(lote.atualizadoEm || '').toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
              <button
                onClick={() => startSeparation(lote)}
                className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
              >
                <Package className="w-4 h-4" />
                {lote.status === 'recebido' ? 'Visualizar' : 
                 lote.status === 'em_separacao' ? 'Continuar Separação' : 'Iniciar Separação'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {lotes.filter(lote => 
        lote.status === 'pendente' || 
        lote.status === 'em_separacao' || 
        lote.status === 'recebido'
      ).length === 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-stone-200/50">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum lote disponível</p>
        </div>
      )}
    </div>
  );
};

export default LoteSeparacao;