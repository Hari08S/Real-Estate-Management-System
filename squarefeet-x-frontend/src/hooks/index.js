import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSavedStore } from '../store/savedStore';
import { authService } from '../services/api';
import { getDashboardPath } from '../constants';
import { debounce } from '../utils';

export const useAuth = () => {
    const { user, isAuthenticated, isInitialized } = useAuthStore();
    return { user, isAuthenticated, isInitialized };
};

export const useInitAuth = () => {
    const { setUser, setInitialized } = useAuthStore();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            try {
                const { data } = await authService.getMe();
                setUser(data.user);
                if (data.user?.id) useSavedStore.getState().initForUser(data.user.id);
            } catch {
                setUser(null);
            } finally {
                setInitialized(true);
            }
        };
        init();
    }, [setUser, setInitialized]);
};

export const useRegister = () => {
    const registerUser = async (userDetails) => {
        const { data } = await authService.register(userDetails);
        return data;
    };
    return registerUser;
};

export const useLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuthStore();

    const login = async (credentials) => {
        const { data } = await authService.login(credentials);
        setUser(data.user);
        if (data.user?.id) useSavedStore.getState().initForUser(data.user.id);
        const params = new URLSearchParams(location.search);
        const returnUrl = params.get('returnUrl');
        navigate(returnUrl || getDashboardPath(data.user.activeRole));
    };

    return login;
};

export const useLogout = () => {
    const navigate = useNavigate();
    const { logout: clearAuth } = useAuthStore();

    const logout = async () => {
        try {
            await authService.logout();
        } catch { /* proceed anyway */ }
        clearAuth();
        navigate('/login');
    };

    return logout;
};

export const useDebouncedCallback = (callback, delay = 300) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback(debounce((...args) => callbackRef.current(...args), delay), [delay]);
};

export const useIntersectionObserver = (callback, options = {}) => {
    const targetRef = useRef(null);

    useEffect(() => {
        const target = targetRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) callback();
        }, { threshold: 0.1, ...options });

        observer.observe(target);
        return () => observer.disconnect();
    }, [callback, options]);

    return targetRef;
};

export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMatches(media.matches);
        const listener = (e) => setMatches(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

export const useScrollLock = (isLocked) => {
    useEffect(() => {
        if (isLocked) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isLocked]);
};
