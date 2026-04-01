import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlayCircle, PauseCircle, Clock, CalendarBlank, Play, Pause, MagnifyingGlass, PencilSimple } from 'phosphor-react';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Playlist() {
    const { id } = useParams();
    const {
        playlists, currentSong, isPlaying,
        setCurrentSong, togglePlay, openContextMenu,
        likedSongs, songs, openEditModal
    } = usePlayerStore();

    let playlist;
    const isLiked = id === 'liked-songs';

    if (isLiked) {
        playlist = {
            id: 'liked-songs',
            name: 'Liked Songs',
            desc: 'Your favorite tracks, all in one place.',
            coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5ff3d4a?q=80&w=300&auto=format&fit=crop',
            songs: likedSongs
        };
    } else {
        playlist = playlists.find(p => p.id === id);
    }

    const handleContextMenu = (e, song) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, song, 'song', playlist.id);
    };

    if (!playlist) {
        return (
            <div className="page-placeholder">
                <h1>Playlist Not Found</h1>
            </div>
        );
    }

    const playlistSongs = songs.filter(s => playlist.songs.includes(s.id));

    const handlePlaySong = (song) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song);
        }
    };

    const handleGlobalPlay = () => {
        if (playlistSongs.length === 0) return;
        const isSongInPlaylist = playlistSongs.some(s => s.id === currentSong?.id);
        if (isSongInPlaylist) {
            togglePlay();
        } else {
            setCurrentSong(playlistSongs[0]);
        }
    };

    const isPlaylistPlaying = isPlaying && playlistSongs.some(s => s.id === currentSong?.id);
    const isEmpty = playlistSongs.length === 0;

    return (
        <div className="playlist-view">
            {/* Header */}
            <div className="playlist-header">
                {/* Cover — clickable to edit (only for user playlists) */}
                <div
                    className={`plv-cover-wrap ${!isLiked ? 'editable' : ''}`}
                    onClick={() => !isLiked && openEditModal(playlist.id)}
                    title={!isLiked ? 'Edit playlist details' : ''}
                >
                    {playlist.coverUrl ? (
                        <img src={playlist.coverUrl} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                        <div className="plv-cover-empty">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18V6l12-2v12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="6" cy="18" r="3" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                                <circle cx="18" cy="16" r="3" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                            </svg>
                        </div>
                    )}
                    {!isLiked && (
                        <div className="plv-cover-overlay">
                            <PencilSimple size={32} weight="fill" />
                            <span>Choose photo</span>
                        </div>
                    )}
                </div>

                <div className="playlist-info-header">
                    <p className="playlist-type">Playlist</p>
                    <h1
                        className={`playlist-name-large ${!isLiked ? 'editable-title' : ''}`}
                        onClick={() => !isLiked && openEditModal(playlist.id)}
                        title={!isLiked ? 'Edit playlist details' : ''}
                    >
                        {playlist.name}
                    </h1>
                    {playlist.desc && <p className="playlist-description">{playlist.desc}</p>}
                    <p className="playlist-stats">
                        <strong>Musik Asek</strong> • {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="playlist-content">
                {!isEmpty && (
                    <div className="playlist-actions-bar">
                        <button className="main-play-btn" onClick={handleGlobalPlay}>
                            {isPlaylistPlaying
                                ? <PauseCircle size={56} weight="fill" color="var(--accent-color)" />
                                : <PlayCircle size={56} weight="fill" color="var(--accent-color)" />
                            }
                        </button>
                    </div>
                )}

                {isEmpty ? (
                    /* ── Spotify-style empty state ── */
                    <div className="plv-empty">
                        <div className="plv-empty-inner">
                            <p className="plv-empty-title">Let's find something for your playlist</p>
                            <div className="plv-empty-search-wrap">
                                <MagnifyingGlass size={16} className="plv-empty-search-icon" />
                                <input
                                    className="plv-empty-search"
                                    placeholder="Search for songs or episodes"
                                    readOnly
                                    onClick={() => document.querySelector('.search-input')?.focus()}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <table className="song-list-table">
                        <thead>
                            <tr>
                                <th className="th-id">#</th>
                                <th>Title</th>
                                <th>Album</th>
                                <th className="th-date"><CalendarBlank size={20} /></th>
                                <th className="th-duration"><Clock size={20} /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {playlistSongs.map((song, index) => {
                                const isThisPlaying = currentSong?.id === song.id && isPlaying;
                                return (
                                    <tr
                                        key={song.id}
                                        className={`song-row ${currentSong?.id === song.id ? 'active' : ''} ${isThisPlaying ? 'is-playing' : ''}`}
                                        onClick={() => handlePlaySong(song)}
                                        onContextMenu={(e) => handleContextMenu(e, song)}
                                    >
                                        <td className="td-id">
                                            <div className="id-container">
                                                <span className="song-index">{index + 1}</span>
                                                <span className="play-icon"><Play size={16} weight="fill" /></span>
                                                <span className="pause-icon"><Pause size={16} weight="fill" /></span>
                                                <div className="playing-gif playing-eq">
                                                    <div className="eq-line line-1"></div>
                                                    <div className="eq-line line-2"></div>
                                                    <div className="eq-line line-3"></div>
                                                    <div className="eq-line line-4"></div>
                                                    <div className="eq-line line-5"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="td-title">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <img src={song.coverUrl} alt={song.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: isThisPlaying ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: '500' }}>
                                                        {song.title}
                                                    </span>
                                                    <Link to={`/artist/${encodeURIComponent(song.artist)}`} className="text-link-hover" onClick={e => e.stopPropagation()}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{song.artist}</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Link to={`/album/${encodeURIComponent(song.album || song.title)}`} className="text-link-hover" onClick={e => e.stopPropagation()}>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{song.album || song.title}</span>
                                            </Link>
                                        </td>
                                        <td className="td-date">
                                            {song.dateAdded && !isNaN(new Date(song.dateAdded).getTime())
                                                ? new Date(song.dateAdded).toLocaleDateString()
                                                : song.dateAdded || '—'}
                                        </td>
                                        <td className="td-duration">{song.duration}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <style>{`
                /* Cover editable overlay */
                .plv-cover-wrap {
                    position: relative;
                    width: 232px; height: 232px;
                    flex-shrink: 0; border-radius: 4px; overflow: hidden;
                }
                .plv-cover-wrap.editable { cursor: pointer; }
                .plv-cover-overlay {
                    position: absolute; inset: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    gap: 8px; color: #fff; font-size: 13px; font-weight: 700;
                    opacity: 0; transition: opacity 0.2s;
                }
                .plv-cover-wrap.editable:hover .plv-cover-overlay { opacity: 1; }
                .plv-cover-empty {
                    width: 100%; height: 100%;
                    background: #282828;
                    display: flex; align-items: center; justify-content: center;
                }
                /* Editable title hover */
                .editable-title {
                    cursor: pointer; transition: text-decoration 0.15s;
                }
                .editable-title:hover { text-decoration: underline; }

                /* ── Empty state ── */
                .plv-empty {
                    padding: 24px 0;
                    border-top: 1px solid rgba(255,255,255,0.08);
                }
                .plv-empty-inner {
                    max-width: 360px;
                }
                .plv-empty-title {
                    font-size: 22px; font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 16px;
                }
                .plv-empty-search-wrap {
                    position: relative; display: flex; align-items: center;
                }
                .plv-empty-search-icon {
                    position: absolute; left: 12px;
                    color: var(--text-secondary); pointer-events: none;
                }
                .plv-empty-search {
                    width: 100%;
                    padding: 10px 12px 10px 36px;
                    background: #3e3e3e;
                    border: none; border-radius: 4px;
                    color: #fff; font-size: 14px; font-family: inherit;
                    outline: none; cursor: pointer;
                    transition: background 0.15s;
                }
                .plv-empty-search:hover { background: #4a4a4a; }
                .plv-empty-search::placeholder { color: #a7a7a7; }
            `}</style>
        </div>
    );
}
