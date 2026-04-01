import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * ProtectedRoute — Wraps routes that require authentication.
 * If not authenticated, redirects to /login and passes the
 * current path as `state.from` so the user can be redirected
 * back after successful login.
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}
