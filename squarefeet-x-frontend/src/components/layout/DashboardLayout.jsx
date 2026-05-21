import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, List, PlusCircle, MessageSquare, Users,
    Shield, ChevronLeft, ChevronRight, Building2,
    Search, Heart, X, Navigation
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { useCompareStore } from '../../store/compareStore';
import { ROLES, ROLE_LABELS } from '../../constants';
import Navbar from './Navbar';
import Badge from '../ui/Badge';

const sidebarMenus = {
    [ROLES.BUYER]: [
        { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/properties', label: 'Browse Properties', icon: Search },
        { to: '/buyer/favorites', label: 'Favourite Properties', icon: Heart },
        { to: '/buyer/route-map', label: 'Route Map', icon: Navigation },
        { to: '/buyer/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.SELLER]: [
        { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/seller/create', label: 'Create Listing', icon: PlusCircle },
        { to: '/seller/listings', label: 'My Listings', icon: List },
        { to: '/seller/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.RENTAL_OWNER]: [
        { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/seller/create', label: 'Create Listing', icon: PlusCircle },
        { to: '/seller/listings', label: 'My Listings', icon: List },
        { to: '/seller/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.RENTAL_SEEKER]: [
        { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/properties', label: 'Browse Properties', icon: Search },
        { to: '/buyer/favorites', label: 'Favourite Properties', icon: Heart },
        { to: '/buyer/route-map', label: 'Route Map', icon: Navigation },
        { to: '/buyer/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.MANAGER]: [
        { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/properties', label: 'Browse Properties', icon: Search },
        { to: '/manager/listings?type=seller', label: 'Seller Properties', icon: List },
        { to: '/manager/listings?type=rent', label: 'Rent Properties', icon: List },
        { to: '/manager/unassigned', label: 'Unassigned Pool', icon: Building2 },
        { to: '/manager/chat', label: 'Messages', icon: MessageSquare },
    ],
    [ROLES.ADMIN]: [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/properties', label: 'Browse Properties', icon: Search },
        { to: '/admin/properties?type=sale', label: 'Seller Properties', icon: Building2 },
        { to: '/admin/properties?type=rent', label: 'Rent Properties', icon: Building2 },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/managers', label: 'Managers', icon: Shield },
        { to: '/admin/chat', label: 'Messages', icon: MessageSquare },
    ],
};

const DashboardLayout = () => {
    const [collapsed, setCollapsed] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);
    const compareItems = useCompareStore((s) => s.items);
    const clearCompare = useCompareStore((s) => s.clearAll);
    const menu = sidebarMenus[user?.activeRole] || [];

    const showSidebar = isAuthenticated && menu.length > 0;
    const isPublicPropertyRoute = location.pathname.startsWith('/properties') || location.pathname === '/properties';

    return (
        <div className="min-h-screen bg-surface-dark flex flex-col">
            <Navbar />
            <div className={`flex flex-1 ${showSidebar ? "pt-16" : ""}`}>
                {/* Sidebar */}
                {showSidebar && (
                    <aside className={`hidden lg:flex flex-col fixed top-16 left-0 bottom-0 z-30 bg-surface-card border-r border-surface-border transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
                        <div className="flex-1 py-4 overflow-y-auto">
                            {!collapsed && (
                                <div className="px-4 mb-4">
                                    <Badge variant="royal">{ROLE_LABELS[user?.activeRole]}</Badge>
                                </div>
                            )}
                            <nav className="px-2 space-y-1">
                                {menu.map((item) => {
                                    const pathWithoutQuery = item.to.split('?')[0];
                                    const queryPart = item.to.split('?')[1];
                                    let isActive = location.pathname === pathWithoutQuery;
                                    if (isActive && queryPart) {
                                        isActive = location.search.includes(queryPart);
                                    }
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            title={collapsed ? item.label : undefined}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'bg-royal-500/15 text-royal-400 shadow-sm shadow-royal-500/10'
                                                : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                                                } ${collapsed ? 'justify-center' : ''}`}
                                        >
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Collapse Toggle */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="flex items-center justify-center h-12 border-t border-surface-border text-gray-400 hover:text-white hover:bg-surface-hover transition-all"
                        >
                            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        </button>
                    </aside>
                )}

                {/* Main Content */}
                <main className={`flex-1 min-w-0 transition-all duration-300 ${showSidebar ? (collapsed ? 'lg:ml-[72px]' : 'lg:ml-64') : ''}`}>
                    <div className={isPublicPropertyRoute ? "w-full" : showSidebar ? "px-4 sm:px-6 lg:px-8 xl:px-12 py-8" : "w-full"}>
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Global Compare Widget */}
            <AnimatePresence>
                {compareItems.length > 0 && location.pathname !== '/compare' && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 z-50 flex items-center bg-royal-600/90 backdrop-blur shadow-2xl shadow-royal-500/20 rounded-2xl p-1 pr-2 border border-royal-500/50"
                    >
                        <div className="flex -space-x-3 ml-2 mr-4">
                            {compareItems.map((item, i) => (
                                <img
                                    key={item.id}
                                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100'}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover border-2 border-royal-600 shadow-sm"
                                    style={{ zIndex: compareItems.length - i }}
                                />
                            ))}
                        </div>
                        <div className="text-white mr-4">
                            <p className="text-xs font-semibold">{compareItems.length} {compareItems.length === 1 ? 'Property' : 'Properties'}</p>
                            <p className="text-[10px] text-white/70">Selected for comparison</p>
                        </div>
                        <div className="flex gap-2">
                            <Link to="/compare" className="bg-white text-royal-600 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors">
                                Compare
                            </Link>
                            <button onClick={clearCompare} className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardLayout;
