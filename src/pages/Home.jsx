import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { PlayCircle, PauseCircle } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import GenreCard from '../components/GenreCard';

export default function Home() {
    const {
        setCurrentSong, currentSong, isPlaying, togglePlay,
        playlists, openContextMenu, songs, genres, playbackHistory
    } = usePlayerStore();
    const navigate = useNavigate();

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

    const handleNavigate = (id) => {
        navigate(`/playlist/${id}`);
    };

    // Trending: first 6 songs
    const trendingSongs = songs.slice(0, 6);

    // New Releases: last 5 songs (most recently added)
    const newReleases = [...songs].slice(-5).reverse();

    // Recently played (deduplicated)
    const recentSongs = playbackHistory
        .filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
        .slice(0, 6);

    // Quick Access items: 6 most recent songs
    const quickAccessItems = recentSongs.slice(0, 6);

    const handleQuickAccessClick = (item) => {
        if (item.type === 'playlist' || item.id.includes('playlist-') || item.id.includes('curated-')) {
            handleNavigate(item.id);
        } else {
            handlePlaySong({ stopPropagation: () => { } }, item);
        }
    };



    return (
        <div className="home-view">

            {/* Recently Played Quick Access */}
            <section className="recent-grid section">
                {quickAccessItems.map((item) => (
                    <div key={`${item.type || 'song'}-${item.id}`} className="recent-card glass-panel" onClick={() => handleQuickAccessClick(item)}>
                        <img src={item.coverUrl} alt={item.title} />
                        <span className="recent-title">{item.title}</span>
                    </div>
                ))}
            </section>

            {/* Recently Played Songs */}
            {recentSongs.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2>Recently Played</h2>
                        <button className="show-all-btn" onClick={() => navigate('/recently-played')}>Show all</button>
                    </div>
                    <div className="card-grid">
                        {recentSongs.map(song => {
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
                                                background: 'var(--accent-color)', color: '#000', borderRadius: '50%',
                                                padding: '8px', display: 'flex', border: 'none', cursor: 'pointer',
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

            {/* Trending Now */}
            <section className="section">
                <div className="section-header">
                    <h2>Trending Now</h2>
                    <button className="show-all-btn" onClick={() => navigate('/search')}>Show all</button>
                </div>
                <div className="card-grid">
                    {trendingSongs.map(song => {
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
                                            background: 'var(--accent-color)', color: '#000', borderRadius: '50%',
                                            padding: '8px', display: 'flex', border: 'none', cursor: 'pointer',
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

            {/* New Releases */}
            <section className="section">
                <div className="section-header">
                    <h2>New Releases</h2>
                    <button className="show-all-btn" onClick={() => navigate('/search')}>Show all</button>
                </div>
                <div className="horizontal-scroll-list">
                    {newReleases.map(song => (
                        <div
                            key={song.id}
                            className="new-release-card glass-panel"
                            onClick={() => handlePlaySong({ stopPropagation: () => { } }, song)}
                            onContextMenu={(e) => handleContextMenu(e, song)}
                        >
                            <img src={song.coverUrl} alt={song.title} className="new-release-img" />
                            <div className="new-release-info">
                                <p className="new-release-title text-ellipsis">{song.title}</p>
                                <p className="new-release-artist text-ellipsis">{song.artist}</p>
                                <span className="new-release-badge">NEW</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Browse by Genre */}
            <section className="section">
                <div className="section-header">
                    <h2>Browse by Genre</h2>
                </div>
                <div className="genre-grid">
                    {genres.map(genre => (
                        <GenreCard key={genre.id} genre={genre} />
                    ))}
                </div>
            </section>

            {/* Made For You (Playlists) */}
            <section className="section">
                <div className="section-header">
                    <h2>Made For You</h2>
                    <button className="show-all-btn">Show all</button>
                </div>
                <div className="card-grid">
                    {playlists.filter(p => !p.owner_id && p.id !== 'liked-songs').map((playlist) => (
                        <div key={playlist.id} className="music-card glass-panel" onClick={() => handleNavigate(playlist.id)}>
                            <img src={playlist.coverUrl} alt={playlist.name} className="card-image" />
                            <h4 className="card-title text-ellipsis">{playlist.name}</h4>
                            <p className="card-desc text-ellipsis">{playlist.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <style>{`
                .music-card:hover .card-play-btn {
                    opacity: 1 !important;
                    transform: translateY(-4px);
                }
                .card-play-btn:hover {
                    transform: translateY(-4px) scale(1.1) !important;
                    background: var(--accent-hover) !important;
                }
            `}</style>
        </div>
    );
}
