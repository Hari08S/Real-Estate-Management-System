import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAlertPreferencesStore = create(
    persist(
        (set, get) => ({
            preferences: [], // [{ id, city, listingType, maxPrice, bedrooms, createdAt }]
            addPreference: (pref) => {
                const entry = { ...pref, id: Date.now().toString(), createdAt: Date.now() };
                set((s) => ({ preferences: [...s.preferences, entry].slice(0, 5) }));
            },
            removePreference: (id) =>
                set((s) => ({ preferences: s.preferences.filter((p) => p.id !== id) })),
            clearAll: () => set({ preferences: [] }),
            matchesAnyPreference: (property) => {
                const prefs = get().preferences;
                if (!prefs.length) return false;
                return prefs.some((p) => {
                    const cityMatch = !p.city || property.location?.city?.toLowerCase().includes(p.city.toLowerCase());
                    const typeMatch = !p.listingType || property.listingType === p.listingType;
                    const priceVal = property.price || property.monthlyRent || property.leaseAmount || 0;
                    const priceMatch = !p.maxPrice || priceVal <= Number(p.maxPrice);
                    const bedsMatch = !p.bedrooms || property.bedrooms >= Number(p.bedrooms);
                    return cityMatch && typeMatch && priceMatch && bedsMatch;
                });
            },
        }),
        { name: 'sfx-alert-preferences' }
    )
);
