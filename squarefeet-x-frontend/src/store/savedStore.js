import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { propertyService } from '../services/api';

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
    isInitialized: false,

    initForUser: async (userId) => {
        if (!userId) {
            set({ userId: null, savedIds: [], isInitialized: false });
            return;
        }
        if (get().userId === userId && get().isInitialized) {
            return;
        }
        set({ userId, isInitialized: true });
        try {
            const { data } = await propertyService.getSavedProperties();
            const ids = (data.properties || []).map((p) => p.id);
            set({ savedIds: ids });
        } catch (err) {
            console.error('Failed to sync favorites with backend:', err);
            // Fallback to local storage
            set({ savedIds: getSavedIds(userId) });
        }
    },

    toggleSave: async (propertyId) => {
        const activeUserId = useAuthStore.getState().user?.id || null;
        if (!activeUserId) {
            // Guest user
            const currentSavedIds = getSavedIds(null);
            const isSaved = currentSavedIds.includes(propertyId);
            const updated = isSaved
                ? currentSavedIds.filter((id) => id !== propertyId)
                : [...currentSavedIds, propertyId];
            localStorage.setItem(storageKey(null), JSON.stringify(updated));
            set({ userId: null, savedIds: updated });
            return !isSaved;
        }

        try {
            const { data } = await propertyService.toggleSave(propertyId);
            const currentSavedIds = get().savedIds;
            const updated = data.saved
                ? [...currentSavedIds.filter(id => id !== propertyId), propertyId]
                : currentSavedIds.filter((id) => id !== propertyId);
            set({ savedIds: updated });
            return data.saved;
        } catch (err) {
            console.error('Failed to toggle save on backend:', err);
            // Fallback to local storage
            const currentSavedIds = getSavedIds(activeUserId);
            const isSaved = currentSavedIds.includes(propertyId);
            const updated = isSaved
                ? currentSavedIds.filter((id) => id !== propertyId)
                : [...currentSavedIds, propertyId];
            localStorage.setItem(storageKey(activeUserId), JSON.stringify(updated));
            set({ userId: activeUserId, savedIds: updated });
            return !isSaved;
        }
    },

    isSaved: (propertyId) => {
        const currentSavedIds = get().savedIds;
        return currentSavedIds.includes(propertyId);
    },
}));

// Automatically subscribe to useAuthStore changes to initialize/reset favorites list for the active user
useAuthStore.subscribe((state) => {
    const userId = state.user?.id || null;
    useSavedStore.getState().initForUser(userId);
});
