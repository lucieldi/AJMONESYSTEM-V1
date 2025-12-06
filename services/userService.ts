import { User } from '../types';

const API_URL = 'http://localhost:3001/api';
const STORAGE_KEY = 'ajm_users_db';

// Fallback Mock Data (if backend is offline/first run)
const INITIAL_USERS: User[] = [
    { id: 'admin', username: 'admin', password: '1234', name: 'Usuário Admin', email: 'admin@ajmonesystem.com', role: 'admin', avatar: '🛡️' } as any,
    { id: 'user', username: 'user', password: '1234', name: 'Usuário Padrão', email: 'user@ajmonesystem.com', role: 'user', avatar: '👤' } as any
];

// Helper to check if backend is reachable (simple heuristic via fetch failure)
let isBackendAvailable = false;

// --- Private Helpers for LocalStorage ---

const getLocalUsers = (): User[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
        return INITIAL_USERS;
    }
};

const saveLocalUsers = (users: User[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

// --- Service Methods ---

export const userService = {
    /**
     * Fetch all users from Backend or LocalStorage
     */
    async getAllUsers(): Promise<User[]> {
        try {
            const res = await fetch(`${API_URL}/users`, { signal: AbortSignal.timeout(2000) });
            if (!res.ok) throw new Error('Backend unavailable');
            const data = await res.json();
            isBackendAvailable = true;
            return data;
        } catch (error) {
            console.warn("Backend offline, using LocalStorage for users.");
            isBackendAvailable = false;
            return getLocalUsers();
        }
    },

    /**
     * Create a new user
     */
    async createUser(user: User & { password?: string }): Promise<User> {
        if (isBackendAvailable) {
            try {
                const res = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
                if (res.ok) return await res.json();
            } catch (e) {
                console.error("Failed to create user on backend", e);
            }
        }
        
        // Fallback
        const users = getLocalUsers();
        users.push(user);
        saveLocalUsers(users);
        return user;
    },

    /**
     * Update an existing user
     */
    async updateUser(user: User & { password?: string }): Promise<User> {
        if (isBackendAvailable) {
            try {
                const res = await fetch(`${API_URL}/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
                if (res.ok) return await res.json();
            } catch (e) {
                console.error("Failed to update user on backend", e);
            }
        }

        // Fallback
        const users = getLocalUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = { ...users[index], ...user };
            saveLocalUsers(users);
        }
        return user;
    },

    /**
     * Delete a user
     */
    async deleteUser(userId: string): Promise<void> {
        if (isBackendAvailable) {
            try {
                await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
                return;
            } catch (e) {
                console.error("Failed to delete user on backend", e);
            }
        }

        // Fallback
        const users = getLocalUsers();
        const filtered = users.filter(u => u.id !== userId);
        saveLocalUsers(filtered);
    }
};