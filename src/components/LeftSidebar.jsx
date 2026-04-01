import React from 'react';
import { House, MagnifyingGlass, Books, Plus, Heart, SignOut, Clock, Gear, X } from 'phosphor-react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

export default function LeftSidebar({ isOpen, onClose }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { playlists, createNewPlaylist, openContextMenu, showToast } = usePlayerStore();
    const { isAuthenticated, currentUser } = useAuthStore();

    const handleCreatePlaylist = () => {
        if (!isAuthenticated) {
            showToast('Please log in to create a playlist');
            if (onClose) onClose();
            navigate('/login');
            return;
        }
        const newId = `playlist-${Date.now()}`;
        createNewPlaylist(newId);
        if (onClose) onClose();
        navigate(`/playlist/${newId}`);
    };

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <>
            <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
            <aside className={`left-sidebar glass-panel ${isOpen ? 'mobile-open' : ''}`}>
                <div className="mobile-sidebar-header hidden-desktop">
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '16px', background: 'linear-gradient(135deg, var(--accent-color), var(--accent-purple))', WebkitBackgroundClip: 'text', color: 'transparent' }}>Music Asek</h2>
                    <button className="close-sidebar-btn" onClick={onClose}>
                        <X size={24} weight="bold" />
                    </button>
                </div>
                
                <div className="nav-container glass-panel">
                    <div className="nav-links">
                        <NavLink to="/" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <House size={28} weight={location.pathname === '/' ? 'fill' : 'regular'} />
                            <span>Home</span>
                        </NavLink>
                        <NavLink to="/search" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <MagnifyingGlass size={28} weight={location.pathname === '/search' ? 'bold' : 'regular'} />
                            <span>Search</span>
                        </NavLink>
                        <NavLink to="/recently-played" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Clock size={28} weight={location.pathname === '/recently-played' ? 'fill' : 'regular'} />
                            <span>Recently Played</span>
                        </NavLink>
                        <NavLink to="/settings" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Gear size={28} weight={location.pathname === '/settings' ? 'fill' : 'regular'} />
                            <span>Settings</span>
                        </NavLink>
                    </div>
                </div>

                <div className="library-container glass-panel">
                    <div className="library-header nav-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Books size={28} />
                            <span>Your Library</span>
                        </div>
                        <Plus size={20} className="add-icon" onClick={handleCreatePlaylist} title="Create new playlist" />
                    </div>

                    <div className="playlist-actions">
                        <button className="action-btn" onClick={handleCreatePlaylist}>
                            <div className="icon-box new-playlist">
                                <Plus size={20} weight="bold" />
                            </div>
                            <span>Create Playlist</span>
                        </button>
                        <button className="action-btn" onClick={() => { handleNavClick(); navigate('/playlist/liked-songs'); }}>
                            <div className="icon-box liked-songs" style={{ background: 'var(--accent-purple)', color: '#fff' }}>
                                <Heart size={20} weight="fill" />
                            </div>
                            <span>Liked Songs</span>
                        </button>
                    </div>

                    <div className="divider"></div>

                    <div className="playlists-list scrollable">
                        {playlists.filter(p => p.is_public || (!p.owner_id && !p.id.startsWith('playlist-')) || (currentUser && p.owner_id === currentUser.id)).map((playlist) => (
                            <NavLink
                                key={playlist.id}
                                to={`/playlist/${playlist.id}`}
                                onClick={handleNavClick}
                                className={({ isActive }) => `playlist-link ${isActive ? 'active' : ''}`}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    openContextMenu(e.clientX, e.clientY, playlist, 'playlist');
                                }}
                            >
                                <img src={playlist.coverUrl} alt={playlist.name} className="sidebar-playlist-icon" />
                                <div className="playlist-link-text">
                                    <p className="playlist-name-text text-ellipsis">{playlist.name}</p>
                                    <p className="playlist-type-text">Playlist • {playlist.id.startsWith('playlist-') ? 'You' : 'Spotify'}</p>
                                </div>
                            </NavLink>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}
