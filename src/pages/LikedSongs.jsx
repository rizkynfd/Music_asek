import React from 'react';
import { Play, Pause, Heart, Clock, HeartBreak } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

export default function LikedSongs() {
    const {
        songs,
        likedSongs,
        currentSong,
        isPlaying,
        toggleLikedSong,
        setCurrentSong,
        togglePlay,
        setQueue,
        openContextMenu
    } = usePlayerStore();
    const { currentUser } = useAuthStore();
    const userId = currentUser?.id || null;

    // Map the liked ID array to the actual song objects
    const likedTracks = songs.filter(song => likedSongs.includes(song.id));

    // Calculate total duration roughly for display
    const totalDurationRaw = likedTracks.reduce((acc, song) => {
        const [mins, secs] = song.duration.split(':').map(Number);
        return acc + (mins * 60) + secs;
    }, 0);
    const totalMins = Math.floor(totalDurationRaw / 60);

    const isThisPlaylistPlaying = currentSong && likedSongs.includes(currentSong.id);

    const handlePlayPlaylist = () => {
        if (likedTracks.length === 0) return;
        if (isThisPlaylistPlaying) {
            togglePlay();
        } else {
            setCurrentSong(likedTracks[0], { id: 'liked-songs', name: 'Liked Songs' });
            setQueue(likedTracks.slice(1));
        }
    };

    const handleSongClick = (song, index) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song, { id: 'liked-songs', name: 'Liked Songs' });
            const newQueue = likedTracks.slice(index + 1);
            setQueue(newQueue);
        }
    };

    return (
        <div className="playlist-view">
            {/* Header with Purple/Blue Gradient */}
            <div className="playlist-header" style={{
                background: 'linear-gradient(transparent 0, rgba(0,0,0,0.8) 100%), linear-gradient(135deg, #450af5, #c4efd9)',
                padding: '40px 24px 24px 24px',
                borderRadius: '16px 16px 0 0',
                outline: '1px solid var(--bg-glass-border)'
            }}>
                <div style={{
                    width: '232px',
                    height: '232px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #450af5, #c4efd9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)'
                }}>
                    <Heart size={80} weight="fill" color="white" />
                </div>

                <div className="playlist-info-header">
                    <p className="playlist-type">Playlist</p>
                    <h1 className="playlist-name-large">Liked Songs</h1>
                    <p className="playlist-stats" style={{ marginTop: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>You</span> • {likedTracks.length} songs, {totalMins} min
                    </p>
                </div>
            </div>

            <div className="playlist-content" style={{ marginTop: 0, borderRadius: '0 0 16px 16px', borderTop: 'none' }}>
                {/* Actions */}
                <div className="playlist-actions-bar">
                    <button
                        className="main-play-btn"
                        onClick={handlePlayPlaylist}
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'var(--accent-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            border: 'none',
                            cursor: likedTracks.length > 0 ? 'pointer' : 'not-allowed',
                            opacity: likedTracks.length > 0 ? 1 : 0.5
                        }}
                        disabled={likedTracks.length === 0}
                    >
                        {isThisPlaylistPlaying && isPlaying ? <Pause size={28} weight="fill" /> : <Play size={28} weight="fill" style={{ marginLeft: '4px' }} />}
                    </button>
                </div>

                {/* List */}
                {likedTracks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
                        <HeartBreak size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h2>Songs you like will appear here</h2>
                        <p style={{ marginTop: '8px' }}>Save songs by tapping the heart icon.</p>
                    </div>
                ) : (
                    <table className="song-list-table">
                        <thead>
                            <tr>
                                <th className="th-id">#</th>
                                <th>Title</th>
                                <th>Album</th>
                                <th className="th-duration"><Clock size={16} /></th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {likedTracks.map((song, idx) => {
                                const isPlayingCurrent = currentSong?.id === song.id;
                                return (
                                    <tr
                                        key={song.id}
                                        className={`song-row ${isPlayingCurrent ? 'active' : ''}`}
                                        onClick={() => handleSongClick(song, idx)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            openContextMenu(e.clientX, e.clientY, song, 'song', { source: 'liked-songs' });
                                        }}
                                    >
                                        <td>
                                            <div className="id-container">
                                                {isPlayingCurrent && isPlaying ? (
                                                    <div className="playing-eq">
                                                        <div className="eq-bar eq-1"></div>
                                                        <div className="eq-bar eq-2"></div>
                                                        <div className="eq-bar eq-3"></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="song-index" style={{ color: isPlayingCurrent ? 'var(--accent-color)' : 'inherit' }}>{idx + 1}</span>
                                                        <Play size={16} weight="fill" className="play-icon" />
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <img src={song.coverUrl} alt={song.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: isPlayingCurrent ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: '500' }}>
                                                        {song.title}
                                                    </span>
                                                    <Link to={`/artist/${encodeURIComponent(song.artist)}`} className="text-link-hover" onClick={(e) => e.stopPropagation()}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                            {song.artist}
                                                        </span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Link to={`/album/${encodeURIComponent(song.album || song.title)}`} className="text-link-hover" onClick={(e) => e.stopPropagation()}>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{song.album || song.title}</span>
                                            </Link>
                                        </td>
                                        <td style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {song.duration}
                                        </td>
                                        <td>
                                            <button
                                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '8px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleLikedSong(song.id, userId);
                                                }}
                                            >
                                                <Heart size={18} weight="fill" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
