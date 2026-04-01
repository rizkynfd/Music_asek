import React, { useState } from 'react';
import { Gear, Keyboard, SpeakerHigh, User, SignOut, Info } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';

const SHORTCUTS = [
    { keys: ['Space'], description: 'Play / Pause' },
    { keys: ['→'], description: 'Skip to next song' },
    { keys: ['←'], description: 'Skip to previous / Restart' },
    { keys: ['M'], description: 'Mute / Unmute' },
    { keys: ['L'], description: 'Like / Unlike current song' },
];

export default function Settings() {
    const navigate = useNavigate();
    const { currentUser, isAuthenticated, logout } = useAuthStore();
    const { volume, setVolume } = usePlayerStore();
    const [crossfade, setCrossfade] = useState(5);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="settings-view">
            <div className="settings-header">
                <Gear size={48} weight="fill" style={{ color: 'var(--accent-color)' }} />
                <h1>Settings</h1>
            </div>

            {/* Account Section */}
            <section className="settings-section glass-panel">
                <h2 className="settings-section-title"><User size={20} /> Account</h2>
                {isAuthenticated && currentUser ? (
                    <div className="settings-account-row">
                        <div
                            className="settings-avatar"
                            style={{ background: currentUser.avatarColor || 'var(--accent-purple)' }}
                        >
                            {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="settings-account-info">
                            <p className="settings-account-name">{currentUser.username}</p>
                            <p className="settings-account-email">{currentUser.email}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="settings-btn-secondary" onClick={() => navigate('/profile')}>
                                Edit Profile
                            </button>
                            <button className="settings-btn-danger" onClick={handleLogout}>
                                <SignOut size={16} />
                                Log Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>You are not logged in.</p>
                        <button className="settings-btn-primary" onClick={() => navigate('/login')}>Log In</button>
                        <button className="settings-btn-secondary" onClick={() => navigate('/register')}>Sign Up</button>
                    </div>
                )}
            </section>

            {/* Audio Settings Section */}
            <section className="settings-section glass-panel">
                <h2 className="settings-section-title"><SpeakerHigh size={20} /> Audio Settings</h2>

                <div className="settings-row">
                    <div>
                        <p className="settings-row-label">Default Volume</p>
                        <p className="settings-row-desc">Controls the default playback volume.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={e => setVolume(parseFloat(e.target.value))}
                            className="settings-range"
                        />
                        <span style={{ color: 'var(--text-secondary)', minWidth: '36px', textAlign: 'right' }}>
                            {Math.round(volume * 100)}%
                        </span>
                    </div>
                </div>

                <div className="settings-row">
                    <div>
                        <p className="settings-row-label">Crossfade Duration</p>
                        <p className="settings-row-desc">Smooth transition time between songs (seconds).</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="range"
                            min="0"
                            max="12"
                            step="1"
                            value={crossfade}
                            onChange={e => setCrossfade(parseInt(e.target.value))}
                            className="settings-range"
                        />
                        <span style={{ color: 'var(--text-secondary)', minWidth: '36px', textAlign: 'right' }}>
                            {crossfade}s
                        </span>
                    </div>
                </div>

                <div className="settings-note">
                    <Info size={14} />
                    Audio quality settings will be configurable once the backend is connected.
                </div>
            </section>

            {/* Keyboard Shortcuts Section */}
            <section className="settings-section glass-panel">
                <h2 className="settings-section-title"><Keyboard size={20} /> Keyboard Shortcuts</h2>
                <table className="shortcuts-table">
                    <thead>
                        <tr>
                            <th>Shortcut</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SHORTCUTS.map((s, i) => (
                            <tr key={i}>
                                <td>
                                    {s.keys.map((k, ki) => (
                                        <kbd key={ki} className="kbd">{k}</kbd>
                                    ))}
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{s.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* About Section */}
            <section className="settings-section glass-panel">
                <h2 className="settings-section-title"><Info size={20} /> About</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Spotify Clone — Built with React + Vite + Zustand.<br />
                    Backend integration pending. All data is currently stored locally in your browser.
                </p>
            </section>

            <style>{`
                .settings-view { padding: 32px 24px 48px; max-width: 800px; }
                .settings-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
                .settings-header h1 { font-size: 36px; font-weight: 800; margin: 0; }
                .settings-section { padding: 24px; border-radius: 16px; margin-bottom: 16px; }
                .settings-section-title {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 18px; font-weight: 700; margin: 0 0 20px;
                    color: var(--text-primary);
                }
                .settings-account-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
                .settings-avatar {
                    width: 56px; height: 56px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 22px; font-weight: 700; color: #fff; flex-shrink: 0;
                }
                .settings-account-info { flex: 1; }
                .settings-account-name { font-weight: 700; margin: 0; font-size: 16px; }
                .settings-account-email { color: var(--text-secondary); font-size: 13px; margin: 2px 0 0; }
                .settings-btn-primary {
                    padding: 10px 20px; border-radius: 24px;
                    background: var(--accent-color); color: #000;
                    border: none; cursor: pointer; font-weight: 700; font-size: 13px;
                }
                .settings-btn-secondary {
                    padding: 10px 20px; border-radius: 24px;
                    background: transparent; color: var(--text-primary);
                    border: 1px solid rgba(255,255,255,0.2); cursor: pointer; font-size: 13px;
                    transition: background 0.2s;
                }
                .settings-btn-secondary:hover { background: rgba(255,255,255,0.1); }
                .settings-btn-danger {
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 20px; border-radius: 24px;
                    background: transparent; color: #ff6b6b;
                    border: 1px solid #ff6b6b44; cursor: pointer; font-size: 13px;
                    transition: background 0.2s;
                }
                .settings-btn-danger:hover { background: rgba(255,107,107,0.1); }
                .settings-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
                    gap: 24px;
                }
                .settings-row:last-of-type { border-bottom: none; }
                .settings-row-label { font-weight: 600; margin: 0 0 4px; font-size: 15px; }
                .settings-row-desc { color: var(--text-secondary); font-size: 13px; margin: 0; }
                .settings-range {
                    -webkit-appearance: none;
                    width: 140px; height: 4px;
                    background: rgba(255,255,255,0.15);
                    border-radius: 4px; outline: none; cursor: pointer;
                }
                .settings-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px; height: 14px;
                    background: var(--accent-color);
                    border-radius: 50%;
                }
                .settings-note {
                    display: flex; align-items: center; gap: 8px;
                    margin-top: 16px; padding: 10px 14px;
                    background: rgba(0,240,255,0.07); border-radius: 8px;
                    color: var(--text-secondary); font-size: 13px;
                    border: 1px solid rgba(0,240,255,0.1);
                }
                .shortcuts-table { width: 100%; border-collapse: collapse; }
                .shortcuts-table th {
                    text-align: left; font-size: 12px; text-transform: uppercase;
                    letter-spacing: 1px; color: var(--text-tertiary);
                    padding: 0 0 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
                }
                .shortcuts-table td { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .shortcuts-table tr:last-child td { border-bottom: none; }
                .kbd {
                    display: inline-flex; align-items: center; justify-content: center;
                    padding: 4px 10px; border-radius: 6px;
                    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                    font-family: monospace; font-size: 13px; font-weight: 600;
                    color: var(--text-primary); min-width: 28px;
                    box-shadow: 0 2px 0 rgba(0,0,0,0.3);
                    margin-right: 4px;
                }
            `}</style>
        </div>
    );
}
