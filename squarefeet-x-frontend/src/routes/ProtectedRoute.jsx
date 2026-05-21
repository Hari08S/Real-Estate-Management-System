import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';
import { getDashboardPath } from '../constants';

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isInitialized } = useAuth();
    const location = useLocation();

    if (!isInitialized) return null;

    if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
    }

    return children;
};

export const RoleRoute = ({ children, allowedRoles = [] }) => {
    const { user, isAuthenticated, isInitialized } = useAuth();

    if (!isInitialized) return null;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.activeRole)) {
        return <Navigate to={getDashboardPath(user?.activeRole)} replace />;
    }

    return children;
};
