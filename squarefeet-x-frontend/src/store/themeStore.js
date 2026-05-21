import { create } from 'zustand';

const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('sqfx-theme') || 'dark';
};

// Apply theme to DOM immediately
const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'light') {
        root.classList.add('light');
    } else {
        root.classList.remove('light');
    }
    localStorage.setItem('sqfx-theme', theme);
};

// Apply on load
applyTheme(getInitialTheme());

export const useThemeStore = create((set) => ({
    theme: getInitialTheme(),
    toggleTheme: () =>
        set((state) => {
            const next = state.theme === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            return { theme: next };
        }),
    setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
    },
}));
