import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lote, LoteItem } from '../types';
import {
  Search,
  Eye,
  Package,
  Clock,
  CheckCircle,
  Filter,
  Users,
  FileText,
  Trash,
} from 'lucide-react';

const normalizeCfc = (cfc?: string) =>
  cfc?.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim() || '';

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
    const handleLoteUpdate = () => loadLotes();
    window.addEventListener('loteUpdated', handleLoteUpdate);
    return () => window.removeEventListener('loteUpdated', handleLoteUpdate);
  }, []);

  useEffect(() => {
    filterLotes();
  }, [lotes, searchTerm, statusFilter, tipoFilter, user]);

  const loadLotes = () => {
    const savedLotes = JSON.parse(localStorage.getItem('lotes') || '[]');
    setLotes(savedLotes);
  };

  const filterLotes = () => {
    let filtered = lotes;

    if (user?.role === 'cfc') {
      filtered = filtered
        .map(lote => ({
          ...lote,
          items: lote.items.filter(item =>
            normalizeCfc(item.cfc) === normalizeCfc(user.cfcName)
          )
        }))
        .filter(lote => lote.items.length > 0);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(lote => {
        const loteMatch = lote.numero.toLowerCase().includes(searchLower);
        const visibleItems = user?.role === 'cfc'
          ? lote.items.filter(item =>
              normalizeCfc(item.cfc) === normalizeCfc(user.cfcName)
            )
          : lote.items;
        const nameMatch = visibleItems.some(item =>
          item.nome.toLowerCase().includes(searchLower)
        );
        return loteMatch || nameMatch;
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lote => lote.status === statusFilter);
    }

    if (tipoFilter !== 'all') {
      filtered = filtered.filter(lote => lote.tipo === tipoFilter);
    }

    setFilteredLotes(filtered);
  };

  const updateLoteStatus = (loteId: string, newStatus: Lote['status']) => {
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

  const deleteLote = (loteId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja deletar este lote?');
    if (!confirmed) return;
    const updatedLotes = lotes.filter(lote => lote.id !== loteId);
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

  const handleLoteClick = (lote: Lote) => {
    setSelectedLote(lote);
  };

  const canChangeStatus = () => user?.role === 'operador';

  const getVisibleItems = (items: LoteItem[]) => {
    if (user?.role === 'cfc') {
      return items.filter(item => normalizeCfc(item.cfc) === normalizeCfc(user.cfcName));
    }
    return items;
  };

  const groupItemsByCfc = (items: LoteItem[]) => {
    const grouped: { [key: string]: LoteItem[] } = {};
    items.forEach(item => {
      const key = item.cfc?.trim() || 'Particular';
      if (!grouped[key]) grouped[key] = [];
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

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número do lote ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-stone-200 rounded-xl bg-white/70"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-stone-200 rounded-xl bg-white/70"
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
                className="px-4 py-3 border-2 border-stone-200 rounded-xl bg-white/70"
              >
                <option value="all">Todos os Tipos</option>
                <option value="CNH">CNH</option>
                <option value="PID">PID</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredLotes.map((lote) => {
        const groupedItems = groupItemsByCfc(getVisibleItems(lote.items));
        return (
          <div key={lote.id} className="bg-white rounded-2xl shadow-md border border-stone-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{lote.numero} - {lote.tipo}</h3>
                <p className="text-sm text-gray-500">
                  Criado por {lote.criadoPor} em {new Date(lote.criadoEm).toLocaleString()}
                </p>
              </div>
              <div className={`px-4 py-1 text-sm font-medium rounded-full border ${getStatusColor(lote.status)}`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(lote.status)}
                  {getStatusLabel(lote.status)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedItems).map(([cfc, items]) => (
                <div key={cfc} className="border border-stone-200 rounded-xl p-4">
                  <div className="text-lg font-semibold text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-2 text-gray-500" />
                    {cfc}
                  </div>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4">
                    {items.map((item) => (
                      <li key={item.id}>{item.nome}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              {canChangeStatus() && (
                <>
                  <button
                    onClick={() => updateLoteStatus(lote.id, 'recebido')}
                    className="px-4 py-2 text-sm rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
                  >
                    Marcar como Recebido
                  </button>
                  <button
                    onClick={() => updateLoteStatus(lote.id, 'em_separacao')}
                    className="px-4 py-2 text-sm rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    Em Separação
                  </button>
                </>
              )}
              {user?.role === 'admin' && (
                <button
                  onClick={() => deleteLote(lote.id)}
                  className="px-4 py-2 text-sm rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition"
                >
                  <Trash className="inline w-4 h-4 mr-1" />
                  Deletar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LoteDashboard;
