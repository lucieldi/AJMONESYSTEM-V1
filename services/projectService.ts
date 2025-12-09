import { Project } from '../types';

const API_URL = 'http://localhost:3001/api';
const STORAGE_KEY = 'ajm_projects_db';

export const projectService = {
    /**
     * Fetch all projects from Backend or LocalStorage fallback
     */
    async getProjects(): Promise<Project[]> {
        try {
            const res = await fetch(`${API_URL}/projects`, { signal: AbortSignal.timeout(2000) });
            if (!res.ok) throw new Error('Backend unavailable');
            const data = await res.json();
            
            // Fix Date objects coming from JSON as strings
            return data.map((p: any) => ({
                ...p,
                updatedAt: new Date(p.updatedAt)
            }));
        } catch (error) {
            console.info("Backend offline, utilizando LocalStorage para Projetos.");
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved).map((p: any) => ({
                    ...p,
                    updatedAt: new Date(p.updatedAt)
                }));
            }
            return [];
        }
    },

    /**
     * Save all projects to Backend and LocalStorage (Sync)
     */
    async saveProjects(projects: Project[]): Promise<void> {
        // Always save to local storage as backup/fast access
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

        try {
            await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projects)
            });
        } catch (error) {
            console.warn("Falha ao salvar projetos no servidor. Dados salvos localmente.");
        }
    }
};
