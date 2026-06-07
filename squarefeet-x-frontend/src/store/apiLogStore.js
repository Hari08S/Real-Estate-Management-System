import { create } from 'zustand';

export const useApiLogStore = create((set) => ({
    logs: [],
    addLog: (log) => set((state) => ({
        logs: [log, ...state.logs].slice(0, 100) // Keep last 100 logs
    })),
    updateLog: (id, updates) => set((state) => ({
        logs: state.logs.map((log) => 
            log.id === id ? { ...log, ...updates } : log
        )
    })),
    clearLogs: () => set({ logs: [] })
}));
