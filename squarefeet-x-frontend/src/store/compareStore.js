import { create } from 'zustand';

const MAX_COMPARE = 3;

export const useCompareStore = create((set, get) => ({
    items: [],
    addItem: (property) =>
        set((state) => {
            if (state.items.find((p) => p.id === property.id)) return state;
            const newItems = [...state.items, property];
            if (newItems.length > MAX_COMPARE) newItems.shift();
            return { items: newItems };
        }),
    removeItem: (id) =>
        set((state) => ({ items: state.items.filter((p) => p.id !== id) })),
    clearAll: () => set({ items: [] }),
    isInCompare: (id) => get().items.some((p) => p.id === id),
}));
