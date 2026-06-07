import axios from 'axios';
import { installMockInterceptor } from './mockInterceptor';
import { useApiLogStore } from '../store/apiLogStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Outgoing request interceptor
api.interceptors.request.use(
    (config) => {
        const id = Math.random().toString(36).substring(2, 9) + '-' + Date.now();
        config.metadata = { requestId: id, startTime: Date.now() };

        // Safely parse request body if it is a string
        let reqBody = config.data;
        if (reqBody && typeof reqBody === 'string') {
            try {
                reqBody = JSON.parse(reqBody);
            } catch (e) {
                // leave as string
            }
        }

        const logEntry = {
            id,
            method: (config.method || 'GET').toUpperCase(),
            url: config.url || '',
            fullUrl: (config.baseURL || '') + (config.url || ''),
            timestamp: new Date().toLocaleTimeString(),
            status: 'Pending',
            requestHeaders: config.headers ? { ...config.headers } : {},
            requestBody: reqBody || null,
            responseBody: null,
            duration: null
        };

        try {
            useApiLogStore.getState().addLog(logEntry);
        } catch (e) {
            console.error('Failed to log request to apiLogStore', e);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        const config = response.config;
        if (config?.metadata?.requestId) {
            const id = config.metadata.requestId;
            const duration = Date.now() - config.metadata.startTime;
            try {
                useApiLogStore.getState().updateLog(id, {
                    status: response.status,
                    responseBody: response.data,
                    duration
                });
            } catch (e) {
                console.error('Failed to log success response', e);
            }
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Log the error response
        if (originalRequest?.metadata?.requestId) {
            const id = originalRequest.metadata.requestId;
            const duration = Date.now() - originalRequest.metadata.startTime;
            try {
                useApiLogStore.getState().updateLog(id, {
                    status: error.response ? error.response.status : 'Network Error',
                    responseBody: error.response ? error.response.data : error.message,
                    duration
                });
            } catch (e) {
                console.error('Failed to log error response', e);
            }
        }

        // Skip 401 retry for auth endpoints to avoid infinite loops
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// Install mock fallback — when backend fails, mock data is returned
// installMockInterceptor(api);

export default api;
