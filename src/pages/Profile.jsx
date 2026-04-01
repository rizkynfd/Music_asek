import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilSimple, SignOut, Clock, MusicNote, Check, X } from 'phosphor-react';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Profile() {
    const navigate = useNavigate();
    const { currentUser, isAuthenticated, logout, updateProfile } = useAuthStore();
    const { playlists, playbackHistory, setCurrentSong } = usePlayerStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(currentUser?.username || '');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 300;
                
                canvas.width = MAX_SIZE;
                canvas.height = MAX_SIZE;

                const ctx = canvas.getContext('2d');
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;
                
                // Crop and compress
                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
                
                const base64Url = canvas.toDataURL('image/jpeg', 0.85);
                updateProfile({ avatarUrl: base64Url });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Redirect if not logged in
    if (!isAuthenticated || !currentUser) {
        return (
            <div className="profile-not-auth">
                <MusicNote size={64} color="var(--text-tertiary)" />
                <h2>You are not logged in</h2>
                <p>Please log in to view your profile.</p>
                <button className="auth-btn-primary" style={{ marginTop: '16px', width: 'auto', padding: '12px 32px' }} onClick={() => navigate('/login')}>
                    Log In
                </button>
            </div>
        );
    }

    const handleSaveName = () => {
        if (editName.trim()) {
            updateProfile({ username: editName.trim() });
        }
        setIsEditing(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // User's playlists = those created by user (owner_id matches)
    const userPlaylists = playlists.filter(p => p.owner_id === currentUser.id || (p.owner_id == null && p.id.startsWith('playlist-')));
    // Full song objects from playback history (deduplicated by id)
    const recentSongs = playbackHistory
        .filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
        .slice(0, 10);

    const initials = currentUser.username
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="profile-view">
            {/* --- Profile Header --- */}
            <div className="profile-header">
                {/* Avatar */}
                <div 
                    className={`profile-avatar ${isEditing ? 'editable' : ''}`} 
                    style={{ 
                        background: currentUser.avatarColor || 'var(--accent-purple)',
                        cursor: isEditing ? 'pointer' : 'default',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onClick={() => isEditing && fileInputRef.current?.click()}
                    title={isEditing ? "Change photo" : ""}
                >
                    {currentUser.avatarUrl ? (
                        <img 
                            src={currentUser.avatarUrl} 
                            alt="Avatar" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                        />
                    ) : (
                        <span className="profile-avatar-initials">{initials}</span>
                    )}

                    {isEditing && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                            color: '#fff', gap: '4px', opacity: 0, transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                        >
                            <PencilSimple size={24} weight="fill" />
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>Choose photo</span>
                        </div>
                    )}
                </div>
                
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange} 
                />

                {/* Info */}
                <div className="profile-info">
                    <p className="profile-type-label">Profile</p>

                    {isEditing ? (
                        <div className="profile-name-edit">
                            <input
                                className="profile-name-input"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                            />
                            <button className="profile-icon-btn accent" onClick={handleSaveName} title="Save">
                                <Check size={20} weight="bold" />
                            </button>
                            <button className="profile-icon-btn" onClick={() => setIsEditing(false)} title="Cancel">
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <h1 className="profile-name">{currentUser.username}</h1>
                    )}

                    <p className="profile-email">{currentUser.email}</p>
                    <p className="profile-stats">
                        <span>{userPlaylists.length} Playlists</span>
                        <span className="profile-stats-dot">•</span>
                        <span>{recentSongs.length} Recently Played</span>
                    </p>
                </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="profile-actions-row">
                <button className="profile-edit-btn" onClick={() => { setEditName(currentUser.username); setIsEditing(true); }}>
                    <PencilSimple size={16} weight="bold" />
                    Edit Profile
                </button>
                <button className="profile-logout-btn" onClick={handleLogout}>
                    <SignOut size={16} weight="bold" />
                    Log Out
                </button>
            </div>

            {/* --- Your Playlists --- */}
            <section className="profile-section">
                <div className="section-header">
                    <h2>Your Playlists</h2>
                </div>
                {userPlaylists.length === 0 ? (
                    <div className="profile-empty-state">
                        <p>You haven't created any playlists yet.</p>
                        <button className="auth-btn-primary" style={{ width: 'auto', padding: '10px 24px', marginTop: '12px' }} onClick={() => navigate('/')}>
                            Browse Music
                        </button>
                    </div>
                ) : (
                    <div className="card-grid">
                        {userPlaylists.map(playlist => (
                            <div key={playlist.id} className="music-card" onClick={() => navigate(`/playlist/${playlist.id}`)}>
                                <img src={playlist.coverUrl} alt={playlist.name} className="card-image" />
                                <p className="card-title text-ellipsis">{playlist.name}</p>
                                <p className="card-desc">{playlist.songs.length} songs</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* --- Recently Played --- */}
            {recentSongs.length > 0 && (
                <section className="profile-section">
                    <div className="section-header">
                        <h2>Recently Played</h2>
                    </div>
                    <div className="profile-recent-list">
                        {recentSongs.map((song, i) => (
                            <div
                                key={`${song.id}-${i}`}
                                className="profile-recent-item"
                                onClick={() => setCurrentSong(song)}
                            >
                                <img src={song.coverUrl} alt={song.title} className="profile-recent-cover" />
                                <div className="profile-recent-info">
                                    <p className="profile-recent-title text-ellipsis">{song.title}</p>
                                    <p className="profile-recent-artist text-ellipsis">{song.artist}</p>
                                </div>
                                <div className="profile-recent-play">
                                    <Clock size={14} color="var(--text-secondary)" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
