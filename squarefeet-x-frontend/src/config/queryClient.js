import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000, // 30s — keeps data fresh while avoiding excessive refetches
            gcTime: 5 * 60 * 1000, // 5min garbage collection
        },
        mutations: {
            retry: 0,
        },
    },
});
