import React, { useState, useEffect } from 'react';
import { User, Project, NavigationState, AppSettings, SupportTicket, KanbanColumn } from './types';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import KanbanBoard from './components/KanbanBoard';
import ScrumBoard from './components/ScrumBoard';
import IshikawaDiagram from './components/IshikawaDiagram';
import SettingsModal from './components/SettingsModal';
import SupportHelpdesk from './components/SupportHelpdesk';
import TeamArea from './components/TeamArea';
import GlobalChat from './components/GlobalChat';
import { userService } from './services/userService';
import { projectService } from './services/projectService';
import { 
  LogOut, Settings, Home, Layout, MessageSquare, 
  Users as UsersIcon, ChevronRight, Monitor, Plus
} from 'lucide-react';
import { generateKanbanBoard, generateIshikawaData } from './services/geminiService';

const DEFAULT_SETTINGS: AppSettings = {
  showSidebar: true,
  showBreadcrumbs: true,
  showGreeting: true,
  sidebarHoverBehavior: false,
  theme: 'dark'
};

const App: React.FC = () => {
  // Global State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Navigation State
  const [view, setView] = useState<NavigationState>('HOME');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<'KANBAN' | 'SCRUM' | 'ISHIKAWA' | 'DOCS'>('KANBAN');

  // UI State
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Data State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [teamKanban, setTeamKanban] = useState<KanbanColumn[]>([]);

  // Effects
  useEffect(() => {
    const loadData = async () => {
      const loadedUsers = await userService.getAllUsers();
      setUsers(loadedUsers);
      const loadedProjects = await projectService.getProjects();
      setProjects(loadedProjects);
    };
    loadData();
  }, []);

  // Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('HOME');
    setCurrentProjectId(null);
  };

  const handleUpdateUser = async (updatedUser: User & { password?: string }) => {
    await userService.updateUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser({ ...currentUser, ...updatedUser });
    }
  };

  const handleAddUser = async (newUser: User & { password?: string }) => {
      try {
          const created = await userService.createUser(newUser);
          setUsers(prev => [...prev, created]);
      } catch (error) {
          alert(error instanceof Error ? error.message : "Erro ao criar usuário");
      }
  };

  const handleDeleteUser = async (userId: string) => {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateProject = (updatedProject: Project) => {
      const newProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      setProjects(newProjects);
      projectService.saveProjects(newProjects);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} users={users} />;
  }

  const currentProject = projects.find(p => p.id === currentProjectId);

  // Navigation Logic
  const renderContent = () => {
      if (view === 'ADMIN_DASHBOARD') {
          return <AdminDashboard projects={projects} users={users} onNavigateToProject={(id) => { setCurrentProjectId(id); setView('PROJECT'); }} />;
      }
      if (view === 'IT_HELPDESK') {
          return <SupportHelpdesk currentUser={currentUser} tickets={tickets} onAddTicket={t => setTickets([...tickets, t])} onUpdateTicketStatus={(id, status) => setTickets(tickets.map(t => t.id === id ? { ...t, status } : t))} />;
      }
      if (view.startsWith('TEAM_')) {
          return <TeamArea users={users} currentUser={currentUser} view={view} teamKanbanData={teamKanban} onTeamKanbanChange={setTeamKanban} />;
      }
      if (view === 'PROJECT' && currentProject) {
          return (
              <div className="h-full flex flex-col">
                  {/* Project Header */}
                  <div className="h-16 border-b border-[#333] flex items-center px-6 justify-between shrink-0 bg-[#1c1c1c]">
                      <div className="flex items-center gap-4">
                          <div className="text-2xl">{currentProject.icon}</div>
                          <div>
                              <h2 className="text-lg font-bold text-white leading-tight">{currentProject.title}</h2>
                              <div className="flex gap-4 text-xs text-notion-muted">
                                  <button onClick={() => setActiveProjectTab('KANBAN')} className={activeProjectTab === 'KANBAN' ? 'text-blue-400 font-bold' : 'hover:text-white'}>Kanban</button>
                                  <button onClick={() => setActiveProjectTab('SCRUM')} className={activeProjectTab === 'SCRUM' ? 'text-blue-400 font-bold' : 'hover:text-white'}>Scrum</button>
                                  <button onClick={() => setActiveProjectTab('ISHIKAWA')} className={activeProjectTab === 'ISHIKAWA' ? 'text-blue-400 font-bold' : 'hover:text-white'}>Ishikawa</button>
                                  <button onClick={() => setActiveProjectTab('DOCS')} className={activeProjectTab === 'DOCS' ? 'text-blue-400 font-bold' : 'hover:text-white'}>Documento</button>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  {/* Project Body */}
                  <div className="flex-1 overflow-hidden bg-[#191919]">
                      {activeProjectTab === 'KANBAN' && (
                          <div className="h-full p-4 overflow-x-auto">
                            <KanbanBoard 
                                data={currentProject.kanbanData} 
                                onChange={(newData) => updateProject({ ...currentProject, kanbanData: newData })}
                                currentUser={currentUser}
                            />
                          </div>
                      )}
                      {activeProjectTab === 'SCRUM' && (
                          <ScrumBoard 
                              data={currentProject.scrumData}
                              onChange={(newData) => updateProject({ ...currentProject, scrumData: newData })}
                          />
                      )}
                      {activeProjectTab === 'ISHIKAWA' && (
                          <div className="p-8 h-full flex flex-col">
                              <IshikawaDiagram data={currentProject.ishikawaData} />
                              <div className="mt-4 text-center">
                                  <button 
                                    onClick={async () => {
                                        const problem = prompt("Qual o problema principal?");
                                        if(problem) {
                                            const data = await generateIshikawaData(problem);
                                            if(data) updateProject({ ...currentProject, ishikawaData: data });
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                  >
                                      Gerar com IA
                                  </button>
                              </div>
                          </div>
                      )}
                      {activeProjectTab === 'DOCS' && (
                          <div className="p-8 max-w-4xl mx-auto text-gray-300">
                              <h1 className="text-3xl font-bold mb-4">{currentProject.title}</h1>
                              <p className="whitespace-pre-wrap">{currentProject.content}</p>
                          </div>
                      )}
                  </div>
              </div>
          );
      }

      // Default HOME
      return (
          <div className="p-8">
              <h1 className="text-3xl font-bold text-white mb-6">Meus Projetos</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projects.map(p => (
                      <div key={p.id} onClick={() => { setCurrentProjectId(p.id); setView('PROJECT'); }} className="bg-[#2C2C2C] p-6 rounded-lg cursor-pointer hover:bg-[#333] border border-[#333] transition-colors">
                          <div className="text-4xl mb-4">{p.icon}</div>
                          <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                          <p className="text-sm text-gray-400 line-clamp-2">{p.content}</p>
                      </div>
                  ))}
                  <div 
                    onClick={async () => {
                        const title = prompt("Nome do Projeto:");
                        if (title) {
                            const newProject: Project = {
                                id: crypto.randomUUID(),
                                title,
                                icon: '📁',
                                updatedAt: new Date(),
                                content: 'Novo projeto...',
                                kanbanData: [],
                                scrumData: { backlog: [], sprints: [] },
                                ishikawaData: { effect: 'Problema', categories: [] },
                                status: 'active'
                            };
                            const kanban = await generateKanbanBoard(title, "Projeto Genérico");
                            newProject.kanbanData = kanban;
                            const newProjects = [...projects, newProject];
                            setProjects(newProjects);
                            projectService.saveProjects(newProjects);
                        }
                    }}
                    className="border-2 border-dashed border-[#444] p-6 rounded-lg cursor-pointer hover:bg-[#2C2C2C] flex flex-col items-center justify-center text-gray-500 hover:text-white transition-colors"
                  >
                      <Plus size={32} className="mb-2"/>
                      <span className="font-medium">Novo Projeto IA</span>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className={`flex h-screen bg-[#191919] text-[#D4D4D4] font-sans overflow-hidden ${appSettings.theme}`}>
      {/* Sidebar */}
      {appSettings.showSidebar && (
        <div className={`w-64 bg-[#202020] border-r border-[#333] flex flex-col transition-all duration-300 shrink-0`}>
           <div className="p-4 flex items-center gap-3 border-b border-[#333]">
               <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">AJM</div>
               <span className="font-bold text-white tracking-wide">OneSystem</span>
           </div>
           
           <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
               <button onClick={() => { setView('HOME'); setCurrentProjectId(null); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium ${view === 'HOME' ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
                   <Home size={18}/> Início
               </button>
               {currentUser.role === 'admin' && (
                   <button onClick={() => setView('ADMIN_DASHBOARD')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium ${view === 'ADMIN_DASHBOARD' ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
                       <Layout size={18}/> Dashboard Admin
                   </button>
               )}
               <button onClick={() => setView('IT_HELPDESK')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium ${view === 'IT_HELPDESK' ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
                   <Monitor size={18}/> TI Helpdesk
               </button>

               <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipe</div>
               <button onClick={() => setView('TEAM_AREA')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium ${view === 'TEAM_AREA' ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
                   <UsersIcon size={18}/> Área da Equipe
               </button>
               
               <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Projetos</div>
               {projects.map(p => (
                   <button 
                    key={p.id} 
                    onClick={() => { setCurrentProjectId(p.id); setView('PROJECT'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium ${currentProjectId === p.id ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}
                   >
                       <span>{p.icon}</span> <span className="truncate">{p.title}</span>
                   </button>
               ))}
           </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-[#333] bg-[#1c1c1c]">
                <div className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2" onClick={() => setIsSettingsOpen(true)}>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm overflow-hidden opacity-100 group-hover:opacity-80 transition-opacity">
                            {currentUser?.avatar.match(/^(http|data:)/) ? (
                                <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover"/>
                            ) : currentUser?.avatar}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{currentUser.name.split(' ')[0]}</span>
                            <span className="text-[10px] text-notion-muted capitalize">{currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-1.5 hover:bg-[#333] rounded text-gray-400 group-hover:text-red-400 transition-colors"
                        title="Sair"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#121212] relative">
          {/* Top Bar */}
          {appSettings.showBreadcrumbs && (
              <div className="h-10 border-b border-[#333] flex items-center px-4 justify-between bg-[#191919]">
                  <div className="flex items-center text-xs text-gray-500">
                      <span>AJM OneSystem</span>
                      <ChevronRight size={14} className="mx-1"/>
                      <span className="text-gray-300 font-medium capitalize">{view.replace('_', ' ').toLowerCase()}</span>
                      {currentProject && (
                          <>
                              <ChevronRight size={14} className="mx-1"/>
                              <span className="text-white">{currentProject.title}</span>
                          </>
                      )}
                  </div>
                  <div className="flex items-center gap-3">
                       <button onClick={() => setIsChatOpen(!isChatOpen)} className="relative text-gray-400 hover:text-white">
                           <MessageSquare size={16}/>
                           {chatUnreadCount > 0 && (
                               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#191919]"></span>
                           )}
                       </button>
                       <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white">
                           <Settings size={16}/>
                       </button>
                  </div>
              </div>
          )}
          
          <div className="flex-1 overflow-hidden relative">
              {renderContent()}
          </div>
      </div>

      {/* Overlays */}
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
        onResetSettings={() => setAppSettings(DEFAULT_SETTINGS)}
      />
      
      <GlobalChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        currentUser={currentUser}
        users={users}
        setTotalUnread={setChatUnreadCount}
      />
    </div>
  );
};

export default App;
