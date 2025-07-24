import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Lote, LoteItem } from '../types';
import * as XLSX from 'xlsx';

const LoteUpload: React.FC = () => {
  const { user } = useAuth();
  const [lotesDb, setLotesDb] =  useState<Lote[]>([])
  const [loteNumber, setLoteNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadLotes();
  }, [])

    const loadLotes = async () => {
      try {
        const response = await apiService.getLotes();
        const data: Lote[] = JSON.parse(response.data || "[]");
        setLotesDb(data);
      } catch(err){ 
        alert("Deu erro ao pegar os lotes do servidor" + err)
      }
    };

  // Função para detectar tipo do lote baseado no número
  const detectLoteType = (numero: string): 'CNH' | 'PID' => {
    const firstChar = numero.charAt(0).toUpperCase();
    return firstChar === 'P' ? 'PID' : 'CNH';
  };

  // Função para extrair dados do Excel
  const extractDataFromExcel = async (file: File, loteType: 'CNH' | 'PID'): Promise<LoteItem[]> => {
    const items: LoteItem[] = [];
    let autoLoteNumber = '';
    
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    rows.forEach((row, index) => {
      // Auto-preencher número do lote da célula B2 (primeira vez)
      if (index === 1 && row[1] && !autoLoteNumber) { // B2 = índice 1 da linha 1
        autoLoteNumber = row[1].toString().trim();
        if (autoLoteNumber && !loteNumber) {
          setLoteNumber(autoLoteNumber);
        }
      }

      const nome = row[0]?.toString().trim();
      const rawCfc = row[6]?.toString().trim() || ''; // COLUNA G = índice 6

      // Pula linhas de cabeçalho ou rodapé
      const isLinhaCabecalhoOuRodape =
        !nome ||
        nome.length < 5 ||
        nome.toLowerCase().includes('formulário') ||
        nome.toLowerCase().includes('operador') ||
        nome.toLowerCase().includes('data') ||
        nome.toLowerCase().includes('ciretran') ||
        nome.toLowerCase().includes('estado');

      if (isLinhaCabecalhoOuRodape) return;

      let cfcFinal = null;

      // Verifica se é um CFC válido
      if (rawCfc.toUpperCase().startsWith('CFC')) {
        cfcFinal = rawCfc;
      }

      items.push({
        id: `${Date.now()}-${index}`,
        nome,
        cfc: cfcFinal, // null se for particular ou CFC não cadastrado
        tipo: loteType,
        numeroDocumento: `${loteType}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      });
    });

    return items.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordem alfabética
  };

   const handleFileUpload = async (file: File) => {
    if (!loteNumber.trim()) {
      setMessage('Por favor, informe o número do lote');
      setMessageType('error');
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      // Detecta automaticamente o tipo do lote
      const loteType = detectLoteType(loteNumber);
      
      // Extrai dados do Excel
      const items = await extractDataFromExcel(file, loteType);
      
      // Extrai CFCs únicos dos itens para criar usuários automaticamente
      const cfcsEncontrados = new Set<string>();
      items.forEach(item => {
        if (item.cfc && item.cfc.toUpperCase().startsWith('CFC')) {
          cfcsEncontrados.add(item.cfc);
        }
      });

      // Cria usuários CFC automaticamente
      await createCfcUsers(Array.from(cfcsEncontrados));

      const loteData = {
        numero: loteNumber.toUpperCase(),
        tipo: loteType,
        status: 'pendente',
        items
      };

      // Verifica se o lote já existe
      const exists = lotesDb.some((l: any) => l.numero === loteData.numero);
      if (exists) {
        throw new Error('Número do lote já existe');
      }
      
      // Envia para o servidor
      await apiService.createLote(loteData);

      const cfcCount = items.filter(item => item.cfc).length;
      const particularCount = items.filter(item => !item.cfc).length;

      setMessage(
        `Lote ${loteNumber.toUpperCase()} (${loteType}) criado com sucesso! ` +
        `${items.length} itens processados: ${cfcCount} de CFCs, ${particularCount} particulares.`
        (cfcsEncontrados.size > 0 ? ` ${cfcsEncontrados.size} perfis de CFC criados automaticamente.` : '')
      );
      setMessageType('success');
      setLoteNumber('');
      
      // Reset file input
      const fileInput = document.getElementById('excelFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Dispara evento para atualizar outros componentes
      window.dispatchEvent(new CustomEvent('loteUpdated'));
      
      // Recarrega a lista de lotes
      await loadLotes();
    } catch (error) {
      console.error('Erro ao criar lote:', error);
      setMessage(error instanceof Error ? error.message : 'Erro ao processar o arquivo PDF');
      setMessageType('error');
    } finally {
      setIsUploading(false);
    }
  };

  // Função para criar usuários CFC automaticamente
  const createCfcUsers = async (cfcs: string[]) => {
    const existingUsers = await apiService.getUsers();
    
    for (const cfc of cfcs) {
      // Verifica se já existe um usuário para este CFC
      const cfcExists = existingUsers.some((user: any) => 
        user.role === 'cfc' && user.cfcName === cfc
      );
      
      if (!cfcExists) {
        try {
          await apiService.createUser({
            username: cfc.toLowerCase().replace(/\s+/g, ''),
            password: '12345',
            role: 'cfc',
            cfcName: cfc,
            name: cfc,
            requirePasswordChange: true
          });
          console.log(`Usuário CFC criado: ${cfc}`);
        } catch (error) {
          console.error(`Erro ao criar usuário para ${cfc}:`, error);
        }
      }
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById('excelFile') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      setMessage('Por favor, selecione um arquivo Excel');
      setMessageType('error');
      return;
    }

    handleFileUpload(file);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-stone-200/50">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Novo Lote</h2>
        <p className="text-gray-600">Faça upload de um PDF para criar um novo lote</p>
        <div className="mt-4 p-4 bg-stone-50/80 rounded-xl border border-stone-200/50">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Detecção automática:</span>
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>• Números iniciados com <span className="font-semibold text-rose-600">P</span> = PID</li>
            <li>• Números iniciados com <span className="font-semibold text-emerald-600">L</span> = CNH</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 space-y-8 border border-stone-200/50">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Número do Lote
          </label>
          <input
            type="text"
            value={loteNumber}
            onChange={(e) => setLoteNumber(e.target.value)}
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-lg font-medium bg-white/70"
            placeholder="Ex: L001-2024 ou P001-2024"
            required
          />
          {loteNumber && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">Tipo detectado: </span>
              <span className={`font-semibold ${detectLoteType(loteNumber) === 'PID' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {detectLoteType(loteNumber)}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Arquivo Excel
          </label>
          <div className="border-3 border-dashed border-stone-300 rounded-2xl p-8 text-center hover:border-emerald-400 transition-colors duration-200 bg-stone-50/50">
            <Upload className="w-16 h-16 text-stone-400 mx-auto mb-4" />
            <input
              id="excelFile"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const label = document.querySelector('label[for="excelFile"] .file-name');
                  if (label) {
                    label.textContent = file.name;
                  }
                }
              }}
            />
            <label
              htmlFor="excelFile"
              className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-semibold text-lg"
            >
              Clique para selecionar o arquivo Excel
              <span className="file-name block text-sm text-gray-500 mt-2 font-normal"></span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white py-4 px-6 rounded-xl hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg shadow-lg transition-all duration-200"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Processando...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-6 h-6" />
              Criar Lote
            </>
          )}
        </button>
      </form>

      {message && (
        <div className={`border-2 rounded-2xl p-6 flex items-center gap-3 ${
          messageType === 'success' 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50/80 border-rose-200 text-rose-800'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
          )}
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};

export default LoteUpload;