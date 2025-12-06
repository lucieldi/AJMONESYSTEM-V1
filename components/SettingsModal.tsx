import React, { useState } from 'react';
import { X, UserPlus, Trash2, Shield, User as UserIcon, Check, Edit2, RotateCcw, Lock, Eye, Users, Layout, Send, AlertTriangle, Smile } from 'lucide-react';
import { User, UserRole, AppSettings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onAddUser: (user: User & { password?: string }) => void;
  onUpdateUser: (user: User & { password?: string }) => void;
  onDeleteUser: (userId: string) => void;
  currentUserId: string;
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
}

type Tab = 'users' | 'security' | 'appearance';

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, users, onAddUser, onUpdateUser, onDeleteUser, currentUserId, appSettings, setAppSettings }) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  
  // User Management State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [avatar, setAvatar] = useState('👤');

  // Security State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('user');
    setAvatar('👤');
    setEditingUserId(null);
    setDeleteConfirmId(null);
  };

  const handleEditClick = (user: User) => {
      setEditingUserId(user.id);
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email || '');
      setPassword(''); 
      setRole(user.role);
      setAvatar(user.avatar);
      setDeleteConfirmId(null); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) return;

    const baseUserData = {
      id: editingUserId || username, 
      name,
      username,
      email,
      role,
      avatar
    };

    if (editingUserId) {
        // Update Flow
        const updatePayload = { ...baseUserData };
        if (password.trim()) {
            (updatePayload as any).password = password;
        }
        onUpdateUser(updatePayload as any);
    } else {
        // Registration Flow
        if (!password) return; 
        onAddUser({ ...baseUserData, password });
    }

    resetForm();
  };

  const handleSendRecovery = () => {
      if(!recoveryEmail) return;
      setRecoveryStatus('sending');
      setTimeout(() => {
          setRecoveryStatus('sent');
          setTimeout(() => {
              setRecoveryStatus('idle');
              setRecoveryEmail('');
          }, 3000);
      }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#191919] w-full max-w-4xl h-[80vh] rounded-xl border border-[#333] shadow-2xl flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <div className="w-64 bg-[#202020] border-r border-[#333] flex flex-col">
            <div className="p-6 border-b border-[#333]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield size={20} className="text-blue-500" /> Admin
                </h2>
                <p className="text-xs text-notion-muted">Painel de Controle</p>
            </div>
            <div className="p-2 space-y-1">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'users' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                >
                    <Users size={18} /> Gerenciamento de Usuários
                </button>
                <button 
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'security' ? 'bg-green-600/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                >
                    <Lock size={18} /> Segurança e Recuperação
                </button>
                 <button 
                    onClick={() => setActiveTab('appearance')}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'appearance' ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                >
                    <Eye size={18} /> Aparência
                </button>
            </div>
            <div className="mt-auto p-4 border-t border-[#333]">
                <button onClick={() => { onClose(); resetForm(); }} className="w-full py-2 bg-[#333] hover:bg-[#444] rounded text-sm text-white transition-colors">
                    Fechar Configurações
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#151515] p-8">
            
            {/* --- TAB: USER MANAGEMENT --- */}
            {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold text-white mb-6">Gerenciamento de Usuários</h2>
                    
                    {/* Add/Edit Form */}
                    <div className="bg-[#202020] rounded-lg border border-[#333] p-6 mb-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            {editingUserId ? <Edit2 size={16} /> : <UserPlus size={16} />} 
                            {editingUserId ? 'Editar Usuário' : 'Registrar Novo Usuário'}
                        </h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div className="col-span-1 space-y-1">
                                <label className="text-xs text-notion-muted">Nome Completo</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600" placeholder="ex: João Silva"/>
                            </div>
                            <div className="col-span-1 space-y-1">
                                <label className="text-xs text-notion-muted">Usuário</label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600" placeholder="ex: joao" />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs text-notion-muted">Endereço de Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600" placeholder="usuario@empresa.com"/>
                            </div>
                            <div className="col-span-1 space-y-1">
                                <label className="text-xs text-notion-muted">Senha {editingUserId && "(Em branco para manter)"}</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600" placeholder="••••••"/>
                            </div>
                             <div className="col-span-1 space-y-1">
                                <label className="text-xs text-notion-muted">Função</label>
                                <select 
                                    value={role} 
                                    onChange={e => setRole(e.target.value as UserRole)} 
                                    disabled={editingUserId === 'admin' || editingUserId === currentUserId}
                                    className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="user">Usuário Padrão</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            
                            <div className="col-span-2 flex justify-end gap-2 mt-2">
                                {editingUserId && (
                                    <button type="button" onClick={resetForm} className="text-gray-400 hover:text-white px-4 py-2 text-sm">Cancelar</button>
                                )}
                                <button type="submit" disabled={!name || !username || (!editingUserId && !password)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded text-sm font-medium transition-colors shadow-lg">
                                    {editingUserId ? 'Atualizar Usuário' : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* User List */}
                    <div className="bg-[#202020] rounded-lg border border-[#333] overflow-hidden">
                        {users.map(user => (
                            <div key={user.id} className="p-4 border-b border-[#333] last:border-0 flex items-center justify-between hover:bg-[#252525] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-lg">{user.avatar}</div>
                                    <div>
                                        <div className="font-medium text-white flex items-center gap-2">
                                            {user.name} 
                                            {user.role === 'admin' && <span className="text-[10px] bg-blue-900/40 text-blue-300 px-1.5 rounded border border-blue-500/20">ADMIN</span>}
                                        </div>
                                        <div className="text-xs text-gray-500">{user.email || 'Sem email'} • @{user.username}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {deleteConfirmId === user.id ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => onDeleteUser(user.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded">Confirmar</button>
                                            <button onClick={() => setDeleteConfirmId(null)} className="bg-[#333] text-white text-xs px-2 py-1 rounded">Cancelar</button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-blue-400"><Edit2 size={16}/></button>
                                            {/* Prevent deleting yourself OR the root admin user */}
                                            {user.id !== currentUserId && user.id !== 'admin' && (
                                                <button onClick={() => setDeleteConfirmId(user.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TAB: SECURITY --- */}
            {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Segurança e Recuperação</h2>
                    
                    <div className="bg-[#202020] p-6 rounded-lg border border-[#333] mb-6">
                        <div className="flex items-center gap-3 mb-4 text-orange-400">
                            <AlertTriangle size={24} />
                            <h3 className="font-semibold text-white">Recuperação de Senha</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">
                            Envie um link de redefinição de senha para o email registrado de um usuário. Isso permitirá que eles definam uma nova senha com segurança.
                        </p>
                        
                        <div className="space-y-4">
                            <label className="text-xs text-notion-muted">Selecione o Usuário para Recuperar</label>
                            <select 
                                value={recoveryEmail} 
                                onChange={e => setRecoveryEmail(e.target.value)} 
                                className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2.5 text-sm text-white outline-none"
                            >
                                <option value="">Selecione um usuário...</option>
                                {users.filter(u => u.email).map(u => (
                                    <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            
                            <button 
                                onClick={handleSendRecovery}
                                disabled={!recoveryEmail || recoveryStatus !== 'idle'}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium transition-colors ${
                                    recoveryStatus === 'sent' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-[#333] hover:bg-[#444] text-white'
                                }`}
                            >
                                {recoveryStatus === 'idle' && <><Send size={16}/> Enviar Email de Recuperação</>}
                                {recoveryStatus === 'sending' && "Enviando..."}
                                {recoveryStatus === 'sent' && <><Check size={16}/> Enviado com Sucesso</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: APPEARANCE --- */}
            {activeTab === 'appearance' && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Aparência do Espaço de Trabalho</h2>

                    <div className="space-y-4">
                        <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Layout size={20} className="text-gray-400"/>
                                <div>
                                    <h3 className="font-medium text-white">Mostrar Barra Lateral</h3>
                                    <p className="text-xs text-gray-500">Alternar a barra lateral de navegação principal.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setAppSettings({ ...appSettings, showSidebar: !appSettings.showSidebar })}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.showSidebar ? 'bg-blue-600' : 'bg-[#333]'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings.showSidebar ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                         <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Eye size={20} className="text-gray-400"/>
                                <div>
                                    <h3 className="font-medium text-white">Cabeçalho do Projeto</h3>
                                    <p className="text-xs text-gray-500">Mostrar breadcrumbs e barra de navegação superior.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setAppSettings({ ...appSettings, showBreadcrumbs: !appSettings.showBreadcrumbs })}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.showBreadcrumbs ? 'bg-blue-600' : 'bg-[#333]'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings.showBreadcrumbs ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Smile size={20} className="text-gray-400"/>
                                <div>
                                    <h3 className="font-medium text-white">Saudação Inicial</h3>
                                    <p className="text-xs text-gray-500">Mostrar mensagem "Boa Tarde" no painel.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setAppSettings({ ...appSettings, showGreeting: !appSettings.showGreeting })}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.showGreeting ? 'bg-blue-600' : 'bg-[#333]'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings.showGreeting ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>
                 </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;