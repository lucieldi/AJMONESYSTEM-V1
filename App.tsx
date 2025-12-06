import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Menu, Search, Home, Plus, Settings, MoreHorizontal, 
  FileText, Trello, GitMerge, ChevronRight, Clock, Trash2, Brain, 
  Image as ImageIcon, Palette, Upload, Type, Archive, RotateCcw, ChevronDown, Smile, X, MoveVertical,
  ListTodo, MessageSquare, LogOut, User as UserIcon, LayoutDashboard
} from 'lucide-react';
import { Project, NavigationState, ViewType, KanbanColumn, IshikawaData, ScrumData, User, AppSettings } from './types';
import KanbanBoard from './components/KanbanBoard';
import IshikawaDiagram from './components/IshikawaDiagram';
import ScrumBoard from './components/ScrumBoard';
import GlobalChat from './components/GlobalChat';
import LoginScreen from './components/LoginScreen';
import SettingsModal from './components/SettingsModal';
import AdminDashboard from './components/AdminDashboard';
import { generateKanbanBoard, generateIshikawaData, generateScrumBacklog } from './services/geminiService';
import { userService } from './services/userService';

// --- Constants & Mock Data ---

const COVERS = [
    'linear-gradient(to right, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
    '#2C2C2C' // Neutral/Remove
];

const THEMES = [
    '#191919', // Default Dark
    '#2B2B2B', // Lighter Dark
    '#0F172A', // Slate 900
    '#312e81', // Indigo 900
    '#3F2E3E', // Deep Purple
];

const EMOJI_LIST = [
    '🚀', '📄', '✅', '🎨', '📅', '💡', '🔥', '✨', '🏆', '🎯', 
    '📢', '💰', '📈', '🛒', '🔧', '⚙️', '🏠', '✈️', '🍔', '🎵',
    '💻', '🔒', '📦', '🎁', '🎓', '💊', '⚽', '⭐', '❤️', '⚠️'
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Lançamento Marketing Q4',
    icon: '🚀',
    updatedAt: new Date(),
    status: 'active',
    content: '# Plano de Lançamento de Marketing\n\nEste é o documento principal para o lançamento do Q4.\n\n- [ ] Definir público\n- [ ] Rascunhar cópia',
    cover: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
    coverPositionY: 50,
    kanbanData: [
      { 
        id: 'c1', 
        title: 'A Fazer', 
        color: '#EF4444',
        tasks: [
            { 
                id: 't1', 
                content: 'Rascunhar Emails', 
                description: 'Rascunhar a sequência de 3 partes de email para o próximo lançamento de produto. Focar em benefícios e preços antecipados.', 
                assignee: 'Sarah',
                dueDate: '2023-11-20',
                icon: '📧'
            }, 
            { id: 't2', content: 'Atualizar Redes Sociais', icon: '📱' }
        ] 
      },
      { id: 'c2', title: 'Em Progresso', color: '#3B82F6', tasks: [{ id: 't3', content: 'Design de Ativos', assignee: 'Mike', icon: '🎨' }] },
      { id: 'c3', title: 'Concluído', color: '#10B981', tasks: [] }
    ],
    ishikawaData: {
      effect: "Baixa Taxa de Conversão",
      categories: [
          { name: "Conteúdo", causes: ["Manchetes chatas", "CTA pouco clara"] },
          { name: "Tráfego", causes: ["Público errado", "Baixo volume"] }
      ]
    },
    scrumData: {
        backlog: [
            { id: 'b1', content: 'Como usuário, quero fazer login via Google', priority: 'High', storyPoints: 5 },
            { id: 'b2', content: 'Como admin, quero ver análises', priority: 'Medium', storyPoints: 8 },
        ],
        sprints: [
            { id: 's1', title: 'Sprint 1', status: 'active', startDate: new Date().toISOString(), tasks: [
                { id: 'st1', content: 'Configurar Pipeline CI/CD', priority: 'High', storyPoints: 3 }
            ]}
        ]
    }
  },
  {
    id: '2',
    title: 'Design do Site Antigo',
    icon: '🕸️',
    updatedAt: new Date(Date.now() - 100000000),
    status: 'completed',
    content: '# Design Legado\n\nArquivo das especificações do design antigo.',
    kanbanData: [],
    ishikawaData: { effect: "Legado", categories: [] },
    scrumData: { backlog: [], sprints: [] }
  }
];

// --- Helpers ---
const getCoverUrl = (cover?: string) => {
    if (!cover) return null;
    const match = cover.match(/url\(['"]?(.*?)['"]?\)/);
    return match ? match[1] : null;
};

// --- Components ---

interface RepositionModalProps {
    image: string;
    onSave: (positionY: number) => void;
    onCancel: () => void;
}

const RepositionModal: React.FC<RepositionModalProps> = ({ image, onSave, onCancel }) => {
    const [pos, setPos] = useState(50);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startPos = useRef(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const deltaY = e.clientY - startY.current;
            const sensitivity = 0.2;
            const newPos = Math.max(0, Math.min(100, startPos.current - (deltaY * sensitivity)));
            setPos(newPos);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startY.current = e.clientY;
        startPos.current = pos;
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#202020] w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl border border-[#333]">
                <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#191919]">
                    <h3 className="font-semibold text-white">Reposicionar Imagem de Capa</h3>
                    <div className="flex gap-3">
                        <button 
                            onClick={onCancel} 
                            className="px-4 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={() => onSave(pos)} 
                            className="px-4 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-900/20"
                        >
                            Salvar Posição
                        </button>
                    </div>
                </div>
                <div 
                    className="h-64 w-full relative overflow-hidden cursor-ns-resize group select-none" 
                    onMouseDown={handleMouseDown}
                >
                    <div 
                        className="w-full h-full transition-none will-change-[background-position]"
                        style={{ 
                            backgroundImage: `url(${image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: `center ${pos}%`
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/40 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/20">
                            Arraste para Reposicionar
                        </div>
                    </div>
                    {/* Guides */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-white/10"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>
                </div>
                <div className="p-3 bg-[#191919] text-center text-xs text-notion-muted">
                    Arraste a imagem para cima ou para baixo para ajustar como ela aparece.
                </div>
            </div>
        </div>
    );
};

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
    return (
        <div className="absolute z-50 mt-2 p-2 bg-[#2C2C2C] border border-[#444] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 w-64">
             <div className="grid grid-cols-6 gap-1">
                 {EMOJI_LIST.map((emoji) => (
                     <button
                        key={emoji}
                        onClick={(e) => { e.stopPropagation(); onSelect(emoji); onClose(); }}
                        className="w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 text-xl transition-colors cursor-pointer"
                     >
                         {emoji}
                     </button>
                 ))}
             </div>
             <div className="mt-2 pt-2 border-t border-[#444]">
                 <input 
                    type="text" 
                    placeholder="Digite emoji personalizado..." 
                    className="w-full bg-[#191919] border border-[#333] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                    maxLength={2}
                    onChange={(e) => {
                        if(e.target.value) {
                             onSelect(e.target.value);
                             onClose();
                        }
                    }}
                    autoFocus
                 />
             </div>
        </div>
    );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Users State (managed via userService)
  const [users, setUsers] = useState<any[]>([]);

  // App Visibility Settings
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      try {
          const saved = localStorage.getItem('ajm_app_settings');
          return saved ? JSON.parse(saved) : { showSidebar: true, showBreadcrumbs: true, showGreeting: true };
      } catch {
          return { showSidebar: true, showBreadcrumbs: true, showGreeting: true };
      }
  });

  const [navState, setNavState] = useState<NavigationState>('HOME');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [viewType, setViewType] = useState<ViewType>(ViewType.DOCUMENT);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false); // Sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  
  // Menus & Modals
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<string | null>(null); // For repositioning flow
  const [pickerTarget, setPickerTarget] = useState<string | null>(null); // ID of project getting new icon
  
  // Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Toast Notification
  const [toast, setToast] = useState<{message: string, onUndo?: () => void} | null>(null);
  
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed
  const currentProject = projects.find(p => p.id === currentProjectId);
  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  
  const isAdmin = currentUser?.role === 'admin';

  // Init Users from Service
  useEffect(() => {
    userService.getAllUsers().then(fetchedUsers => {
        setUsers(fetchedUsers);
    });
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('ajm_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
              setShowStyleMenu(false);
          }
          // Close emoji picker if clicking elsewhere
          const target = event.target as HTMLElement;
          if (!target.closest('.emoji-trigger') && !target.closest('.emoji-picker-container')) {
              setPickerTarget(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers ---

  const handleLogin = (user: User) => {
      setCurrentUser(user);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setNavState('HOME');
      setIsSettingsOpen(false);
  };

  const handleAddUser = async (newUser: User & { password?: string }) => {
      // Use Service
      const created = await userService.createUser(newUser);
      setUsers(prev => [...prev, created]);
  };

  const handleUpdateUser = async (updatedUser: User & { password?: string }) => {
      // Use Service
      const updated = await userService.updateUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      
      // Update current user if it's me
      if (currentUser && currentUser.id === updated.id) {
          setCurrentUser({ ...currentUser, ...updated });
      }
  };

  const handleDeleteUser = async (userId: string) => {
      // Use Service
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleCreateProject = () => {
    if (!isAdmin) return; // Guard
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: 'Sem Título',
      icon: '📄',
      updatedAt: new Date(),
      status: 'active',
      content: '',
      kanbanData: [
        { id: 'todo', title: 'A Fazer', tasks: [] },
        { id: 'prog', title: 'Em Progresso', tasks: [] },
        { id: 'done', title: 'Concluído', tasks: [] }
      ],
      ishikawaData: { effect: "Problema", categories: [] },
      scrumData: { backlog: [], sprints: [] }
    };
    setProjects([newProject, ...projects]);
    setCurrentProjectId(newProject.id);
    setNavState('PROJECT');
    setViewType(ViewType.DOCUMENT);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p));
  };

  const toggleProjectStatus = (id: string) => {
      if (!isAdmin) return; // Guard
      const project = projects.find(p => p.id === id);
      if (!project) return;
      
      const newStatus = project.status === 'active' ? 'completed' : 'active';
      updateProject(id, { status: newStatus });

      // Show Undo Toast
      if (newStatus === 'completed') {
          setToast({
              message: 'Projeto movido para o arquivo',
              onUndo: () => updateProject(id, { status: 'active' }) 
          });
      } else {
          setToast({
              message: 'Projeto restaurado para ativo',
              onUndo: () => updateProject(id, { status: 'completed' })
          });
      }
      setTimeout(() => setToast(null), 6000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
            setPendingUpload(event.target.result as string);
            setShowStyleMenu(false);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSaveReposition = (positionY: number) => {
      if (currentProjectId && pendingUpload) {
          updateProject(currentProjectId, { 
              cover: `url(${pendingUpload})`,
              coverPositionY: positionY 
          });
          setPendingUpload(null);
      }
  };

  const handleGenerateKanban = async () => {
    if (!currentProject) return;
    setIsAiLoading(true);
    const columns = await generateKanbanBoard(currentProject.title, currentProject.content);
    setIsAiLoading(false);
    
    if (columns.length > 0) {
      updateProject(currentProject.id, { kanbanData: columns });
    }
  };

  const handleGenerateIshikawa = async () => {
     if (!currentProject) return;
     const problem = prompt("Qual é o problema/efeito central que você deseja analisar?", currentProject.ishikawaData.effect);
     if(!problem) return;

     setIsAiLoading(true);
     const data = await generateIshikawaData(problem);
     setIsAiLoading(false);

     if (data) {
       updateProject(currentProject.id, { ishikawaData: data });
     }
  };

  const handleGenerateBacklog = async () => {
      if (!currentProject) return;
      setIsAiLoading(true);
      const items = await generateScrumBacklog(currentProject.title, currentProject.content);
      setIsAiLoading(false);
      
      if(items && items.length > 0) {
          updateProject(currentProject.id, {
              scrumData: {
                  ...currentProject.scrumData,
                  backlog: [...currentProject.scrumData.backlog, ...items]
              }
          });
      }
  };

  // --- Render Helpers ---

  const renderSidebar = () => (
    <div className={`h-screen bg-notion-sidebar border-r border-[#333] flex flex-col transition-all duration-300 ${appSettings.showSidebar && isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
      <div className="p-4 flex items-center justify-between group">
        <div className="flex items-center gap-2 font-medium truncate">
          <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center text-xs">A</div>
          <span>AJM OneSystem</span>
        </div>
      </div>

      <div className="px-2 space-y-1">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-notion-muted hover:bg-notion-hover hover:text-notion-text rounded-md text-sm">
          <Search size={16} /> Pesquisar
        </button>
        <button 
          onClick={() => setNavState('HOME')}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${navState === 'HOME' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
        >
          <Home size={16} /> Início
        </button>
        
        {/* Admin Dashboard Link */}
        {isAdmin && (
            <button 
                onClick={() => setNavState('ADMIN_DASHBOARD')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${navState === 'ADMIN_DASHBOARD' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
            >
                <LayoutDashboard size={16} /> Painel
            </button>
        )}

        {isAdmin && (
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-notion-muted hover:bg-notion-hover hover:text-notion-text rounded-md text-sm"
            >
                <Settings size={16} /> Configurações
            </button>
        )}
        
        {/* Chat Toggle in Sidebar */}
        <button 
            onClick={() => { setIsChatOpen(true); setUnreadMessages(0); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm relative ${isChatOpen ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
        >
          <MessageSquare size={16} /> Chat da Equipe
          {unreadMessages > 0 && !isChatOpen && (
              <span className="absolute right-2 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadMessages}
              </span>
          )}
        </button>
      </div>

      <div className="mt-6 px-4 flex-1 overflow-y-auto">
        {/* ACTIVE PROJECTS */}
        <div className="text-xs font-semibold text-notion-muted mb-2 flex justify-between items-center">
            <span>PRIVADO</span>
            {isAdmin && <Plus size={14} className="cursor-pointer hover:text-white" onClick={handleCreateProject}/>}
        </div>
        <div className="space-y-0.5 mb-6">
          {activeProjects.map(p => (
            <div 
              key={p.id}
              onClick={() => { setCurrentProjectId(p.id); setNavState('PROJECT'); }}
              className={`group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer ${currentProjectId === p.id && navState === 'PROJECT' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
            >
              <span className="text-base">{p.icon}</span>
              <span className="truncate flex-1">{p.title}</span>
              {isAdmin && (
                <div 
                    onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) setProjects(projects.filter(pr => pr.id !== p.id)); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#444] rounded"
                >
                    <Trash2 size={12}/>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* COMPLETED PROJECTS */}
        {completedProjects.length > 0 && (
            <div>
                 <div 
                    className="text-xs font-semibold text-notion-muted mb-2 flex items-center gap-1 cursor-pointer hover:text-gray-400"
                    onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                 >
                     <ChevronDown size={12} className={`transition-transform ${!isCompletedOpen ? '-rotate-90' : ''}`}/>
                     <span>CONCLUÍDO</span>
                 </div>
                 {isCompletedOpen && (
                    <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                        {completedProjects.map(p => (
                            <div 
                            key={p.id}
                            onClick={() => { setCurrentProjectId(p.id); setNavState('PROJECT'); }}
                            className={`group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer opacity-70 hover:opacity-100 ${currentProjectId === p.id && navState === 'PROJECT' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
                            >
                            <span className="text-base grayscale">{p.icon}</span>
                            <span className="truncate flex-1 line-through decoration-white/20">{p.title}</span>
                            {isAdmin && (
                                <div 
                                    onClick={(e) => { e.stopPropagation(); toggleProjectStatus(p.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#444] rounded text-notion-muted hover:text-green-400 transition-all"
                                    title="Restaurar projeto"
                                >
                                    <RotateCcw size={12}/>
                                </div>
                            )}
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        )}
      </div>

      {/* User Profile / Logout */}
      <div className="p-4 border-t border-[#333] bg-[#1c1c1c]">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">
                      {currentUser?.avatar}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-medium">{currentUser?.name}</span>
                      <span className="text-[10px] text-notion-muted capitalize">{currentUser?.role}</span>
                  </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-red-400 transition-colors"
                title="Sair"
              >
                  <LogOut size={16} />
              </button>
          </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="relative min-h-full w-full">
      {/* Background decoration for Home - Only applied here */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="p-12 max-w-5xl mx-auto w-full relative z-10">
      {appSettings.showGreeting && (
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-4xl font-bold mb-2">Boa tarde, {currentUser?.name}</h1>
            <p className="text-notion-muted text-sm">Logado como {currentUser?.role}</p>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Recently Visited Cards */}
        {activeProjects.slice(0, 4).map(p => (
           <div 
             key={p.id} 
             onClick={() => { setCurrentProjectId(p.id); setNavState('PROJECT'); }}
             className="bg-notion-card rounded-lg hover:bg-notion-hover cursor-pointer group transition-all overflow-hidden flex flex-col h-32 relative shadow-lg shadow-black/20"
           >
             {/* Card Cover */}
             <div 
                className="h-12 w-full shrink-0 relative overflow-hidden"
                style={{ 
                    background: p.cover || '#333', 
                    backgroundSize: 'cover', 
                    backgroundPosition: `center ${p.coverPositionY ?? 50}%` 
                }}
             >
                 {p.coverText && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                         <span className="text-white text-[10px] font-bold uppercase tracking-wide truncate max-w-[90%]">{p.coverText}</span>
                     </div>
                 )}
             </div>
             <div className="p-4 pt-6 relative flex-1 flex flex-col justify-end">
                <div 
                    className="text-2xl absolute -top-5 left-3 hover:bg-[#333] rounded p-1 transition-colors z-10 emoji-trigger relative"
                    onClick={(e) => {
                        e.stopPropagation();
                        setPickerTarget(pickerTarget === p.id ? null : p.id);
                    }}
                >
                    {p.icon}
                    {pickerTarget === p.id && (
                        <div className="emoji-picker-container" onClick={e => e.stopPropagation()}>
                            <EmojiPicker 
                                onSelect={(emoji) => updateProject(p.id, { icon: emoji })} 
                                onClose={() => setPickerTarget(null)}
                            />
                        </div>
                    )}
                </div>
                <div className="font-medium text-sm mb-1 truncate">{p.title}</div>
                <div className="flex items-center text-xs text-notion-muted gap-1">
                    <Clock size={12} /> {p.updatedAt.toLocaleDateString()}
                </div>
             </div>
           </div>
        ))}
        {isAdmin && (
            <div 
                onClick={handleCreateProject}
                className="bg-notion-card p-4 rounded-lg hover:bg-notion-hover cursor-pointer group flex flex-col items-center justify-center text-notion-muted hover:text-white h-32 border border-dashed border-[#444] hover:border-gray-500"
            >
                <Plus size={24} className="mb-2"/>
                <span className="text-sm">Novo Projeto</span>
            </div>
        )}
      </div>

      <div className="mb-8">
         <h2 className="text-sm font-semibold text-notion-muted uppercase mb-4">Aprenda</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-notion-card rounded-lg overflow-hidden hover:bg-notion-hover cursor-pointer shadow-lg shadow-black/20">
                 <div className="h-24 bg-gradient-to-r from-blue-900 to-slate-900"></div>
                 <div className="p-3">
                     <h3 className="font-medium text-sm mb-1">Começando com Kanbans</h3>
                     <p className="text-xs text-notion-muted">Organize suas tarefas de forma eficaz.</p>
                 </div>
             </div>
             <div className="bg-notion-card rounded-lg overflow-hidden hover:bg-notion-hover cursor-pointer shadow-lg shadow-black/20">
                 <div className="h-24 bg-gradient-to-r from-green-900 to-teal-900"></div>
                 <div className="p-3">
                     <h3 className="font-medium text-sm mb-1">Básico de Ishikawa</h3>
                     <p className="text-xs text-notion-muted">Encontre a causa raiz de qualquer problema.</p>
                 </div>
             </div>
         </div>
      </div>
    </div>
    </div>
  );

  const renderProject = () => {
    if (!currentProject) return null;

    return (
      <div 
        className="flex flex-col h-full overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: currentProject.theme || '#191919' }}
      >
        {/* Project Header (Top Bar) */}
        {appSettings.showBreadcrumbs && (
            <div className="h-12 flex items-center justify-between px-4 sticky top-0 z-20 bg-inherit/90 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <span className="text-notion-muted text-sm cursor-pointer hover:underline" onClick={() => setNavState('HOME')}>Início</span>
                <span className="text-notion-muted">/</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-sm font-medium">
                    <span className="emoji-trigger relative" onClick={(e) => {
                        e.stopPropagation();
                        setPickerTarget(pickerTarget === 'header' ? null : 'header');
                    }}>
                        {currentProject.icon}
                        {pickerTarget === 'header' && (
                            <div className="emoji-picker-container" onClick={ev => ev.stopPropagation()}>
                                <EmojiPicker 
                                    onSelect={(emoji) => updateProject(currentProject.id, { icon: emoji })} 
                                    onClose={() => setPickerTarget(null)}
                                />
                            </div>
                        )}
                    </span>
                    <span>{currentProject.title}</span>
                </div>
                {currentProject.status === 'completed' && (
                    <div className="flex items-center gap-2">
                            <span className="bg-orange-500/20 text-orange-400 text-[10px] px-1.5 py-0.5 rounded border border-orange-500/30 select-none">ARQUIVADO</span>
                            {isAdmin && (
                                <button 
                                    onClick={() => toggleProjectStatus(currentProject.id)}
                                    className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-[10px] text-notion-muted hover:text-white px-2 py-0.5 rounded transition-colors border border-white/5 hover:border-white/10"
                                    title="Restaurar projeto"
                                >
                                    <RotateCcw size={10}/> Restaurar
                                </button>
                            )}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3 relative">
                <span className="text-xs text-notion-muted">Editado {currentProject.updatedAt.toLocaleTimeString()}</span>
                
                {/* Customization Menu */}
                {isAdmin && (
                    <div className="relative" ref={styleMenuRef}>
                            <button 
                                onClick={() => setShowStyleMenu(!showStyleMenu)}
                                className="text-notion-muted hover:text-white p-1 hover:bg-white/10 rounded"
                            >
                                <MoreHorizontal size={18}/>
                            </button>
                            {showStyleMenu && (
                                <div className="absolute right-0 top-8 w-72 bg-[#2C2C2C] border border-[#444] rounded-lg shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
                                    {/* Cover Image Section */}
                                    <div>
                                        <div className="text-xs font-semibold text-notion-muted mb-2 uppercase flex items-center gap-2">
                                            <ImageIcon size={12}/> Imagem de Capa
                                        </div>
                                        <div className="grid grid-cols-5 gap-1 mb-2">
                                            {COVERS.map((cover, i) => (
                                                <div 
                                                    key={i}
                                                    onClick={() => updateProject(currentProject.id, { cover: cover === '#2C2C2C' ? undefined : cover })}
                                                    className="h-8 rounded cursor-pointer hover:ring-2 ring-white/50 transition-all border border-white/10"
                                                    style={{ background: cover }}
                                                    title="Alterar Capa"
                                                />
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full text-xs text-notion-muted hover:text-white bg-[#333] hover:bg-[#444] border border-[#444] rounded py-1.5 flex items-center justify-center gap-2 transition-colors mb-2"
                                        >
                                            <Upload size={12}/> Carregar Personalizada
                                        </button>
                                        {/* Only show Reposition if it's an image (URL) */}
                                        {getCoverUrl(currentProject.cover) && (
                                            <button 
                                                onClick={() => {
                                                    const url = getCoverUrl(currentProject.cover);
                                                    if(url) {
                                                        setPendingUpload(url); 
                                                        setShowStyleMenu(false);
                                                    }
                                                }}
                                                className="w-full text-xs text-notion-muted hover:text-white bg-[#333] hover:bg-[#444] border border-[#444] rounded py-1.5 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <MoveVertical size={12}/> Reposicionar
                                            </button>
                                        )}
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                        />
                                    </div>

                                    {/* Cover Text Section */}
                                    <div>
                                        <div className="text-xs font-semibold text-notion-muted mb-2 uppercase flex items-center gap-2">
                                            <Type size={12}/> Texto do Banner
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="Adicione texto ao banner..."
                                            className="w-full bg-[#191919] border border-[#444] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-blue-500 outline-none"
                                            value={currentProject.coverText || ''}
                                            onChange={(e) => updateProject(currentProject.id, { coverText: e.target.value })}
                                        />
                                    </div>

                                    {/* Theme Section */}
                                    <div>
                                        <div className="text-xs font-semibold text-notion-muted mb-2 uppercase flex items-center gap-2">
                                            <Palette size={12}/> Tema de Fundo
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {THEMES.map((theme, i) => (
                                                <div 
                                                    key={i}
                                                    onClick={() => updateProject(currentProject.id, { theme })}
                                                    className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform border border-white/20"
                                                    style={{ background: theme }}
                                                    title="Alterar Tema"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                )}
            </div>
            </div>
        )}

        {/* Project Cover Banner */}
        <div className="relative group shrink-0">
            {currentProject.cover ? (
                <div 
                    className="h-44 w-full transition-all relative overflow-hidden"
                    style={{ 
                        background: currentProject.cover,
                        backgroundSize: 'cover',
                        backgroundPosition: `center ${currentProject.coverPositionY ?? 50}%` 
                    }}
                >
                    {/* Optional Text Overlay */}
                    {currentProject.coverText && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-[1px]">
                            <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg text-center px-4">
                                {currentProject.coverText}
                            </h2>
                        </div>
                    )}
                    
                    {isAdmin && (
                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                             {getCoverUrl(currentProject.cover) && (
                                <button 
                                    onClick={(e) => {
                                         e.stopPropagation();
                                         const url = getCoverUrl(currentProject.cover);
                                         if(url) setPendingUpload(url);
                                    }}
                                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-md backdrop-blur-md border border-white/10 flex items-center gap-2 text-xs font-medium shadow-sm"
                                >
                                    <MoveVertical size={14} /> Reposicionar
                                </button>
                             )}
                             <button 
                                onClick={(e) => { e.stopPropagation(); setShowStyleMenu(true); }}
                                className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-md backdrop-blur-md border border-white/10 flex items-center gap-2 text-xs font-medium shadow-sm"
                             >
                                 <ImageIcon size={14} /> Alterar Capa
                             </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-12 w-full group-hover:bg-white/5 transition-colors flex items-center px-12 text-sm text-notion-muted opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => isAdmin && setShowStyleMenu(true)}>
                    <ImageIcon size={14} className="mr-2"/> Adicionar Capa
                </div>
            )}
        </div>

        {/* View Switcher & Title */}
        <div className="px-12 pb-4 flex flex-col h-full overflow-hidden">
            <div className="group relative mb-6 mt-8 z-30">
                 <input 
                    className="text-4xl font-bold bg-transparent border-none outline-none w-full text-white placeholder-white/20"
                    value={currentProject.title}
                    onChange={(e) => updateProject(currentProject.id, { title: e.target.value })}
                    placeholder="Sem Título"
                    disabled={!isAdmin}
                 />
            </div>

            <div className="flex items-center gap-4 border-b border-white/10 mb-6 shrink-0">
                <button 
                    onClick={() => setViewType(ViewType.DOCUMENT)}
                    className={`pb-2 text-sm flex items-center gap-2 transition-colors ${viewType === ViewType.DOCUMENT ? 'border-b-2 border-white text-white' : 'text-notion-muted hover:text-white'}`}
                >
                    <FileText size={16}/> Documento
                </button>
                <button 
                    onClick={() => setViewType(ViewType.KANBAN)}
                    className={`pb-2 text-sm flex items-center gap-2 transition-colors ${viewType === ViewType.KANBAN ? 'border-b-2 border-white text-white' : 'text-notion-muted hover:text-white'}`}
                >
                    <Trello size={16}/> Kanban
                </button>
                <button 
                    onClick={() => setViewType(ViewType.ISHIKAWA)}
                    className={`pb-2 text-sm flex items-center gap-2 transition-colors ${viewType === ViewType.ISHIKAWA ? 'border-b-2 border-white text-white' : 'text-notion-muted hover:text-white'}`}
                >
                    <GitMerge size={16} className="rotate-90"/> Ishikawa
                </button>
                <button 
                    onClick={() => setViewType(ViewType.SCRUM)}
                    className={`pb-2 text-sm flex items-center gap-2 transition-colors ${viewType === ViewType.SCRUM ? 'border-b-2 border-white text-white' : 'text-notion-muted hover:text-white'}`}
                >
                    <ListTodo size={16}/> Scrum
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden min-h-0">
                {viewType === ViewType.DOCUMENT && (
                    <textarea 
                        className="w-full h-full bg-transparent resize-none outline-none text-gray-300 leading-relaxed p-4"
                        placeholder="Digite '/' para comandos..."
                        value={currentProject.content}
                        onChange={(e) => updateProject(currentProject.id, { content: e.target.value })}
                    />
                )}

                {viewType === ViewType.KANBAN && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <p className="text-sm text-notion-muted">Arraste os cartões para atualizar o status. Clique para editar.</p>
                            <button 
                                onClick={handleGenerateKanban}
                                disabled={isAiLoading}
                                className="flex items-center gap-2 bg-purple-600/20 text-purple-300 px-3 py-1.5 rounded text-xs hover:bg-purple-600/30 transition-colors border border-purple-500/30"
                            >
                                <Brain size={14} />
                                {isAiLoading ? 'Gerando...' : 'Gerar Colunas Automaticamente'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                             <KanbanBoard 
                                data={currentProject.kanbanData} 
                                onChange={(newData) => updateProject(currentProject.id, { kanbanData: newData })}
                            />
                        </div>
                    </div>
                )}

                {viewType === ViewType.ISHIKAWA && (
                    <div className="h-full flex flex-col">
                         <div className="flex justify-between items-center mb-4 shrink-0">
                             <div className="text-sm text-notion-muted">
                                 Efeito: <span className="text-white font-semibold">{currentProject.ishikawaData.effect}</span>
                             </div>
                             <button 
                                onClick={handleGenerateIshikawa}
                                disabled={isAiLoading}
                                className="flex items-center gap-2 bg-blue-600/20 text-blue-300 px-3 py-1.5 rounded text-xs hover:bg-blue-600/30 transition-colors border border-blue-500/30"
                            >
                                <Brain size={14} />
                                {isAiLoading ? 'Analisando...' : 'Gerar com IA'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                             <IshikawaDiagram data={currentProject.ishikawaData} />
                        </div>
                    </div>
                )}
                
                {viewType === ViewType.SCRUM && (
                     <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <p className="text-sm text-notion-muted">Planeje sprints movendo itens do backlog para sprints ativos.</p>
                            <button 
                                onClick={handleGenerateBacklog}
                                disabled={isAiLoading}
                                className="flex items-center gap-2 bg-green-600/20 text-green-300 px-3 py-1.5 rounded text-xs hover:bg-green-600/30 transition-colors border border-green-500/30"
                            >
                                <Brain size={14} />
                                {isAiLoading ? 'Gerando...' : 'Gerar Histórias de Usuário'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                             <ScrumBoard 
                                data={currentProject.scrumData || { backlog: [], sprints: [] }}
                                onChange={(newData) => updateProject(currentProject.id, { scrumData: newData })}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  };

  if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} users={users} />;
  }

  return (
    <div className="flex h-screen bg-[#191919] text-[#D4D4D4] font-sans selection:bg-[#2383E2] selection:text-white overflow-hidden">
      {/* Mobile Toggle */}
      {!isSidebarOpen && appSettings.showSidebar && (
          <div className="absolute top-4 left-4 z-50">
             <Menu className="cursor-pointer text-notion-muted hover:text-white" onClick={() => setIsSidebarOpen(true)}/>
          </div>
      )}

      {/* Floating Toggle if Sidebar is completely disabled via settings */}
      {!appSettings.showSidebar && (
          <div className="absolute top-4 left-4 z-50">
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/50 hover:text-white" title="Abrir Configurações">
                  <Settings size={20}/>
              </button>
          </div>
      )}

      {renderSidebar()}
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Main Scroller */}
          <div className="flex-1 overflow-y-auto h-full">
             {navState === 'HOME' && renderHome()}
             {navState === 'PROJECT' && renderProject()}
             {navState === 'ADMIN_DASHBOARD' && (
                 <AdminDashboard 
                    projects={projects} 
                    users={users} 
                    onNavigateToProject={(id) => { setCurrentProjectId(id); setNavState('PROJECT'); }}
                 />
             )}
          </div>

          {/* Toast Notification */}
          {toast && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-3 rounded-md shadow-2xl flex items-center gap-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 min-w-[300px] justify-between">
                  <span className="text-sm font-medium">{toast.message}</span>
                  <div className="flex items-center gap-3">
                      {toast.onUndo && (
                          <button 
                            onClick={() => { toast.onUndo?.(); setToast(null); }}
                            className="text-sm font-bold text-blue-600 hover:underline"
                          >
                              Desfazer
                          </button>
                      )}
                      <button onClick={() => setToast(null)} className="text-gray-400 hover:text-black transition-colors">
                          <X size={16}/>
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* Global Chat Overlay */}
      {currentUser && (
        <GlobalChat 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            onNewMessage={() => setUnreadMessages(prev => prev + 1)}
            currentUser={currentUser}
            users={users}
        />
      )}

      {/* Settings Modal (User Management) */}
      <SettingsModal 
         isOpen={isSettingsOpen} 
         onClose={() => setIsSettingsOpen(false)}
         users={users}
         onAddUser={handleAddUser}
         onUpdateUser={handleUpdateUser}
         onDeleteUser={handleDeleteUser}
         currentUserId={currentUser.id}
         appSettings={appSettings}
         setAppSettings={setAppSettings}
      />

      {/* Reposition Modal */}
      {pendingUpload && (
          <RepositionModal 
            image={pendingUpload} 
            onSave={handleSaveReposition}
            onCancel={() => setPendingUpload(null)}
          />
      )}
    </div>
  );
}

export default App;