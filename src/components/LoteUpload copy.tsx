import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Lote, LoteItem } from '../types';
import * as XLSX from 'xlsx';

const LoteUpload: React.FC = () => {
  const { user } = useAuth();
  const [loteNumber, setLoteNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const detectLoteType = (numero: string): 'CNH' | 'PID' => {
    const firstChar = numero.charAt(0).toUpperCase();
    return firstChar === 'P' ? 'PID' : 'CNH';
  };

  const extractDataFromExcel = async (file: File, loteType: 'CNH' | 'PID'): Promise<LoteItem[]> => {
    const items: LoteItem[] = [];

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    rows.forEach((row, index) => {
      const nome = row[0]?.toString().trim();
      const rawCfc = row[6]?.toString().trim() || ''; // COLUNA G = índice 6

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

      if (rawCfc.toUpperCase().startsWith('CFC')) {
        cfcFinal = rawCfc;
      }

      items.push({
        id: `${Date.now()}-${index}`,
        nome,
        cfc: cfcFinal,
        tipo: loteType,
        numeroDocumento: `${loteType}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      });
    });

    return items.sort((a, b) => a.nome.localeCompare(b.nome));
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
      const loteType = detectLoteType(loteNumber);
      const items = await extractDataFromExcel(file, loteType);

      const existingLotes = JSON.parse(localStorage.getItem('lotes') || '[]');
      const exists = existingLotes.some((l: Lote) => l.numero === loteNumber.toUpperCase());

      if (exists) {
        setMessage('Erro: Lote já cadastrado');
        setMessageType('error');
        setIsUploading(false);
        return;
      }

      const newLote: Lote = {
        id: Date.now().toString(),
        numero: loteNumber.toUpperCase(),
        tipo: loteType,
        status: 'pendente',
        criadoPor: user?.name || '',
        criadoEm: new Date().toISOString(),
        items,
        pdfFileName: file.name,
      };

      existingLotes.push(newLote);
      localStorage.setItem('lotes', JSON.stringify(existingLotes));

      const cfcCount = items.filter(item => item.cfc).length;
      const particularCount = items.filter(item => !item.cfc).length;

      setMessage(
        `Lote ${loteNumber.toUpperCase()} (${loteType}) criado com sucesso! ` +
        `${items.length} itens processados: ${cfcCount} de CFCs, ${particularCount} particulares.`
      );
      setMessageType('success');
      setLoteNumber('');
      const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      window.dispatchEvent(new CustomEvent('loteUpdated'));
    } catch (error) {
      setMessage('Erro ao processar o arquivo Excel');
      setMessageType('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setMessage('Por favor, selecione um arquivo Excel (.xlsx)');
      setMessageType('error');
      return;
    }

    handleFileUpload(file);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 space-y-8 border border-stone-200/50">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Número do Lote
          </label>
          <input
            type="text"
            value={loteNumber}
            onChange={(e) => setLoteNumber(e.target.value)}
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-lg font-medium bg-white/70"
            placeholder="Ex: L001-2024 ou P001-2024"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Arquivo Excel
          </label>
          <div className="border-3 border-dashed border-stone-300 rounded-2xl p-8 text-center hover:border-emerald-400 transition-colors duration-200 bg-stone-50/50">
            <Upload className="w-16 h-16 text-stone-400 mx-auto mb-4" />
            <input
              id="pdfFile"
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
            />
            <label
              htmlFor="pdfFile"
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
          className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white py-4 px-6 rounded-xl hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg shadow-lg"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Processando...
            </>
          ) : (
            <>
              <FileText className="w-6 h-6" />
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
