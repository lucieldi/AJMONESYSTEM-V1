
import React, { useState } from 'react';
import { Lock, User as UserIcon, ArrowRight, Mail, ArrowLeft, Check } from 'lucide-react';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
  users: any[]; // Correctly typed as array of user objects
}

const LoginScreen: React.FC<Props> = ({ onLogin, users }) => {
  const [view, setView] = useState<'login' | 'recovery'>('login');

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Find user by username/password.
      // Note: We use stable ID for session, but match on username for login.
      const userRecord = users.find((u: any) => u.username === username && u.password === password);

      if (userRecord) {
        onLogin({
          id: userRecord.id, // Using stable ID instead of username
          username: userRecord.username,
          name: userRecord.name,
          role: userRecord.role,
          avatar: userRecord.avatar,
          email: userRecord.email
        });
      } else {
        setError('Usuário ou senha inválidos');
        setLoading(false);
      }
    }, 800);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoveryStatus('sending');

    setTimeout(() => {
        // Check if email corresponds to a user (mock check)
        const user = users.find((u: any) => u.email === recoveryEmail || u.username === recoveryEmail);
        
        if (user && user.email) {
            setRecoveryStatus('success');
            setRecoveryMessage(`Enviamos um link de redefinição de senha para ${user.email}`);
        } else {
            // For security/simplicity, we show a generic success message or specific if preferred.
            setRecoveryStatus('success');
            setRecoveryMessage(`Se existir uma conta para "${recoveryEmail}", enviamos um link de redefinição.`);
        }
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-[#191919] flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md bg-[#202020] border border-[#333] rounded-2xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500 min-h-[450px] flex flex-col justify-center">
        
        {view === 'login' ? (
          <>
            <div className="text-center mb-8">
               {/* No footer icon/text here per previous request */}
               <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h1>
               <p className="text-gray-400 text-sm">Insira suas credenciais para acessar o AJM OneSystem</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 ml-1">USUÁRIO</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#191919] border border-[#333] text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
                    placeholder="admin ou user"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400 ml-1">SENHA</label>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#191919] border border-[#333] text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
                    placeholder="••••"
                  />
                </div>
                <div className="flex justify-end pt-1">
                     <button 
                        type="button" 
                        onClick={() => { setView('recovery'); setError(''); setRecoveryStatus('idle'); setRecoveryEmail(''); }}
                        className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                    >
                        Esqueceu a senha?
                    </button>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-xs text-center bg-red-900/20 py-2 rounded border border-red-900/30 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-900/20"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    Entrar <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#2C2C2C] rounded-full mx-auto flex items-center justify-center mb-4 border border-[#333]">
                        <Mail size={32} className="text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Redefinir Senha</h1>
                    <p className="text-gray-400 text-sm">Insira seu endereço de email e enviaremos um link para redefinir sua senha.</p>
                </div>

                {recoveryStatus === 'success' ? (
                     <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-6 text-center animate-in zoom-in-95">
                         <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                             <Check size={24} className="text-green-400"/>
                         </div>
                         <h3 className="text-green-400 font-semibold mb-2">Verifique seu email</h3>
                         <p className="text-xs text-gray-300 leading-relaxed mb-4">{recoveryMessage}</p>
                         <button 
                            onClick={() => setView('login')}
                            className="text-xs text-white bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition-colors w-full"
                         >
                             Voltar para Login
                         </button>
                     </div>
                ) : (
                    <form onSubmit={handleRecoverySubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 ml-1">ENDEREÇO DE EMAIL</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="text"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    className="w-full bg-[#191919] border border-[#333] text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Digite seu email"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={recoveryStatus === 'sending' || !recoveryEmail}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {recoveryStatus === 'sending' ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                            <>
                                Enviar Link
                            </>
                            )}
                        </button>

                         <button 
                            type="button"
                            onClick={() => setView('login')}
                            className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16}/> Voltar para Login
                        </button>
                    </form>
                )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
