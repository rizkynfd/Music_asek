import React, { useState, useMemo } from 'react';
import { MagnifyingGlass, PlayCircle, PauseCircle, MusicNote, MusicNotes, User, Books, Disc } from 'phosphor-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import GenreCard from '../components/GenreCard';

const TABS = ['all', 'songs', 'artists', 'albums', 'playlists'];

export default function Search() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { setCurrentSong, currentSong, isPlaying, togglePlay, openContextMenu, songs, genres, playlists } = usePlayerStore();

    // If a genre param is in the URL, use it to filter
    const genreParam = searchParams.get('genre');

    const handleContextMenu = (e, song) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, song);
    };

    const handlePlaySong = (e, song) => {
        e.stopPropagation();
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song);
        }
    };

    // Derived filtered results
    const filteredSongs = useMemo(() => {
        let result = songs;
        if (genreParam && !searchQuery) {
            result = songs.filter(s => s.genre === genreParam);
        } else if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = songs.filter(song =>
                song.title.toLowerCase().includes(q) ||
                song.artist.toLowerCase().includes(q) ||
                (song.album || '').toLowerCase().includes(q) ||
                (song.genre || '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [songs, searchQuery, genreParam]);

    const filteredArtists = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        const artistSet = new Set();
        const result = [];
        songs.forEach(song => {
            if (song.artist.toLowerCase().includes(q) && !artistSet.has(song.artist)) {
                artistSet.add(song.artist);
                result.push({ name: song.artist, coverUrl: song.coverUrl });
            }
        });
        return result;
    }, [songs, searchQuery]);

    const filteredAlbums = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        const albumSet = new Set();
        const result = [];
        songs.forEach(song => {
            if (song.album && song.album.toLowerCase().includes(q) && !albumSet.has(song.album)) {
                albumSet.add(song.album);
                result.push({ name: song.album, artist: song.artist, coverUrl: song.coverUrl });
            }
        });
        return result;
    }, [songs, searchQuery]);

    const filteredPlaylists = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        return playlists.filter(p => p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q));
    }, [playlists, searchQuery]);

    const hasResults = filteredSongs.length > 0 || filteredArtists.length > 0 || filteredAlbums.length > 0 || filteredPlaylists.length > 0;
    const showTabs = searchQuery.length > 0;
    const showGenreBrowse = !searchQuery;

    // Active genre name for header
    const activeGenre = genreParam ? genres.find(g => g.id === genreParam) : null;



    return (
        <div className="search-view">
            {/* Search Input */}
            <div className="search-header" style={{ marginBottom: '24px' }}>
                <div className="search-input-container" style={{ position: 'relative', maxWidth: '400px', display: 'flex', alignItems: 'center' }}>
                    <MagnifyingGlass size={20} style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="What do you want to listen to?"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setActiveTab('all'); }}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 48px',
                            borderRadius: '24px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Tabs (only when searching) */}
            {showTabs && (
                <div className="search-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`search-tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            )}

            {/* Genre filter header */}
            {activeGenre && !searchQuery && (
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '700' }}>{activeGenre.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{filteredSongs.length} songs in this genre</p>
                </div>
            )}

            {/* Browse by Genre (when empty search, no genre filter) */}
            {showGenreBrowse && !genreParam && (
                <section className="section">
                    <h2>Browse all</h2>
                    <div className="genre-grid" style={{ marginTop: '16px' }}>
                        {genres.map(genre => (
                            <GenreCard key={genre.id} genre={genre} />
                        ))}
                    </div>
                </section>
            )}

            {/* Results when searching */}
            {searchQuery && !hasResults && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '32px' }}>No results found for "{searchQuery}"</p>
            )}

            {/* Songs results */}
            {(activeTab === 'all' || activeTab === 'songs') && filteredSongs.length > 0 && (
                <section className="section" style={{ marginTop: '24px' }}>
                    {searchQuery && <div className="section-header" style={{ marginBottom: '12px' }}><h2><MusicNote style={{ marginRight: '8px' }} />Songs</h2></div>}
                    <div className="card-grid">
                        {filteredSongs.map(song => {
                            const isThisPlaying = currentSong?.id === song.id && isPlaying;
                            return (
                                <div
                                    key={song.id}
                                    className={`music-card glass-panel ${currentSong?.id === song.id ? 'playing' : ''}`}
                                    onClick={() => handlePlaySong({ stopPropagation: () => { } }, song)}
                                    onContextMenu={(e) => handleContextMenu(e, song)}
                                >
                                    <div className="card-image-wrapper" style={{ position: 'relative' }}>
                                        <img src={song.coverUrl} alt={song.title} className="card-image" />
                                        <button
                                            className="card-play-btn"
                                            onClick={(e) => handlePlaySong(e, song)}
                                            style={{
                                                position: 'absolute', bottom: '24px', right: '8px',
                                                background: 'var(--accent-color)', color: '#000',
                                                borderRadius: '50%', padding: '8px', display: 'flex',
                                                border: 'none', cursor: 'pointer',
                                                opacity: isThisPlaying ? 1 : (currentSong?.id === song.id ? 1 : 0),
                                                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                                                transition: 'opacity 0.2s ease, transform 0.2s ease'
                                            }}
                                        >
                                            {isThisPlaying ? <PauseCircle size={24} weight="fill" /> : <PlayCircle size={24} weight="fill" />}
                                        </button>
                                    </div>
                                    <h4 className="card-title text-ellipsis">{song.title}</h4>
                                    <p className="card-desc text-ellipsis">{song.artist}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Artists results */}
            {(activeTab === 'all' || activeTab === 'artists') && filteredArtists.length > 0 && (
                <section className="section" style={{ marginTop: '24px' }}>
                    <div className="section-header" style={{ marginBottom: '12px' }}><h2><User style={{ marginRight: '8px' }} />Artists</h2></div>
                    <div className="card-grid">
                        {filteredArtists.map(artist => (
                            <div key={artist.name} className="music-card glass-panel" onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}>
                                <img src={artist.coverUrl} alt={artist.name} className="card-image" style={{ borderRadius: '50%' }} />
                                <h4 className="card-title text-ellipsis">{artist.name}</h4>
                                <p className="card-desc">Artist</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Albums results */}
            {(activeTab === 'all' || activeTab === 'albums') && filteredAlbums.length > 0 && (
                <section className="section" style={{ marginTop: '24px' }}>
                    <div className="section-header" style={{ marginBottom: '12px' }}><h2><Disc style={{ marginRight: '8px' }} />Albums</h2></div>
                    <div className="card-grid">
                        {filteredAlbums.map(album => (
                            <div key={album.name} className="music-card glass-panel" onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}>
                                <img src={album.coverUrl} alt={album.name} className="card-image" />
                                <h4 className="card-title text-ellipsis">{album.name}</h4>
                                <p className="card-desc text-ellipsis">{album.artist}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Playlists results */}
            {(activeTab === 'all' || activeTab === 'playlists') && filteredPlaylists.length > 0 && (
                <section className="section" style={{ marginTop: '24px' }}>
                    <div className="section-header" style={{ marginBottom: '12px' }}><h2><Books style={{ marginRight: '8px' }} />Playlists</h2></div>
                    <div className="card-grid">
                        {filteredPlaylists.map(playlist => (
                            <div key={playlist.id} className="music-card glass-panel" onClick={() => navigate(`/playlist/${playlist.id}`)}>
                                <img src={playlist.coverUrl} alt={playlist.name} className="card-image" />
                                <h4 className="card-title text-ellipsis">{playlist.name}</h4>
                                <p className="card-desc text-ellipsis">{playlist.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <style>{`
                .music-card:hover .card-play-btn { opacity: 1 !important; transform: translateY(-4px); }
                .card-play-btn:hover { transform: translateY(-4px) scale(1.1) !important; background: var(--accent-hover) !important; }
            `}</style>
        </div>
    );
}
