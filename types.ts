
export enum ViewType {
  DOCUMENT = 'DOCUMENT',
  KANBAN = 'KANBAN',
  ISHIKAWA = 'ISHIKAWA',
  SCRUM = 'SCRUM'
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string; // Added email
  role: UserRole;
  avatar: string;
}

export interface AppSettings {
  showSidebar: boolean;
  showBreadcrumbs: boolean;
  showGreeting: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
}

export interface Task {
  id: string;
  content: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
  icon?: string;
  attachments?: Attachment[];
  storyPoints?: number; // For Scrum
  priority?: 'Low' | 'Medium' | 'High'; // For Scrum
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
  color?: string; // Hex code or Tailwind class for header color
}

export interface IshikawaCategory {
  name: string;
  causes: string[];
}

export interface IshikawaData {
  effect: string;
  categories: IshikawaCategory[];
}

export interface Sprint {
  id: string;
  title: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  tasks: Task[];
}

export interface ScrumData {
  backlog: Task[];
  sprints: Sprint[];
}

export interface Project {
  id: string;
  title: string;
  icon: string;
  updatedAt: Date;
  content: string; // For the document view
  kanbanData: KanbanColumn[];
  ishikawaData: IshikawaData;
  scrumData: ScrumData; // New field for Scrum
  cover?: string; // CSS background value (gradient or color)
  coverPositionY?: number; // 0 to 100 percentage for background-position-y
  coverText?: string; // Text to display over the cover
  theme?: string; // Background color for the project view
  status: 'active' | 'completed'; // New field for project status
}

export interface ChatMessage {
  id: string;
  senderId: string; // User name or 'System'
  recipientId?: string; // User ID for private messages, undefined for global
  text: string;
  timestamp: string;
}

export type NavigationState = 'HOME' | 'PROJECT' | 'ADMIN_DASHBOARD';