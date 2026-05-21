import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_HISTORY = 8;

export const useSearchHistoryStore = create(
    persist(
        (set, get) => ({
            history: [], // [{ query, filters, timestamp }]
            addSearch: (query, filters = {}) => {
                if (!query?.trim()) return;
                const entry = { query: query.trim(), filters, timestamp: Date.now() };
                set((s) => ({
                    history: [
                        entry,
                        ...s.history.filter((h) => h.query !== query.trim()),
                    ].slice(0, MAX_HISTORY),
                }));
            },
            removeSearch: (query) =>
                set((s) => ({ history: s.history.filter((h) => h.query !== query) })),
            clearHistory: () => set({ history: [] }),
        }),
        { name: 'sfx-search-history' }
    )
);
