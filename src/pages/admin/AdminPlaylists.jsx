import React, { useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Trash, Plus } from 'phosphor-react';

export default function AdminPlaylists() {
    const { playlists, songs, addPlaylist, showConfirm } = usePlayerStore();
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [selectedSongs, setSelectedSongs] = useState([]);

    const curatedPlaylists = playlists.filter(p => !p.id.startsWith('playlist-') && p.id !== 'liked-songs');

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!name || !coverUrl || selectedSongs.length === 0) {
            alert("Please provide a name, cover URL, and select at least one song.");
            return;
        }

        const newPlaylist = {
            id: `curated-${Date.now()}`,
            name,
            desc: desc || "Curated for you",
            coverUrl,
            songs: selectedSongs
        };

        addPlaylist(newPlaylist);
        setIsAdding(false);
        setName(''); setDesc(''); setCoverUrl(''); setSelectedSongs([]);
    };

    const toggleSongSelection = (songId) => {
        setSelectedSongs(prev =>
            prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
        );
    };

    const handleDelete = (id) => {
        showConfirm(
            "Are you sure you want to delete this curated playlist?",
            'DELETE_PLAYLIST',
            id
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ marginBottom: '8px' }}>Manage Curated Playlists</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Create curated playlists that will be recommended to all users on the Home page.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    style={{
                        background: isAdding ? 'var(--bg-glass-hover)' : 'var(--accent-purple)',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: '24px',
                        fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer'
                    }}
                >
                    {isAdding ? 'Cancel' : <><Plus size={20} weight="bold" /> Build Playlist</>}
                </button>
            </div>

            {isAdding && (
                <div style={{ background: 'rgba(176, 38, 255, 0.05)', border: '1px solid var(--accent-purple)', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
                    <h3 style={{ marginBottom: '24px', color: 'var(--accent-purple)' }}>Build New Playlist</h3>
                    <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <input className="admin-input-purple" placeholder="Playlist Name *" value={name} onChange={e => setName(e.target.value)} required />
                            <input className="admin-input-purple" placeholder="Short Description" value={desc} onChange={e => setDesc(e.target.value)} />
                            <input className="admin-input-purple" style={{ gridColumn: '1 / -1' }} placeholder="Cover Image URL (.jpg/.png) *" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} required />
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <h4 style={{ marginBottom: '12px' }}>Select Songs for this Playlist ({selectedSongs.length} selected) *</h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '200px', overflowY: 'auto', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                {songs.map(song => (
                                    <div
                                        key={song.id}
                                        onClick={() => toggleSongSelection(song.id)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '24px',
                                            border: `1px solid ${selectedSongs.includes(song.id) ? 'var(--accent-purple)' : 'var(--bg-glass-border)'}`,
                                            background: selectedSongs.includes(song.id) ? 'var(--accent-purple)' : 'transparent',
                                            color: selectedSongs.includes(song.id) ? '#fff' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        {song.title}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button type="submit" style={{ background: 'var(--accent-purple)', color: '#fff', padding: '12px 32px', borderRadius: '24px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Save Curated Playlist
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {curatedPlaylists.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No curated playlists exist.</p>
                ) : (
                    curatedPlaylists.map(playlist => (
                        <div key={playlist.id} className="music-card glass-panel" style={{ position: 'relative' }}>
                            <button
                                onClick={() => handleDelete(playlist.id)}
                                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#ff4444', padding: '8px', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                            >
                                <Trash size={16} />
                            </button>
                            <img src={playlist.coverUrl} alt={playlist.name} className="card-image" style={{ marginBottom: '12px' }} />
                            <h4 className="card-title text-ellipsis">{playlist.name}</h4>
                            <p className="card-desc text-ellipsis">{playlist.songs.length} tracks</p>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .admin-input-purple {
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 1px solid var(--bg-glass-border);
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .admin-input-purple:focus {
                    border-color: var(--accent-purple);
                }
            `}</style>
        </div>
    );
}
