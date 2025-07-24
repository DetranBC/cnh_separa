import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRequired?: boolean;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ 
  isOpen, 
  onClose, 
  isRequired = false 
}) => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 4) {
      setMessage('A senha deve ter pelo menos 4 caracteres');
      setMessageType('error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage('As senhas não coincidem');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const success = await updatePassword(newPassword);
      if (success) {
        setMessage('Senha alterada com sucesso!');
        setMessageType('success');
        setTimeout(() => {
          onClose();
          setNewPassword('');
          setConfirmPassword('');
          setMessage('');
        }, 1500);
      } else {
        setMessage('Erro ao alterar senha');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erro ao alterar senha');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-stone-200/50">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {isRequired ? 'Alterar Senha Obrigatória' : 'Alterar Senha'}
          </h3>
          {isRequired && (
            <p className="text-gray-600 text-sm">
              Por segurança, você deve alterar sua senha no primeiro acesso
            </p>
          )}
        </div>
        
        {message && (
          <div className={`p-4 rounded-xl border-2 mb-6 flex items-center gap-3 ${
            messageType === 'success' 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50/80 border-rose-200 text-rose-800'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white/70"
              placeholder="Digite a nova senha"
              required
              minLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white/70"
              placeholder="Confirme a nova senha"
              required
              minLength={4}
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            {!isRequired && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`${isRequired ? 'w-full' : 'flex-1'} bg-gradient-to-r from-blue-400 to-blue-500 text-white py-3 px-4 rounded-xl hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;