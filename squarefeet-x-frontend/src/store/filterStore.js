import { create } from 'zustand';

export const useFilterStore = create((set) => ({
    filters: {
        search: '',
        propertyType: '',
        listingType: '',
        priceMin: '',
        priceMax: '',
        bedrooms: '',
        bathrooms: '',
        city: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
    },
    setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),
    setFilters: (updates) =>
        set((state) => ({ filters: { ...state.filters, ...updates } })),
    resetFilters: () =>
        set({
            filters: {
                search: '',
                propertyType: '',
                listingType: '',
                priceMin: '',
                priceMax: '',
                bedrooms: '',
                bathrooms: '',
                city: '',
                sortBy: 'createdAt',
                sortOrder: 'desc',
            },
        }),
}));
