import React, { useState, useRef, useEffect } from 'react';
import { CaretLeft, CaretRight, User, Bell, Users, SignOut, ShieldCheck, UserCircle } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

export default function Topbar() {
    const navigate = useNavigate();
    const { showToast, isAdminAuthenticated } = usePlayerStore();
    const { currentUser, isAuthenticated, logout } = useAuthStore();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifMenu, setShowNotifMenu] = useState(false);

    const profileRef = useRef(null);
    const notifRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setShowProfileMenu(false);
        navigate('/');
        showToast("Logged out successfully");
    };

    return (
        <header className="topbar">
            <div className="nav-arrows">
                <button className="arrow-btn" onClick={() => navigate(-1)}><CaretLeft size={24} /></button>
                <button className="arrow-btn" onClick={() => navigate(1)}><CaretRight size={24} /></button>
            </div>

            <div className="topbar-actions" style={{ position: 'relative' }}>
                {/* Notifications */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button
                        className="action-icon"
                        onClick={() => setShowNotifMenu(!showNotifMenu)}
                        title="Notifications"
                    >
                        <Bell size={20} />
                    </button>
                    {showNotifMenu && (
                        <div className="dropdown-menu">
                            <h4 style={{ padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Notifications</h4>
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                No new notifications
                            </div>
                        </div>
                    )}
                </div>

                <button className="action-icon" onClick={() => showToast('Friends Activity coming soon!')} title="Friends Activity">
                    <Users size={20} />
                </button>

                {/* Profile Menu */}
                <div ref={profileRef} style={{ position: 'relative' }}>
                    <button
                        className="profile-btn"
                        onClick={() => isAuthenticated ? setShowProfileMenu(!showProfileMenu) : navigate('/login')}
                    >
                        <div
                            className="profile-img"
                            style={{
                                border: '2px solid var(--accent-color)',
                                background: (isAuthenticated && currentUser?.avatarUrl)
                                    ? `url(${currentUser.avatarUrl}) center/cover no-repeat`
                                    : (isAuthenticated ? currentUser?.avatarColor : 'transparent'),
                                color: isAuthenticated ? '#fff' : 'var(--accent-color)',
                                overflow: 'hidden'
                            }}
                        >
                            {isAuthenticated ? (
                                !currentUser?.avatarUrl && (
                                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                        {currentUser?.username?.charAt(0).toUpperCase()}
                                    </span>
                                )
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                    </button>

                    {showProfileMenu && isAuthenticated && (
                        <div className="dropdown-menu">
                            <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>
                                <UserCircle size={20} />
                                <span>Profile</span>
                            </button>

                            {isAdminAuthenticated && (
                                <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/admin'); }} style={{ color: 'var(--accent-color)' }}>
                                    <ShieldCheck size={20} />
                                    <span>Admin Panel</span>
                                </button>
                            )}

                            <div className="dropdown-divider"></div>

                            <button className="dropdown-item" onClick={handleLogout}>
                                <SignOut size={20} />
                                <span>Log out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 220px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--bg-glass-border);
                    border-radius: var(--border-radius-md);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
                    z-index: 1000;
                    overflow: hidden;
                    animation: dropDownShow 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    transform-origin: top right;
                }
                
                @keyframes dropDownShow {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    font-size: 14px;
                    font-weight: 500;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .dropdown-item:hover {
                    background: rgba(255,255,255,0.1);
                }

                .dropdown-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.05);
                    margin: 4px 0;
                }
            `}</style>
        </header>
    );
}
