import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
    unreadCount: 0,
    notifications: [],
    setUnreadCount: (count) => set({ unreadCount: count }),
    setNotifications: (notifications) => set({ notifications }),
    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        })),
    markRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),
    clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
