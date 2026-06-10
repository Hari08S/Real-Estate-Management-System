import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
    Menu, X, ChevronDown, Home, Search, Building2, LogIn, UserPlus,
    LayoutDashboard, Heart, Unlock, MessageSquare, PlusCircle, List,
    Users, Settings, Shield, Bell, LogOut, ArrowRightLeft, Sun, Moon, MapPin
} from 'lucide-react';
import { useAuth, useLogout } from '../../hooks';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { ROLES, ROLE_LABELS, getDashboardPath } from '../../constants';
import { userService, chatService, authService } from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const guestLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/properties', label: 'Browse', icon: Search },
    { to: '/login', label: 'Login', icon: LogIn },
    { to: '/register', label: 'Register', icon: UserPlus },
];

const roleMenus = {
    [ROLES.BUYER]: [
        { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/properties', label: 'Browse', icon: Search },
        { to: '/buyer/favorites', label: 'Favorites', icon: Heart },
        { to: '/buyer/route-map', label: 'Route Planner', icon: MapPin },
        { to: '/buyer/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.SELLER]: [
        { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/seller/create', label: 'New Listing', icon: PlusCircle },
        { to: '/seller/listings', label: 'My Listings', icon: List },
        { to: '/seller/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.RENTAL_OWNER]: [
        { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/seller/create', label: 'New Listing', icon: PlusCircle },
        { to: '/seller/listings', label: 'My Listings', icon: List },
        { to: '/seller/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.RENTAL_SEEKER]: [
        { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/properties', label: 'Browse', icon: Search },
        { to: '/buyer/favorites', label: 'Favorites', icon: Heart },
        { to: '/buyer/route-map', label: 'Route Planner', icon: MapPin },
        { to: '/buyer/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.MANAGER]: [
        { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/properties', label: 'Browse', icon: Search },
        { to: '/manager/listings', label: 'Review Listings', icon: List },
        { to: '/manager/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.ADMIN]: [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/properties', label: 'Browse', icon: Search },
        { to: '/admin/favorites', label: 'Favorites', icon: Heart },
        { to: '/admin/properties', label: 'Listings', icon: Building2 },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/managers', label: 'Managers', icon: Shield },
        { to: '/admin/chat', label: 'Messages', icon: MessageSquare },
    ],
};

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    // Notification store hooks
    const notifications = useNotificationStore((s) => s.notifications);
    const clearAll = useNotificationStore((s) => s.clearAll);
    const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
    const queryClient = useQueryClient();
    const [profileOpen, setProfileOpen] = useState(false);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const { user, isAuthenticated, isInitialized } = useAuth();
    const logout = useLogout();
    const navigate = useNavigate();
    const location = useLocation();
    const profileRef = useRef(null);
    const roleRef = useRef(null);
    const notificationRef = useRef(null);

    // ── Primary: subscribe to the same ['conversations'] key that ChatPage writes to.
    // This means any send/markRead in ChatPage immediately reflects here.
    const { data: convData } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => chatService.getConversations().then((r) => r.data),
        enabled: isAuthenticated && isInitialized,
        refetchInterval: notificationOpen ? 10000 : false,
        refetchOnWindowFocus: true,
        staleTime: 5000,
    });
    const conversations = convData?.conversations || [];

    // ── Secondary: dedicated unread-count endpoint as a fallback / cross-check
    const { data: unreadData } = useQuery({
        queryKey: ['unread-count'],
        queryFn: () => chatService.getUnreadCount().then((r) => r.data),
        enabled: isAuthenticated && isInitialized,
        refetchInterval: 5000,
        refetchOnWindowFocus: true,
        staleTime: 5000,
    });

    const getChatLink = (role) => {
        if (!role) return '/buyer/chat';
        const lowerRole = role.toLowerCase();
        if (lowerRole === 'buyer' || lowerRole === 'rental_seeker') return '/buyer/chat';
        if (lowerRole === 'seller' || lowerRole === 'rental_owner') return '/seller/chat';
        if (lowerRole === 'manager') return '/manager/chat';
        if (lowerRole === 'admin') return '/admin/chat';
        return '/buyer/chat';
    };

    const isChatPage = location.pathname.includes('/chat');

    // Derive unread count from conversations cache (primary) with API count as fallback
    const convUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const apiUnreadCount = unreadData?.count || 0;
    // Use the larger of the two to avoid momentary zeroing from race conditions
    const chatUnreadCount = isChatPage ? 0 : Math.max(convUnreadCount, apiUnreadCount);

    const chatNotifications = isChatPage
        ? []
        : conversations
            .filter(c => c.unreadCount > 0)
            .map(c => ({
                id: `chat-${c.id}`,
                message: `New message from ${c.otherUser?.name || 'Unknown'}: "${c.lastMessage}"`,
                createdAt: c.lastMessageAt || new Date().toISOString(),
                isChat: true,
                link: getChatLink(user?.activeRole)
            }));

    const notificationUnreadCount = useNotificationStore((s) => s.unreadCount);
    const totalUnreadCount = notificationUnreadCount + chatUnreadCount;

    const allNotifications = [...notifications, ...chatNotifications];

    const setUser = useAuthStore((s) => s.setUser);
    const { theme, toggleTheme } = useThemeStore();

    const links = isAuthenticated && user
        ? roleMenus[user.activeRole] || []
        : guestLinks;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setMobileOpen(false); setRoleDropdownOpen(false); }, [location.pathname]);

    useEffect(() => {
        const handleClick = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
            if (roleRef.current && !roleRef.current.contains(e.target)) {
                setRoleDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(e.target)) {
                setNotificationOpen(false);
            }
        };
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, []);

    const handleSwitchRole = async (role) => {
        try {
            const { data } = await userService.switchRole(role);
            await authService.refreshToken();
            setUser(data.user);
            toast.success(`Switched to ${ROLE_LABELS[role]}`);
            setTimeout(() => {
                navigate(getDashboardPath(role));
            }, 100);
        } catch {
            toast.error('Failed to switch role');
        }
        setProfileOpen(false);
        setRoleDropdownOpen(false);
    };

    const switchableRoles = (user?.activeRole === 'ADMIN' || user?.activeRole === 'MANAGER')
        ? []
        : (user?.roles?.filter((r) => r !== user.activeRole && r !== 'MANAGER' && r !== 'ADMIN') || []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-surface-dark/80 backdrop-blur-xl border-b border-surface-border">
            <div className="page-container">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <img src="/squarefeetx.png" alt="SquareFeet X" className="w-9 h-9 rounded-xl object-contain" />
                        <div className="hidden sm:block">
                            <span className="text-lg font-display font-bold text-text-primary">Square</span>
                            <span className="text-lg font-display font-bold text-gradient">Feet X</span>
                        </div>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((link) => {
                            const pathWithoutQuery = link.to.split('?')[0];
                            const queryPart = link.to.split('?')[1];
                            let isActive = location.pathname === pathWithoutQuery;
                            if (isActive && queryPart) {
                                isActive = location.search.includes(queryPart);
                            }
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-royal-500/15 text-royal-400'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                        }`}
                                >
                                    <link.icon className="w-4 h-4" />
                                    {link.label}
                                    {link.label === 'Messages' && chatUnreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                            {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {/* Role Selector — visible when user has multiple roles */}
                        {isAuthenticated && user && switchableRoles.length > 0 && (
                            <div ref={roleRef} className="relative hidden sm:block">
                                <button
                                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-royal-500/10 border border-royal-500/20 text-royal-400 text-sm font-medium hover:bg-royal-500/20 transition-all"
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    {ROLE_LABELS[user.activeRole]}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {roleDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-48 glass-card p-1.5 shadow-2xl"
                                        >
                                            <div className="px-3 py-2 mb-1 border-b border-surface-border">
                                                <p className="text-xs font-medium text-text-muted">Switch to:</p>
                                            </div>
                                            {switchableRoles.map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => handleSwitchRole(role)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all"
                                                >
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                    {ROLE_LABELS[role]}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <button onClick={toggleTheme} className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all">
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {!isAuthenticated ? (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover rounded-xl transition-all">
                                    Sign In
                                </Link>
                                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-royal-500 hover:bg-royal-600 text-white rounded-xl transition-all">
                                    Get Started
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Notification Bell & Dropdown Container */}
                                <div ref={notificationRef} className="relative">
                                    {/* Notification Bell */}
                                    <button
                                        className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all animate-fade-in"
                                        onClick={() => setNotificationOpen(prev => !prev)}
                                    >
                                        <Bell className="w-5 h-5" />
                                        {totalUnreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    {notificationOpen && (
                                        <AnimatePresence>
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-2 w-80 glass-card p-2 shadow-2xl z-50"
                                            >
                                                <div className="flex items-center justify-between p-3 border-b border-surface-border mb-2">
                                                    <p className="text-sm font-semibold text-text-primary">Notifications</p>
                                                    <button
                                                        onClick={async () => {
                                                            clearAll();
                                                            setUnreadCount(0);
                                                            // Optimistically zero out unread in shared cache
                                                            queryClient.setQueryData(['unread-count'], { count: 0 });
                                                            queryClient.setQueryData(['conversations'], (old) => {
                                                                if (!old?.conversations) return old;
                                                                return { conversations: old.conversations.map(c => ({ ...c, unreadCount: 0 })) };
                                                            });
                                                            try {
                                                                const unreadChats = conversations.filter(c => c.unreadCount > 0);
                                                                await Promise.all(unreadChats.map(c => chatService.markRead(c.id)));
                                                                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                                                                queryClient.invalidateQueries({ queryKey: ['unread-count'] });
                                                            } catch (err) {
                                                                console.error("Failed to clear notifications", err);
                                                            }
                                                        }}
                                                        className="text-xs text-royal-400 hover:text-royal-300"
                                                    >
                                                        Clear all
                                                    </button>
                                                </div>
                                                {allNotifications.length === 0 ? (
                                                    <p className="text-xs text-text-muted p-2">No new notifications</p>
                                                ) : (
                                                    allNotifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            onClick={async () => {
                                                                if (n.isChat) {
                                                                    try {
                                                                        const convId = n.id.replace('chat-', '');
                                                                        await chatService.markRead(convId);
                                                                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                                                                        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    }
                                                                    if (n.link) navigate(n.link);
                                                                } else {
                                                                    const markReadStore = useNotificationStore.getState().markRead;
                                                                    markReadStore(n.id);
                                                                    if (n.link) navigate(n.link);
                                                                }
                                                                setNotificationOpen(false);
                                                            }}
                                                            className={`flex items-center gap-2 p-2 hover:bg-surface-hover rounded ${n.isChat ? 'cursor-pointer border-l-2 border-royal-500' : ''}`}
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm text-text-primary">{n.message}</p>
                                                                <p className="text-xs text-text-muted">{new Date(n.createdAt).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    )}
                                </div>

                                {/* Profile Dropdown */}
                                <div ref={profileRef} className="relative">
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-hover transition-all"
                                    >
                                        <Avatar src={user.profilePicUrl} name={user.name} size="sm" />
                                        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 hidden sm:block ${profileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {profileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-2 w-72 glass-card p-2 shadow-2xl"
                                            >
                                                {/* User Info */}
                                                <div className="p-3 border-b border-surface-border mb-2">
                                                    <p className="text-sm font-semibold text-text-primary">{user.name}</p>
                                                    <p className="text-xs text-text-muted">{user.email}</p>
                                                    <Badge variant="royal" className="mt-2">{ROLE_LABELS[user.activeRole]}</Badge>
                                                </div>

                                                {switchableRoles.length > 0 && (
                                                    <motion.div className="px-2 py-2 border-b border-surface-border mb-2 space-y-1">
                                                        <p className="text-xs text-text-muted px-1 font-medium">Switch role</p>
                                                        {switchableRoles.map((role) => (
                                                            <button
                                                                key={role}
                                                                onClick={() => handleSwitchRole(role)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all"
                                                            >
                                                                <ArrowRightLeft className="w-4 h-4" />
                                                                {ROLE_LABELS[role]}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}

                                                <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all">
                                                    <Settings className="w-4 h-4" />
                                                    Profile Settings
                                                </Link>
                                                <button
                                                    onClick={() => { setProfileOpen(false); logout(); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden overflow-hidden border-t border-surface-border"
                        >
                            <div className="py-3 space-y-1">
                                {links.map((link) => {
                                    const pathWithoutQuery = link.to.split('?')[0];
                                    const queryPart = link.to.split('?')[1];
                                    let isActive = location.pathname === pathWithoutQuery;
                                    if (isActive && queryPart) {
                                        isActive = location.search.includes(queryPart);
                                    }
                                    return (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? 'bg-royal-500/15 text-royal-400'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                                }`}
                                        >
                                            <link.icon className="w-4 h-4" />
                                            {link.label}
                                            {link.label === 'Messages' && chatUnreadCount > 0 && (
                                                <span className="absolute top-2.5 right-4 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                    {chatUnreadCount}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}

                                {/* Mobile Role Switcher */}
                                {isAuthenticated && user && switchableRoles.length > 0 && (
                                    <div className="px-3 pt-3 border-t border-surface-border mt-2">
                                        <p className="text-xs text-text-muted mb-2 font-medium">Switch Role</p>
                                        {switchableRoles.map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => handleSwitchRole(role)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"
                                            >
                                                <ArrowRightLeft className="w-4 h-4" />
                                                {ROLE_LABELS[role]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navbar;
