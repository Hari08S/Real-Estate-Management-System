// ── Real API service — connects to Spring Boot backend via API Gateway ──
// All requests go through http://localhost:8080/api (via axios config)

import api from '../config/axios';

// ── Auth Service ──
export const authService = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    googleLogin: (data) => api.post('/auth/google', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh-token'),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

// ── User Service ──
export const userService = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getUser: (id) => api.get(`/users/internal/${id}`),
    switchRole: (role) => api.put('/users/switch-role', { role }),
    getAdminInfo: () => api.get('/users/admin-info'),
    uploadAvatar: (formData) => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Property Service ──
export const propertyService = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/properties?${query}`);
    },
    getById: (id) => api.get(`/properties/${id}`),
    create: (data) => api.post('/properties', data),
    update: (id, data) => api.put(`/properties/${id}`, data),
    delete: (id) => api.delete(`/properties/${id}`),
    getMyListings: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/properties/my-listings?${query}`);
    },
    getSavedProperties: () => api.get('/properties/saved'),
    uploadImages: (id, formData) => api.post(`/properties/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Chat Service ──
export const chatService = {
    getConversations: () => api.get('/chat/conversations'),
    getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`),
    sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
    startConversation: (data) => api.post('/chat/conversations', data),
    contactAdmin: () => api.post('/chat/contact-admin'),
    markRead: (conversationId) => api.put(`/chat/conversations/${conversationId}/read`),
    getUnreadCount: () => api.get('/chat/unread-count'),
};

// ── Manager Service ──
export const managerService = {
    getDashboardStats: () => api.get('/manager/dashboard'),
    getMyCities: () => api.get('/manager/cities'),
    getUnassignedListings: () => api.get('/manager/unassigned'),
    claimListing: (id) => api.put(`/manager/${id}/claim`),
    reviewListing: (id, data) => api.put(`/manager/${id}/review`, data),
    getListingsForReview: () => api.get('/manager/listings'),
    getManagerByCity: (city) => api.get(`/manager/by-city?city=${encodeURIComponent(city)}`),
    updatePropertyStatus: (id, status) => api.put(`/manager/${id}/status`, { status }),
};

// ── Admin Service ──
export const adminService = {
    getDashboardStats: () => api.get('/admin/dashboard'),
    getUsers: () => api.get('/admin/users'),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getManagers: () => api.get('/admin/managers'),
    createManager: (data) => api.post('/admin/managers/create', data),
    updateManager: (id, data) => api.put(`/admin/managers/${id}`, data),
    deleteManager: (id) => api.delete(`/admin/managers/${id}`),
    assignManager: (data) => api.post('/admin/managers/assign', data),
    unassignManager: (data) => api.post('/admin/managers/unassign', data),
    getManagerByCity: (city) => api.get(`/admin/managers/by-city?city=${encodeURIComponent(city)}`),
    getProperties: () => api.get('/admin/properties'),
    deleteProperty: (id) => api.delete(`/admin/properties/${id}`),
    updatePropertyStatus: (id, status) => api.put(`/admin/properties/${id}/status`, { status }),
    getAuditLog: () => api.get('/admin/audit-log'),
};
