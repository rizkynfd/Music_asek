import React, { useState, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Books, MusicNote, User, MusicNotes, Heart } from 'phosphor-react';

const TABS = [
    { key: 'playlists', label: 'Playlists', icon: <Books size={16} /> },
    { key: 'artists', label: 'Artists', icon: <User size={16} /> },
    { key: 'albums', label: 'Albums', icon: <MusicNotes size={16} /> },
    { key: 'liked', label: 'Liked Songs', icon: <Heart size={16} /> },
];

export default function Library() {
    const { playlists, songs, followedArtists, likedSongs } = usePlayerStore();
    const { isAuthenticated, currentUser } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('playlists');

    // Derived data for Albums tab
    const savedAlbums = useMemo(() => {
        const albumSet = new Map();
        // Show albums that have at least one liked song
        songs.forEach(song => {
            if (song.album && likedSongs.includes(song.id)) {
                if (!albumSet.has(song.album)) {
                    albumSet.set(song.album, { name: song.album, artist: song.artist, coverUrl: song.coverUrl });
                }
            }
        });
        return Array.from(albumSet.values());
    }, [songs, likedSongs]);

    // Derived data for Artists tab
    const followedArtistData = useMemo(() => {
        const artistSet = new Map();
        songs.forEach(song => {
            if (followedArtists.includes(song.artist) && !artistSet.has(song.artist)) {
                artistSet.set(song.artist, { name: song.artist, coverUrl: song.coverUrl });
            }
        });
        return Array.from(artistSet.values());
    }, [songs, followedArtists]);

    // Liked songs list
    const likedSongObjects = useMemo(() => {
        return songs.filter(s => likedSongs.includes(s.id));
    }, [songs, likedSongs]);

    const EmptyState = ({ icon, title, message, action, actionLabel }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: '16px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>{icon}</div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, maxWidth: '280px' }}>{message}</p>
            {action && (
                <button
                    onClick={action}
                    style={{ marginTop: '8px', padding: '10px 24px', borderRadius: '24px', background: 'var(--accent-color)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );

    return (
        <div className="library-view">
            <div className="section-header" style={{ marginBottom: '16px' }}>
                <h2>Your Library</h2>
            </div>

            {/* Tabs */}
            <div className="search-tabs" style={{ marginBottom: '24px' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`search-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Playlists Tab */}
            {activeTab === 'playlists' && (
                playlists.filter(p => p.is_public || (!p.owner_id && !p.id.startsWith('playlist-')) || (currentUser && p.owner_id === currentUser.id)).length > 0 ? (
                    <div className="card-grid">
                        {playlists.filter(p => p.is_public || (!p.owner_id && !p.id.startsWith('playlist-')) || (currentUser && p.owner_id === currentUser.id)).map((playlist) => (
                            <div key={playlist.id} className="music-card glass-panel" onClick={() => navigate(`/playlist/${playlist.id}`)}>
                                <div className="card-image-wrapper">
                                    <img src={playlist.coverUrl} alt={playlist.name} className="card-image" />
                                </div>
                                <h4 className="card-title text-ellipsis">{playlist.name}</h4>
                                <p className="card-desc text-ellipsis">{playlist.desc || `${playlist.songs.length} songs`}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<Books size={56} weight="thin" />}
                        title="Create your first playlist"
                        message="Use the + button in the sidebar to create a playlist and start organizing your music."
                    />
                )
            )}

            {/* Artists Tab */}
            {activeTab === 'artists' && (
                followedArtistData.length > 0 ? (
                    <div className="card-grid">
                        {followedArtistData.map(artist => (
                            <div key={artist.name} className="music-card glass-panel" onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}>
                                <img src={artist.coverUrl} alt={artist.name} className="card-image" style={{ borderRadius: '50%' }} />
                                <h4 className="card-title text-ellipsis">{artist.name}</h4>
                                <p className="card-desc">Artist</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<User size={56} weight="thin" />}
                        title="Follow your favorite artists"
                        message="Browse artist pages and click Follow to see them here."
                        action={() => navigate('/search')}
                        actionLabel="Find Artists"
                    />
                )
            )}

            {/* Albums Tab */}
            {activeTab === 'albums' && (
                savedAlbums.length > 0 ? (
                    <div className="card-grid">
                        {savedAlbums.map(album => (
                            <div key={album.name} className="music-card glass-panel" onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}>
                                <img src={album.coverUrl} alt={album.name} className="card-image" />
                                <h4 className="card-title text-ellipsis">{album.name}</h4>
                                <p className="card-desc text-ellipsis">{album.artist}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<MusicNotes size={56} weight="thin" />}
                        title="No saved albums yet"
                        message="Albums with liked songs will appear here automatically."
                        action={() => navigate('/search')}
                        actionLabel="Browse Music"
                    />
                )
            )}

            {/* Liked Songs Tab */}
            {activeTab === 'liked' && (
                <div>
                    {likedSongObjects.length > 0 ? (
                        <>
                            <div
                                className="music-card glass-panel"
                                onClick={() => navigate('/playlist/liked-songs')}
                                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', marginBottom: '24px', cursor: 'pointer' }}
                            >
                                <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-color), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Heart size={28} weight="fill" color="#000" />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Liked Songs</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>{likedSongObjects.length} songs</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={<Heart size={56} weight="thin" />}
                            title="Songs you like will appear here"
                            message="Click the ♥ on any song to add it to your Liked Songs."
                            action={() => navigate('/')}
                            actionLabel="Browse Music"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
