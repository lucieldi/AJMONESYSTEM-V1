
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Menu, Search, Home, Plus, Settings, MoreHorizontal, 
  FileText, Trello, GitMerge, ChevronRight, Clock, Trash2, Brain, 
  Image as ImageIcon, Palette, Upload, Type, Archive, RotateCcw, ChevronDown, Smile, X, MoveVertical,
  ListTodo, MessageSquare, LogOut, User as UserIcon, LayoutDashboard,
  LifeBuoy, Monitor, Briefcase, TrendingUp, ShieldCheck
} from 'lucide-react';
import { Project, NavigationState, ViewType, KanbanColumn, IshikawaData, ScrumData, User, AppSettings, SupportTicket, ChatMessage } from './types';
import KanbanBoard from './components/KanbanBoard';
import IshikawaDiagram from './components/IshikawaDiagram';
import ScrumBoard from './components/ScrumBoard';
import GlobalChat from './components/GlobalChat';
import LoginScreen from './components/LoginScreen';
import SettingsModal from './components/SettingsModal';
import AdminDashboard from './components/AdminDashboard';
import SupportHelpdesk from './components/SupportHelpdesk';
import { generateKanbanBoard, generateIshikawaData, generateScrumBacklog } from './services/geminiService';
import { userService } from './services/userService';
import { projectService } from './services/projectService';

// --- Constants ---

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

const DEFAULT_SETTINGS: AppSettings = {
    showSidebar: true,
    showBreadcrumbs: true,
    showGreeting: true,
    sidebarHoverBehavior: false,
    theme: 'dark'
};

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
  
  // Data State
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]); 

  // App Visibility Settings (Persisted)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      try {
          const saved = localStorage.getItem('ajm_app_settings');
          // Merge saved settings with defaults to ensure new properties (like sidebarHoverBehavior) are populated
          return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
      } catch {
          return DEFAULT_SETTINGS;
      }
  });

  const [navState, setNavState] = useState<NavigationState>('HOME');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
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

  const isAdmin = currentUser?.role === 'admin';

  // --- PERMISSION LOGIC ---
  // Everyone sees all projects (Collaboration mode), but only Admins can create.
  const visibleProjects = useMemo(() => {
      if (!currentUser) return [];
      return projects;
  }, [projects, currentUser]);

  const activeProjects = useMemo(() => visibleProjects.filter(p => p.status === 'active'), [visibleProjects]);
  const completedProjects = useMemo(() => visibleProjects.filter(p => p.status === 'completed'), [visibleProjects]);
  
  const currentProject = projects.find(p => p.id === currentProjectId);

  // --- Init Data from Backend ---
  useEffect(() => {
    // Load Users
    userService.getAllUsers().then(fetchedUsers => {
        setUsers(fetchedUsers);
    });

    // Load Projects
    projectService.getProjects().then(fetchedProjects => {
        setProjects(fetchedProjects);
    });

    const savedTickets = localStorage.getItem('ajm_support_tickets');
    if (savedTickets) {
        setSupportTickets(JSON.parse(savedTickets));
    }
  }, []);

  // Persist settings & Apply Theme
  useEffect(() => {
    localStorage.setItem('ajm_app_settings', JSON.stringify(appSettings));
    
    // Apply Theme
    const root = document.documentElement;
    if (appSettings.theme === 'light') {
        root.classList.remove('dark');
        // Force background for body
        document.body.style.backgroundColor = '#f3f4f6';
        document.body.style.color = '#1f2937';
    } else {
        root.classList.add('dark');
        document.body.style.backgroundColor = '#191919';
        document.body.style.color = '#D4D4D4';
    }

  }, [appSettings]);

  // Persist tickets (Simulated persistence)
  useEffect(() => {
      localStorage.setItem('ajm_support_tickets', JSON.stringify(supportTickets));
  }, [supportTickets]);

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

  // --- User Handlers ---
  const handleAddUser = async (newUser: User & { password?: string }) => {
      try {
        const created = await userService.createUser(newUser);
        setUsers(prev => {
            // Prevent duplicates (Defensive check)
            if (prev.some(u => u.id === created.id || u.username === created.username)) {
                return prev;
            }
            return [...prev, created];
        });
      } catch (e) {
          console.error(e);
          alert("Não foi possível criar o usuário. Verifique se o nome já está em uso.");
      }
  };

  const handleUpdateUser = async (updatedUser: User & { password?: string }) => {
      const updated = await userService.updateUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      
      if (currentUser && currentUser.id === updated.id) {
          setCurrentUser({ ...currentUser, ...updated });
      }
  };

  const handleDeleteUser = async (userId: string) => {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // --- Project Handlers (With Persistence) ---

  const saveProjectsChanges = (newProjects: Project[]) => {
      setProjects(newProjects);
      projectService.saveProjects(newProjects); // Save to Backend/Local
  };

  const handleCreateProject = () => {
    if (!currentUser) return;
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: 'Sem Título',
      icon: '📄',
      updatedAt: new Date(),
      status: 'active',
      createdBy: currentUser.id, // Assign Ownership
      content: '',
      kanbanData: [
        { id: 'todo', title: 'A Fazer', tasks: [] },
        { id: 'prog', title: 'Em Progresso', tasks: [] },
        { id: 'done', title: 'Concluído', tasks: [] }
      ],
      ishikawaData: { effect: "Problema", categories: [] },
      scrumData: { backlog: [], sprints: [] }
    };
    
    const newProjects = [newProject, ...projects];
    saveProjectsChanges(newProjects);
    
    setCurrentProjectId(newProject.id);
    setNavState('PROJECT');
    setViewType(ViewType.DOCUMENT);
  };

  // Simplified to only create Campaign
  const handleCreateCampaign = () => {
      if (!currentUser) return;
      
      const newProject: Project = {
          id: crypto.randomUUID(),
          title: 'Nova Campanha de Marketing',
          icon: '📢',
          updatedAt: new Date(),
          status: 'active',
          createdBy: currentUser.id,
          content: '# Briefing da Campanha\n\n**Objetivo:** Aumentar vendas Q3.\n**Público Alvo:** PME.\n\n## Canais\n- [ ] Instagram\n- [ ] LinkedIn\n- [ ] Email Marketing',
          kanbanData: [
              { id: 'c1', title: 'Ideação', tasks: [] },
              { id: 'c2', title: 'Produção', tasks: [] },
              { id: 'c3', title: 'Aprovação', tasks: [] },
              { id: 'c4', title: 'No Ar', tasks: [] }
          ],
          ishikawaData: { effect: "Problema", categories: [] },
          scrumData: { backlog: [], sprints: [] }
      };

      const newProjects = [newProject, ...projects];
      saveProjectsChanges(newProjects);
      
      setCurrentProjectId(newProject.id);
      setNavState('PROJECT');
      setViewType(ViewType.KANBAN);
  };

  const handleCreateTemplateProject = (type: 'kanban' | 'ishikawa') => {
    if (!currentUser) return;
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: type === 'kanban' ? 'Tutorial Kanban' : 'Tutorial Ishikawa',
      icon: type === 'kanban' ? '📋' : '🐟',
      updatedAt: new Date(),
      status: 'active',
      createdBy: currentUser.id,
      content: type === 'kanban' 
        ? '# Tutorial Kanban\n\nEste projeto foi criado automaticamente para demonstrar o uso do quadro Kanban.'
        : '# Tutorial Ishikawa\n\nEste projeto foi criado automaticamente para demonstrar o Diagrama de Ishikawa.',
      kanbanData: [
        { 
            id: 'todo', title: 'A Fazer', color: '#EF4444', 
            tasks: [
                { id: crypto.randomUUID(), content: 'Bem-vindo ao Kanban!', priority: 'Low', icon: '👋' }
            ] 
        },
        { 
            id: 'prog', title: 'Em Progresso', color: '#3B82F6', 
            tasks: [] 
        },
        { 
            id: 'done', title: 'Concluído', color: '#10B981', 
            tasks: [] 
        }
      ],
      ishikawaData: { 
          effect: "Atraso no Projeto", 
          categories: [
              { name: "Método", causes: ["Processo não definido"] }
          ] 
      },
      scrumData: { backlog: [], sprints: [] }
    };
    
    const newProjects = [newProject, ...projects];
    saveProjectsChanges(newProjects);
    
    setCurrentProjectId(newProject.id);
    setNavState('PROJECT');
    setViewType(type === 'kanban' ? ViewType.KANBAN : ViewType.ISHIKAWA);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const newProjects = projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p);
    saveProjectsChanges(newProjects);
  };

  const toggleProjectStatus = (id: string) => {
      const project = projects.find(p => p.id === id);
      if (!project) return;
      
      const newStatus = project.status === 'active' ? 'completed' : 'active';
      updateProject(id, { status: newStatus });

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

  const handleResetSettings = () => {
      if (confirm('Tem certeza que deseja restaurar as configurações de aparência para o padrão?')) {
          setAppSettings(DEFAULT_SETTINGS);
          setToast({ message: 'Configurações restauradas com sucesso!' });
          setTimeout(() => setToast(null), 3000);
      }
  };

  // --- Ticket Handlers ---
  const handleAddTicket = (ticket: SupportTicket) => {
      setSupportTickets(prev => [ticket, ...prev]);
      setToast({ message: 'Chamado criado com sucesso!' });
      setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
      setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
  };

  // --- Chat Notifications ---
  const handleChatNotification = (msg: ChatMessage) => {
      if (!currentUser) return;

      // Only increment unread if chat is closed
      if (!isChatOpen) {
          // Note: GlobalChat calculates total unreads on sync, but for immediate feedback:
          // We rely on GlobalChat's polling/sync to update the total count via setTotalUnread prop
      }
      
      const isPrivate = msg.recipientId === currentUser.username;
      
      if (isPrivate || !isChatOpen) {
          const sender = users.find(u => u.username === msg.senderId)?.name || msg.senderId;
          const prefix = isPrivate ? 'Mensagem Privada' : 'Chat da Equipe';
          
          setToast({
              message: `🔔 ${prefix} de ${sender}: "${msg.text.substring(0, 20)}${msg.text.length > 20 ? '...' : ''}"`
          });
          
          try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
              audio.volume = 0.5;
              audio.play().catch(e => console.log('Audio autoplay blocked', e));
          } catch (e) {
              console.warn("Audio playback failed");
          }
      }
  };


  // --- AI Handlers ---

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
    <div 
        onMouseLeave={() => {
            if (appSettings.sidebarHoverBehavior) {
                setIsSidebarOpen(false);
            }
        }}
        className={`fixed inset-y-0 left-0 z-40 bg-notion-sidebar border-r border-[#333] flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${
            appSettings.showSidebar && isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:overflow-hidden'
        }`}
    >
      <div className="p-4 flex items-center justify-between group">
        <div className="flex items-center gap-2 font-medium truncate">
          <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center text-xs text-white font-bold">A</div>
          <span>AJM OneSystem</span>
        </div>
      </div>

      <div className="px-2 space-y-1">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-notion-muted hover:bg-notion-hover hover:text-notion-text rounded-md text-sm">
          <Search size={16} /> Pesquisar
        </button>
        <button 
          onClick={() => { setNavState('HOME'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${navState === 'HOME' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
        >
          <Home size={16} /> Início
        </button>
        
        {/* Admin Dashboard Link */}
        {isAdmin && (
            <button 
                onClick={() => { setNavState('ADMIN_DASHBOARD'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${navState === 'ADMIN_DASHBOARD' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
            >
                <LayoutDashboard size={16} className="text-blue-400" /> Painel Admin
            </button>
        )}

        {/* Settings Toggle in Sidebar */}
        <button 
            onClick={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-notion-muted hover:bg-notion-hover hover:text-notion-text rounded-md text-sm"
        >
            <Settings size={16} /> Configurações
        </button>
        
        {/* Chat Toggle in Sidebar */}
        <button 
            onClick={() => { setIsChatOpen(true); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm relative ${isChatOpen ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
        >
          <MessageSquare size={16} /> Chat da Equipe
          {unreadMessages > 0 && !isChatOpen && (
              <span className="absolute right-2 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
          )}
        </button>
      </div>

      <div className="mt-6 px-4 flex-1 overflow-y-auto">
        {/* ACTIVE PROJECTS */}
        <div className="text-xs font-semibold text-notion-muted mb-2 flex justify-between items-center">
            <span>{isAdmin ? 'TODOS OS PROJETOS' : 'MEUS PROJETOS'}</span>
            <Plus size={14} className="cursor-pointer hover:text-white" onClick={handleCreateProject}/>
        </div>
        <div className="space-y-0.5 mb-6">
          {activeProjects.map(p => (
            <div 
              key={p.id}
              onClick={() => { setCurrentProjectId(p.id); setNavState('PROJECT'); setIsSidebarOpen(false); }}
              className={`group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer ${currentProjectId === p.id && navState === 'PROJECT' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
            >
              <span className="text-base">{p.icon}</span>
              <span className="truncate flex-1">{p.title}</span>
              {isAdmin && (
                <div 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if(confirm('Excluir projeto permanentemente?')) {
                            const newProjs = projects.filter(pr => pr.id !== p.id);
                            saveProjectsChanges(newProjs);
                        } 
                    }}
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
            <div className="mb-6">
                 <div 
                    className="text-xs font-semibold text-notion-muted mb-2 flex items-center gap-1 cursor-pointer hover:text-gray-400"
                    onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                 >
                     <ChevronDown size={12} className={`transition-transform ${!isCompletedOpen ? '-rotate-90' : ''}`}/>
                     <span>ARQUIVADOS</span>
                 </div>
                 {isCompletedOpen && (
                    <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                        {completedProjects.map(p => (
                            <div 
                            key={p.id}
                            onClick={() => { setCurrentProjectId(p.id); setNavState('PROJECT'); setIsSidebarOpen(false); }}
                            className={`group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer opacity-70 hover:opacity-100 ${currentProjectId === p.id && navState === 'PROJECT' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
                            >
                            <span className="text-base grayscale">{p.icon}</span>
                            <span className="truncate flex-1 line-through decoration-white/20">{p.title}</span>
                             <div 
                                onClick={(e) => { e.stopPropagation(); toggleProjectStatus(p.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#444] rounded text-notion-muted hover:text-green-400 transition-all"
                                title="Restaurar projeto"
                            >
                                <RotateCcw size={12}/>
                            </div>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        )}
      </div>

      {/* Helpdesk Link - Pinned to bottom before profile */}
      <div className="px-2 py-2 border-t border-[#333]/50">
        <button 
            onClick={() => { setNavState('IT_HELPDESK'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${navState === 'IT_HELPDESK' ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
        >
          <Monitor size={16} className={navState === 'IT_HELPDESK' ? "text-purple-400" : ""} /> Suporte / Helpdesk
        </button>
      </div>

      {/* User Profile / Logout */}
      <div className="p-4 border-t border-[#333] bg-[#1c1c1c]">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm overflow-hidden">
                      {currentUser?.avatar.match(/^(http|data:)/) ? (
                          <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover"/>
                      ) : currentUser?.avatar}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-medium">{currentUser?.name}</span>
                      <span className="text-[10px] text-notion-muted capitalize">{currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
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
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Boa tarde, {currentUser?.name}</h1>
            <p className="text-gray-500 dark:text-notion-muted text-sm">
                {isAdmin ? 'Você tem acesso administrativo completo.' : 'Bem-vindo ao seu espaço de trabalho.'}
            </p>
          </div>
      )}

      {/* --- ADMIN QUICK ACTIONS ROW --- */}
      {isAdmin && (
          <div className="mb-12">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck size={14}/> Atalhos Administrativos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {/* Create Campaign */}
                 <div onClick={handleCreateCampaign} className="bg-white dark:bg-[#202020] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] border border-gray-200 dark:border-[#333] hover:border-blue-500/50 p-4 rounded-lg cursor-pointer transition-all group shadow-sm">
                     <div className="flex items-center justify-between mb-3">
                         <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                             <Briefcase size={20}/>
                         </div>
                         <Plus size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white"/>
                     </div>
                     <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-200">Nova Campanha</h3>
                     <p className="text-xs text-gray-500 dark:text-notion-muted mt-1">Template de Marketing</p>
                 </div>

                 {/* Manage Users */}
                 <div onClick={() => { setIsSettingsOpen(true); }} className="bg-white dark:bg-[#202020] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] border border-gray-200 dark:border-[#333] hover:border-orange-500/50 p-4 rounded-lg cursor-pointer transition-all group shadow-sm">
                     <div className="flex items-center justify-between mb-3">
                         <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                             <UserIcon size={20}/>
                         </div>
                         <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white"/>
                     </div>
                     <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-200">Gerenciar Admins</h3>
                     <p className="text-xs text-gray-500 dark:text-notion-muted mt-1">Controle de Usuários</p>
                 </div>

                 {/* Admin Dash */}
                 <div onClick={() => setNavState('ADMIN_DASHBOARD')} className="bg-white dark:bg-[#202020] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] border border-gray-200 dark:border-[#333] hover:border-blue-500/50 p-4 rounded-lg cursor-pointer transition-all group shadow-sm">
                     <div className="flex items-center justify-between mb-3">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                             <LayoutDashboard size={20}/>
                         </div>
                         <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white"/>
                     </div>
                     <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-200">Dashboard Global</h3>
                     <p className="text-xs text-gray-500 dark:text-notion-muted mt-1">Visão Geral do Sistema</p>
                 </div>
            </div>
          </div>
      )}

      {/* --- STANDARD PROJECT LIST --- */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-notion-muted uppercase mb-4">
          {isAdmin ? 'Projetos Recentes (Visão Global)' : 'Projetos Recentes'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Recently Visited Cards */}
        {activeProjects.slice(0, 4).map(p => (
           <div 
             key={p.id} 
             onClick={() => { setCurrentProjectId(p.id); setNavState('PROJECT'); }}
             className="bg-white dark:bg-notion-card rounded-lg hover:bg-gray-50 dark:hover:bg-notion-hover cursor-pointer group transition-all overflow-hidden flex flex-col h-32 relative shadow-sm dark:shadow-lg dark:shadow-black/20 border border-gray-200 dark:border-transparent"
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
                <div className="font-medium text-sm mb-1 truncate text-gray-900 dark:text-gray-200">{p.title}</div>
                <div className="flex items-center text-xs text-gray-500 dark:text-notion-muted gap-1">
                    <Clock size={12} /> {p.updatedAt.toLocaleDateString()}
                    {isAdmin && p.createdBy && p.createdBy !== currentUser.id && (
                        <span className="ml-auto bg-gray-200 dark:bg-gray-700 px-1 rounded text-[10px] text-gray-600 dark:text-gray-300">Compartilhado</span>
                    )}
                </div>
             </div>
           </div>
        ))}
        {/* New Project Card - For Everyone */}
        <div 
            onClick={handleCreateProject}
            className="bg-white dark:bg-notion-card p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-notion-hover cursor-pointer group flex flex-col items-center justify-center text-gray-500 dark:text-notion-muted hover:text-black dark:hover:text-white h-32 border border-dashed border-gray-300 dark:border-[#444] hover:border-gray-500"
        >
            <Plus size={24} className="mb-2"/>
            <span className="text-sm">Novo Projeto em Branco</span>
        </div>
      </div>

      <div className="mb-8">
         <h2 className="text-sm font-semibold text-gray-500 dark:text-notion-muted uppercase mb-4">Tutoriais</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div onClick={() => handleCreateTemplateProject('kanban')} className="bg-white dark:bg-notion-card rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-notion-hover cursor-pointer shadow-sm dark:shadow-lg dark:shadow-black/20 transition-transform hover:scale-[1.02] border border-gray-200 dark:border-transparent">
                 <div className="h-24 bg-gradient-to-r from-blue-900 to-slate-900 flex items-center justify-center">
                     <Trello size={32} className="text-white/50"/>
                 </div>
                 <div className="p-3">
                     <h3 className="font-medium text-sm mb-1 text-gray-900 dark:text-white">Começando com Kanbans</h3>
                     <p className="text-xs text-gray-500 dark:text-notion-muted">Organize suas tarefas de forma eficaz.</p>
                 </div>
             </div>
             <div onClick={() => handleCreateTemplateProject('ishikawa')} className="bg-white dark:bg-notion-card rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-notion-hover cursor-pointer shadow-sm dark:shadow-lg dark:shadow-black/20 transition-transform hover:scale-[1.02] border border-gray-200 dark:border-transparent">
                 <div className="h-24 bg-gradient-to-r from-green-900 to-teal-900 flex items-center justify-center">
                     <GitMerge size={32} className="text-white/50 rotate-90"/>
                 </div>
                 <div className="p-3">
                     <h3 className="font-medium text-sm mb-1 text-gray-900 dark:text-white">Básico de Ishikawa</h3>
                     <p className="text-xs text-gray-500 dark:text-notion-muted">Encontre a causa raiz de qualquer problema.</p>
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
        style={{ backgroundColor: currentProject.theme || (appSettings.theme === 'light' ? '#ffffff' : '#191919') }}
      >
        {/* Project Header (Top Bar) */}
        {appSettings.showBreadcrumbs && (
            <div className={`h-12 flex items-center justify-between px-4 sticky top-0 z-20 bg-inherit/90 backdrop-blur-sm ${!isSidebarOpen && appSettings.showSidebar ? 'pl-14' : ''}`}>
            <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-notion-muted text-sm cursor-pointer hover:underline" onClick={() => setNavState('HOME')}>Início</span>
                <span className="text-gray-500 dark:text-notion-muted">/</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-200">
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
                            <button 
                                onClick={() => toggleProjectStatus(currentProject.id)}
                                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-[10px] text-notion-muted hover:text-white px-2 py-0.5 rounded transition-colors border border-white/5 hover:border-white/10"
                                title="Restaurar projeto"
                            >
                                <RotateCcw size={10}/> Restaurar
                            </button>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3 relative">
                <span className="text-xs text-gray-500 dark:text-notion-muted">Editado {currentProject.updatedAt.toLocaleTimeString()}</span>
                
                {/* Customization Menu - Accessible to all */}
                <div className="relative" ref={styleMenuRef}>
                        <button 
                            onClick={() => setShowStyleMenu(!showStyleMenu)}
                            className="text-gray-500 dark:text-notion-muted hover:text-black dark:hover:text-white p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded"
                        >
                            <MoreHorizontal size={18}/>
                        </button>
                        {showStyleMenu && (
                            <div className="absolute right-0 top-8 w-72 bg-white dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#444] rounded-lg shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
                                {/* Cover Image Section */}
                                <div>
                                    <div className="text-xs font-semibold text-gray-500 dark:text-notion-muted mb-2 uppercase flex items-center gap-2">
                                        <ImageIcon size={12}/> Imagem de Capa
                                    </div>
                                    <div className="grid grid-cols-5 gap-1 mb-2">
                                        {COVERS.map((cover, i) => (
                                            <div 
                                                key={i}
                                                onClick={() => updateProject(currentProject.id, { cover: cover === '#2C2C2C' ? undefined : cover })}
                                                className="h-8 rounded cursor-pointer hover:ring-2 ring-blue-500 transition-all border border-gray-200 dark:border-white/10"
                                                style={{ background: cover }}
                                                title="Alterar Capa"
                                            />
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full text-xs text-gray-600 dark:text-notion-muted hover:text-black dark:hover:text-white bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#444] border border-gray-200 dark:border-[#444] rounded py-1.5 flex items-center justify-center gap-2 transition-colors mb-2"
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
                                            className="w-full text-xs text-gray-600 dark:text-notion-muted hover:text-black dark:hover:text-white bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#444] border border-gray-200 dark:border-[#444] rounded py-1.5 flex items-center justify-center gap-2 transition-colors"
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
                                    <div className="text-xs font-semibold text-gray-500 dark:text-notion-muted mb-2 uppercase flex items-center gap-2">
                                        <Type size={12}/> Texto do Banner
                                    </div>
                                    <input 
                                        type="text"
                                        placeholder="Adicione texto ao banner..."
                                        className="w-full bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#444] rounded px-2 py-1.5 text-xs text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-blue-500 outline-none"
                                        value={currentProject.coverText || ''}
                                        onChange={(e) => updateProject(currentProject.id, { coverText: e.target.value })}
                                    />
                                </div>

                                {/* Theme Section */}
                                <div>
                                    <div className="text-xs font-semibold text-gray-500 dark:text-notion-muted mb-2 uppercase flex items-center gap-2">
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
                    
                    {/* Controls accessible to everyone */}
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
                </div>
            ) : (
                <div className="h-12 w-full group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors flex items-center px-12 text-sm text-gray-400 dark:text-notion-muted opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => setShowStyleMenu(true)}>
                    <ImageIcon size={14} className="mr-2"/> Adicionar Capa
                </div>
            )}
        </div>

        {/* View Switcher & Title */}
        <div className="px-12 pb-4 flex flex-col h-full overflow-hidden">
            <div className="group relative mb-6 mt-8 z-30">
                 <input 
                    className="text-4xl font-bold bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20"
                    value={currentProject.title}
                    onChange={(e) => updateProject(currentProject.id, { title: e.target.value })}
                    placeholder="Sem Título"
                 />
            </div>

            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 mb-6 shrink-0 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setViewType(ViewType.DOCUMENT)}
                    className={`pb-2 text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${viewType === ViewType.DOCUMENT ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-500 dark:text-notion-muted hover:text-black dark:hover:text-white'}`}
                >
                    <FileText size={16}/> Documento
                </button>
                <button 
                    onClick={() => setViewType(ViewType.KANBAN)}
                    className={`pb-2 text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${viewType === ViewType.KANBAN ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-500 dark:text-notion-muted hover:text-black dark:hover:text-white'}`}
                >
                    <Trello size={16}/> Kanban
                </button>
                <button 
                    onClick={() => setViewType(ViewType.ISHIKAWA)}
                    className={`pb-2 text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${viewType === ViewType.ISHIKAWA ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-500 dark:text-notion-muted hover:text-black dark:hover:text-white'}`}
                >
                    <GitMerge size={16} className="rotate-90"/> Ishikawa
                </button>
                <button 
                    onClick={() => setViewType(ViewType.SCRUM)}
                    className={`pb-2 text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${viewType === ViewType.SCRUM ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-500 dark:text-notion-muted hover:text-black dark:hover:text-white'}`}
                >
                    <ListTodo size={16}/> Scrum
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden min-h-0">
                {viewType === ViewType.DOCUMENT && (
                    <textarea 
                        className="w-full h-full bg-transparent resize-none outline-none text-gray-800 dark:text-gray-300 leading-relaxed p-4"
                        placeholder="Digite '/' para comandos..."
                        value={currentProject.content}
                        onChange={(e) => updateProject(currentProject.id, { content: e.target.value })}
                    />
                )}

                {viewType === ViewType.KANBAN && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0 gap-2">
                            <p className="text-sm text-gray-500 dark:text-notion-muted truncate">Arraste os cartões para atualizar o status.</p>
                            <button 
                                onClick={handleGenerateKanban}
                                disabled={isAiLoading}
                                className="flex items-center gap-2 bg-purple-100 dark:bg-purple-600/20 text-purple-600 dark:text-purple-300 px-3 py-1.5 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-600/30 transition-colors border border-purple-200 dark:border-purple-500/30 whitespace-nowrap"
                            >
                                <Brain size={14} />
                                {isAiLoading ? 'Gerando...' : 'Gerar Colunas Automaticamente'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                             <KanbanBoard 
                                data={currentProject.kanbanData} 
                                onChange={(newData) => updateProject(currentProject.id, { kanbanData: newData })}
                                currentUser={currentUser}
                            />
                        </div>
                    </div>
                )}

                {viewType === ViewType.ISHIKAWA && (
                    <div className="h-full flex flex-col">
                         <div className="flex justify-between items-center mb-4 shrink-0">
                             <div className="text-sm text-gray-500 dark:text-notion-muted truncate max-w-[200px] md:max-w-none">
                                 Efeito: <span className="text-black dark:text-white font-semibold">{currentProject.ishikawaData.effect}</span>
                             </div>
                             <button 
                                onClick={handleGenerateIshikawa}
                                disabled={isAiLoading}
                                className="flex items-center gap-2 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 px-3 py-1.5 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-600/30 transition-colors border border-blue-200 dark:border-blue-500/30 whitespace-nowrap"
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
                        <div className="flex justify-between items-center mb-4 shrink-0 gap-2">
                            <p className="text-sm text-gray-500 dark:text-notion-muted truncate">Planeje sprints movendo itens do backlog.</p>
                            <button 
                                onClick={handleGenerateBacklog}
                                disabled={isAiLoading}
                                className="flex items-center gap-2 bg-green-100 dark:bg-green-600/20 text-green-600 dark:text-green-300 px-3 py-1.5 rounded text-xs hover:bg-green-200 dark:hover:bg-green-600/30 transition-colors border border-green-200 dark:border-green-500/30 whitespace-nowrap"
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
      return (
        <>
            {/* Backdrop for Mobile Sidebar */}
            {appSettings.showSidebar && isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <LoginScreen onLogin={handleLogin} users={users} />
        </>
      );
  }

  return (
    <div className={`flex h-screen font-sans selection:bg-[#2383E2] selection:text-white overflow-hidden transition-colors duration-300 ${appSettings.theme === 'light' ? 'bg-[#f3f4f6] text-[#1f2937]' : 'bg-[#191919] text-[#D4D4D4]'}`}>
      
      {/* Mobile Sidebar Backdrop */}
      {appSettings.showSidebar && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* Mobile Toggle */}
      {!isSidebarOpen && appSettings.showSidebar && (
          <div 
            className="absolute top-4 left-4 z-50 p-2 -m-2" 
            onMouseEnter={() => {
                if(appSettings.sidebarHoverBehavior) setIsSidebarOpen(true);
            }}
          >
             <Menu className="cursor-pointer text-gray-500 dark:text-notion-muted hover:text-black dark:hover:text-white" onClick={() => setIsSidebarOpen(true)}/>
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
             {navState === 'IT_HELPDESK' && (
                 <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
                    <SupportHelpdesk 
                        currentUser={currentUser}
                        tickets={supportTickets}
                        onAddTicket={handleAddTicket}
                        onUpdateTicketStatus={handleUpdateTicketStatus}
                    />
                 </div>
             )}
          </div>

          {/* Toast Notification */}
          {toast && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-3 rounded-md shadow-2xl flex items-center gap-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 min-w-[300px] justify-between border border-gray-200">
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
            onNewMessage={handleChatNotification}
            currentUser={currentUser}
            users={users}
            setTotalUnread={setUnreadMessages}
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
         currentUser={currentUser}
         appSettings={appSettings}
         setAppSettings={setAppSettings}
         onResetSettings={handleResetSettings}
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
