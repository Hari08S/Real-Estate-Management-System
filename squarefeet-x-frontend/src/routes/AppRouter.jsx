import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './ProtectedRoute';
import { ROLES } from '../constants';
import { AppLoadingSkeleton } from '../components/ui/Skeleton';
import DashboardLayout from '../components/layout/DashboardLayout';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useInitAuth } from '../hooks';
import ScrollToTop from '../components/common/ScrollToTop';

// Lazy imports
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const BrowsePropertiesPage = lazy(() => import('../pages/public/BrowsePropertiesPage'));
const ComparePropertiesPage = lazy(() => import('../pages/public/ComparePropertiesPage'));
const PropertyDetailPage = lazy(() => import('../pages/public/PropertyDetailPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const BuyerDashboard = lazy(() => import('../pages/buyer/BuyerDashboard'));
const SavedPropertiesPage = lazy(() => import('../pages/buyer/SavedPropertiesPage'));
const ChatPage = lazy(() => import('../pages/buyer/ChatPage'));
const SellerDashboard = lazy(() => import('../pages/seller/SellerDashboard'));
const CreateListingPage = lazy(() => import('../pages/seller/CreateListingPage'));
const MyListingsPage = lazy(() => import('../pages/seller/MyListingsPage'));
const ManagerDashboard = lazy(() => import('../pages/manager/ManagerDashboard'));
const ManagerListingsPage = lazy(() => import('../pages/manager/ManagerListingsPage'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminPropertiesPage = lazy(() => import('../pages/admin/AdminPropertiesPage'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const ManagerAssignment = lazy(() => import('../pages/admin/ManagerAssignment'));
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'));
const ForbiddenPage = lazy(() => import('../pages/errors/ForbiddenPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const StaticPages = lazy(() => import('../pages/public/StaticPages'));
const SellerPortfolioPage = lazy(() => import('../pages/public/SellerPortfolioPage'));

const RouteMapPage = lazy(() => import('../pages/buyer/RouteMapPage'));

const SuspenseWrapper = ({ children }) => (
    <Suspense fallback={<AppLoadingSkeleton />}>
        <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
);

const router = createBrowserRouter([
    {
        element: (
            <>
                <ScrollToTop />
                <Outlet />
            </>
        ),
        children: [
            {
                path: '/',
                element: <SuspenseWrapper><LandingPage /></SuspenseWrapper>,
            },
            {
                path: '/about',
                element: <SuspenseWrapper><StaticPages /></SuspenseWrapper>,
            },
            {
                path: '/careers',
                element: <SuspenseWrapper><StaticPages /></SuspenseWrapper>,
            },
            {
                path: '/help',
                element: <SuspenseWrapper><StaticPages /></SuspenseWrapper>,
            },
            {
                path: '/contact',
                element: <SuspenseWrapper><StaticPages /></SuspenseWrapper>,
            },
            {
                path: '/privacy',
                element: <SuspenseWrapper><StaticPages /></SuspenseWrapper>,
            },
            {
                path: '/terms',
                element: <SuspenseWrapper><StaticPages /></SuspenseWrapper>,
            },
            {
                path: '/login',
                element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
            },
            {
                path: '/register',
                element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper>,
            },
            {
                path: '/forgot-password',
                element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>,
            },
            {
                path: '/reset-password/:token',
                element: <SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>,
            },
            {
                element: <DashboardLayout />,
                children: [
                    {
                        path: '/properties',
                        element: <SuspenseWrapper><BrowsePropertiesPage /></SuspenseWrapper>,
                    },
                    {
                        path: '/compare',
                        element: <SuspenseWrapper><ComparePropertiesPage /></SuspenseWrapper>,
                    },
                    {
                        path: '/properties/:id',
                        element: <SuspenseWrapper><PropertyDetailPage /></SuspenseWrapper>,
                    },
                    {
                        path: '/profile',
                        element: (
                            <ProtectedRoute>
                                <SuspenseWrapper><ProfilePage /></SuspenseWrapper>
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/seller/profile/:sellerId',
                        element: <SuspenseWrapper><SellerPortfolioPage /></SuspenseWrapper>,
                    },
                ]
            },

            // Buyer routes
            {
                path: '/buyer',
                element: (
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={[ROLES.BUYER, ROLES.RENTAL_SEEKER]}>
                            <DashboardLayout />
                        </RoleRoute>
                    </ProtectedRoute>
                ),
                children: [
                    { path: 'dashboard', element: <SuspenseWrapper><BuyerDashboard /></SuspenseWrapper> },
                    { path: 'favorites', element: <SuspenseWrapper><SavedPropertiesPage /></SuspenseWrapper> },
                    { path: 'chat', element: <SuspenseWrapper><ChatPage /></SuspenseWrapper> },
                    { path: 'route-map', element: <SuspenseWrapper><RouteMapPage /></SuspenseWrapper> },
                ],
            },

            // Seller routes
            {
                path: '/seller',
                element: (
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={[ROLES.SELLER, ROLES.RENTAL_OWNER]}>
                            <DashboardLayout />
                        </RoleRoute>
                    </ProtectedRoute>
                ),
                children: [
                    { path: 'dashboard', element: <SuspenseWrapper><SellerDashboard /></SuspenseWrapper> },
                    { path: 'create', element: <SuspenseWrapper><CreateListingPage /></SuspenseWrapper> },
                    { path: 'edit/:id', element: <SuspenseWrapper><CreateListingPage /></SuspenseWrapper> },
                    { path: 'listings', element: <SuspenseWrapper><MyListingsPage /></SuspenseWrapper> },
                    { path: 'chat', element: <SuspenseWrapper><ChatPage /></SuspenseWrapper> },
                ],
            },

            // Manager routes
            {
                path: '/manager',
                element: (
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={[ROLES.MANAGER]}>
                            <DashboardLayout />
                        </RoleRoute>
                    </ProtectedRoute>
                ),
                children: [
                    { path: 'dashboard', element: <SuspenseWrapper><ManagerDashboard /></SuspenseWrapper> },
                    { path: 'listings', element: <SuspenseWrapper><ManagerListingsPage /></SuspenseWrapper> },
                    { path: 'unassigned', element: <SuspenseWrapper><ManagerListingsPage /></SuspenseWrapper> },
                    { path: 'chat', element: <SuspenseWrapper><ChatPage /></SuspenseWrapper> },
                ],
            },

            // Admin routes
            {
                path: '/admin',
                element: (
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                            <DashboardLayout />
                        </RoleRoute>
                    </ProtectedRoute>
                ),
                children: [
                    { path: 'dashboard', element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper> },
                    { path: 'analytics', element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper> },
                    { path: 'favorites', element: <SuspenseWrapper><SavedPropertiesPage /></SuspenseWrapper> },
                    { path: 'properties', element: <SuspenseWrapper><AdminPropertiesPage /></SuspenseWrapper> },
                    { path: 'properties/edit/:id', element: <SuspenseWrapper><CreateListingPage /></SuspenseWrapper> },
                    { path: 'users', element: <SuspenseWrapper><UserManagement /></SuspenseWrapper> },
                    { path: 'managers', element: <SuspenseWrapper><ManagerAssignment /></SuspenseWrapper> },
                    { path: 'chat', element: <SuspenseWrapper><ChatPage /></SuspenseWrapper> },
                ],
            },

            // Error routes
            { path: '/403', element: <SuspenseWrapper><ForbiddenPage /></SuspenseWrapper> },
            { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
        ]
    }
]);

const AppRouter = () => {
    useInitAuth();
    return <RouterProvider router={router} />;
};

export default AppRouter;
