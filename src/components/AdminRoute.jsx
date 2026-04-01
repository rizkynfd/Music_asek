import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

export default function AdminRoute({ children }) {
    const { isAdminAuthenticated } = usePlayerStore();
    const { currentUser } = useAuthStore();

    // Allow if either: playerStore flag is set OR currentUser has isAdmin: true
    // (double-check prevents race condition on first render after login)
    const isAdmin = isAdminAuthenticated || currentUser?.isAdmin === true;

    if (!isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
