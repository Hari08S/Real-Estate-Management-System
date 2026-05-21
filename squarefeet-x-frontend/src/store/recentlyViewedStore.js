import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENT = 12;

export const useRecentlyViewedStore = create(
    persist(
        (set, get) => ({
            items: [], // [{ id, title, price, listingType, city, image, viewedAt }]
            addItem: (property) => {
                if (!property?.id) return;
                const item = {
                    id: property.id,
                    title: property.title,
                    price: property.price || property.monthlyRent || property.leaseAmount,
                    listingType: property.listingType,
                    city: property.location?.city,
                    image: property.images?.[0] || null,
                    viewedAt: Date.now(),
                };
                set((s) => ({
                    items: [item, ...s.items.filter((i) => i.id !== property.id)].slice(0, MAX_RECENT),
                }));
            },
            clearAll: () => set({ items: [] }),
        }),
        { name: 'sfx-recently-viewed' }
    )
);
