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
        furnishing: '',    // FURNISHED, SEMI_FURNISHED, UNFURNISHED
        reraStatus: '',    // APPROVED, PENDING
        floor: '',         // GROUND, LOW, MEDIUM, HIGH
        distance: '',      // Distance in km (2, 5, 10, 20)
        pinnedLat: '',
        pinnedLng: '',
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
                furnishing: '',
                reraStatus: '',
                floor: '',
                distance: '',
                pinnedLat: '',
                pinnedLng: '',
                sortBy: 'createdAt',
                sortOrder: 'desc',
            },
        }),
}));
