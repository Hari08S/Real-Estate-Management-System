import { create } from 'zustand';
import { useAuthStore } from './authStore';

const storageKey = (userId) => (userId ? `sfx_saved_${userId}` : 'sfx_saved');

const getSavedIds = (userId) => {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (raw) return JSON.parse(raw);
        // Only fallback to legacy sfx_saved if userId is null
        if (!userId) {
            const legacy = localStorage.getItem('sfx_saved');
            return legacy ? JSON.parse(legacy) : [];
        }
        return [];
    } catch {
        return [];
    }
};

export const useSavedStore = create((set, get) => ({
    savedIds: getSavedIds(useAuthStore.getState().user?.id || null),
    userId: useAuthStore.getState().user?.id || null,

    initForUser: (userId) => {
        set({ userId, savedIds: getSavedIds(userId) });
    },

    toggleSave: (propertyId) => {
        const activeUserId = useAuthStore.getState().user?.id || null;
        const currentSavedIds = getSavedIds(activeUserId);
        
        const isSaved = currentSavedIds.includes(propertyId);
        const updated = isSaved
            ? currentSavedIds.filter((id) => id !== propertyId)
            : [...currentSavedIds, propertyId];
            
        localStorage.setItem(storageKey(activeUserId), JSON.stringify(updated));
        set({ userId: activeUserId, savedIds: updated });
        return !isSaved;
    },

    isSaved: (propertyId) => {
        const activeUserId = useAuthStore.getState().user?.id || null;
        const currentSavedIds = getSavedIds(activeUserId);
        return currentSavedIds.includes(propertyId);
    },
}));

// Automatically subscribe to useAuthStore changes to initialize/reset favorites list for the active user
useAuthStore.subscribe((state) => {
    const userId = state.user?.id || null;
    useSavedStore.getState().initForUser(userId);
});
