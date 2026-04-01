import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ChartBar, MusicNotes, ListPlus, SignOut, Users } from 'phosphor-react';

export default function AdminLayout() {
    const { logoutAdmin } = usePlayerStore();
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();       // Clears Supabase session + currentUser + isAuthenticated
        logoutAdmin();        // Also resets isAdminAuthenticated in playerStore
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', width: '100%', height: '100vh', background: 'var(--bg-base)' }}>
            {/* Admin Sidebar */}
            <aside style={{ width: '250px', background: 'var(--bg-elevated)', borderRight: '1px solid var(--bg-glass-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px' }}>
                    <h2 style={{ color: 'var(--accent-color)', margin: 0 }}>Spotify Wanna Be Admin</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>Content Management</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px', flex: 1 }}>
                    <NavLink to="/admin" end style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px',
                        background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                        textDecoration: 'none', fontWeight: isActive ? 'bold' : 'normal'
                    })}>
                        <ChartBar size={20} /> Dashboard
                    </NavLink>
                    <NavLink to="/admin/songs" style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px',
                        background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                        textDecoration: 'none', fontWeight: isActive ? 'bold' : 'normal'
                    })}>
                        <MusicNotes size={20} /> Manage Songs
                    </NavLink>
                    <NavLink to="/admin/playlists" style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px',
                        background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                        textDecoration: 'none', fontWeight: isActive ? 'bold' : 'normal'
                    })}>
                        <ListPlus size={20} /> Curated Playlists
                    </NavLink>
                    <NavLink to="/admin/users" style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px',
                        background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                        textDecoration: 'none', fontWeight: isActive ? 'bold' : 'normal'
                    })}>
                        <Users size={20} /> Manage Users
                    </NavLink>
                </nav>

                <div style={{ padding: '16px' }}>
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%',
                        background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '8px',
                        cursor: 'pointer', justifyContent: 'center'
                    }}>
                        <SignOut size={20} /> Logout
                    </button>
                    <button onClick={() => navigate('/')} style={{
                        marginTop: '12px', display: 'block', width: '100%', textAlign: 'center',
                        color: 'var(--text-secondary)', fontSize: '13px', textDecoration: 'underline', background: 'transparent'
                    }}>
                        Back to Player
                    </button>
                </div>
            </aside>

            {/* Admin Content Area */}
            <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}
