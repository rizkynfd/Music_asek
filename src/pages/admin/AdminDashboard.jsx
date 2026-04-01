import React, { useEffect } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MusicNotes, ListPlus, Users, Heart, Star, ArrowRight } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const { songs, playlists, likedSongs, initializeFromSupabase } = usePlayerStore();
    const { registeredUsers, fetchAllUsers } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Ensure data is fresh
        initializeFromSupabase();
        fetchAllUsers();
    }, []);

    // Calculate which songs are in most playlists
    const songPlaylistCount = songs.map(song => ({
        ...song,
        count: playlists.filter(p => p.songs.includes(song.id)).length
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Unique artists count
    const uniqueArtists = new Set(songs.map(s => s.artist)).size;

    const statCards = [
        {
            label: 'Total Songs',
            value: songs.length,
            icon: <MusicNotes size={32} weight="fill" />,
            color: 'rgba(0, 240, 255, 0.1)',
            iconColor: 'var(--accent-color)',
            action: () => navigate('/admin/songs')
        },
        {
            label: 'Total Playlists',
            value: playlists.length,
            icon: <ListPlus size={32} weight="fill" />,
            color: 'rgba(176, 38, 255, 0.1)',
            iconColor: 'var(--accent-purple)',
            action: () => navigate('/admin/playlists')
        },
        {
            label: 'Registered Users',
            value: registeredUsers.length,
            icon: <Users size={32} weight="fill" />,
            color: 'rgba(107, 203, 119, 0.1)',
            iconColor: '#6bcb77',
            action: () => navigate('/admin/users')
        },
        {
            label: 'Total Liked Songs',
            value: likedSongs.length,
            icon: <Heart size={32} weight="fill" />,
            color: 'rgba(255, 107, 107, 0.1)',
            iconColor: '#ff6b6b',
            action: null
        },
        {
            label: 'Artists in Catalog',
            value: uniqueArtists,
            icon: <Star size={32} weight="fill" />,
            color: 'rgba(255, 146, 43, 0.1)',
            iconColor: '#ff922b',
            action: null
        }
    ];

    return (
        <div>
            <h1 style={{ marginBottom: '8px' }}>Dashboard Overview</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Welcome back to the Spotify Clone Content Management System.
            </p>

            {/* Stat Cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
                {statCards.map((card, i) => (
                    <div
                        key={i}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--bg-glass-border)',
                            borderRadius: '16px',
                            padding: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            flex: '1 1 180px',
                            cursor: card.action ? 'pointer' : 'default',
                            transition: 'background 0.2s, transform 0.2s',
                        }}
                        onClick={card.action || undefined}
                        onMouseEnter={e => { if (card.action) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { if (card.action) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <div style={{ background: card.color, color: card.iconColor, padding: '16px', borderRadius: '12px', flexShrink: 0 }}>
                            {card.icon}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '32px', margin: 0 }}>{card.value}</h2>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>{card.label}</p>
                        </div>
                        {card.action && <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />}
                    </div>
                ))}
            </div>

            {/* Top Songs by Playlist Count */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid var(--bg-glass-border)', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>
                    <Star size={18} style={{ marginRight: '8px', color: 'var(--accent-color)' }} />
                    Most Added to Playlists
                </h3>
                {songPlaylistCount.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ padding: '8px 0', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>#</th>
                                <th style={{ padding: '8px 0', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Song</th>
                                <th style={{ padding: '8px 0', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Artist</th>
                                <th style={{ padding: '8px 0', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>In Playlists</th>
                            </tr>
                        </thead>
                        <tbody>
                            {songPlaylistCount.map((song, idx) => (
                                <tr key={song.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '12px 0', color: 'var(--text-tertiary)', width: '32px' }}>{idx + 1}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={song.coverUrl} alt={song.title} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                            <span style={{ fontWeight: 500 }}>{song.title}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '14px' }}>{song.artist}</td>
                                    <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--accent-color)', fontWeight: 700 }}>{song.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No song data available.</p>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--bg-glass-border)' }}>
                <h3 style={{ marginBottom: '8px' }}>Quick Actions</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Use the sidebar to manage content, or jump directly to:</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/admin/songs')} style={{ padding: '10px 20px', borderRadius: '24px', background: 'var(--accent-color)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                        Add New Song
                    </button>
                    <button onClick={() => navigate('/admin/playlists')} style={{ padding: '10px 20px', borderRadius: '24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                        Manage Playlists
                    </button>
                    <button onClick={() => navigate('/admin/users')} style={{ padding: '10px 20px', borderRadius: '24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                        View Users
                    </button>
                </div>
            </div>
        </div>
    );
}
