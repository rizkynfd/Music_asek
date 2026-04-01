import React, { useMemo } from 'react';
import { Play, Pause, Clock, Heart } from 'phosphor-react';
import { useParams, Link } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { albums } from '../data/mockData';

export default function AlbumView() {
    const { albumName } = useParams();
    const decodedAlbumName = decodeURIComponent(albumName);

    const {
        songs,
        currentSong,
        isPlaying,
        likedSongs,
        toggleLikedSong,
        setCurrentSong,
        togglePlay,
        setQueue,
        openContextMenu
    } = usePlayerStore();
    const { currentUser } = useAuthStore();
    const userId = currentUser?.id || null;

    // Filter songs by this exact album name (or use title as fallback if album missing)
    const albumTracks = useMemo(() => {
        return songs.filter(song => (song.album || song.title) === decodedAlbumName);
    }, [songs, decodedAlbumName]);

    // Calculate total duration roughly for display
    const totalDurationRaw = albumTracks.reduce((acc, song) => {
        const [mins, secs] = song.duration.split(':').map(Number);
        return acc + (mins * 60) + secs;
    }, 0);
    const totalMins = Math.floor(totalDurationRaw / 60);

    const isThisAlbumPlaying = currentSong && (currentSong.album || currentSong.title) === decodedAlbumName;

    // Use the first track's cover and artist as the album's primary info
    const coverUrl = albumTracks.length > 0 ? albumTracks[0].coverUrl : '';
    const artistName = albumTracks.length > 0 ? albumTracks[0].artist : 'Unknown Artist';

    // For a real app, album year would be in database. Load from albums data.
    const albumMeta = albums.find(a => a.name === decodedAlbumName);
    const releaseYear = albumMeta?.year || 2024;

    // Check if all album tracks are liked (for the header heart button)
    const allLiked = albumTracks.length > 0 && albumTracks.every(s => likedSongs.includes(s.id));
    const handleToggleAllLiked = () => {
        albumTracks.forEach(s => {
            const isLiked = likedSongs.includes(s.id);
            if (!allLiked && !isLiked) toggleLikedSong(s.id, userId);
            if (allLiked && isLiked) toggleLikedSong(s.id, userId);
        });
    };

    const handlePlayAlbum = () => {
        if (albumTracks.length === 0) return;
        if (isThisAlbumPlaying) {
            togglePlay();
        } else {
            setCurrentSong(albumTracks[0], { id: `album-${decodedAlbumName}`, name: decodedAlbumName });
            setQueue(albumTracks.slice(1));
        }
    };

    const handleSongClick = (song, index) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song, { id: `album-${decodedAlbumName}`, name: decodedAlbumName });
            const newQueue = albumTracks.slice(index + 1);
            setQueue(newQueue);
        }
    };

    if (albumTracks.length === 0) {
        return (
            <div className="page-placeholder">
                <h2>Album Not Found</h2>
                <p>We couldn't find any tracks belonging to this album.</p>
            </div>
        );
    }

    return (
        <div className="playlist-view">
            {/* Header */}
            <div className="playlist-header">
                <img src={coverUrl} alt={decodedAlbumName} className="playlist-cover-large" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />

                <div className="playlist-info-header">
                    <p className="playlist-type">Album</p>
                    <h1 className="playlist-name-large" style={{ wordBreak: 'break-word', fontSize: decodedAlbumName.length > 20 ? '48px' : '72px' }}>
                        {decodedAlbumName}
                    </h1>

                    <div className="playlist-stats" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        {/* Tiny artist avatar simulation */}
                        <Link to={`/artist/${encodeURIComponent(artistName)}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }} className="text-link-hover">
                            <img src={coverUrl} alt={artistName} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                            <span style={{ fontWeight: 'bold' }}>{artistName}</span>
                        </Link>
                        <span>•</span>
                        <span>{releaseYear}</span>
                        <span>•</span>
                        <span>{albumTracks.length} songs, {totalMins} min</span>
                    </div>
                </div>
            </div>

            <div className="playlist-content">
                {/* Actions */}
                <div className="playlist-actions-bar">
                    <button
                        className="main-play-btn"
                        onClick={handlePlayAlbum}
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
                            cursor: 'pointer'
                        }}
                    >
                        {isThisAlbumPlaying && isPlaying ? <Pause size={28} weight="fill" /> : <Play size={28} weight="fill" style={{ marginLeft: '4px' }} />}
                    </button>
                    <button
                        className="action-icon"
                        style={{ marginLeft: '24px', width: '40px', height: '40px', border: '1px solid var(--text-secondary)', background: 'transparent', color: allLiked ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                        title={allLiked ? 'Remove from Library' : 'Save to Your Library'}
                        onClick={handleToggleAllLiked}
                    >
                        <Heart size={24} weight={allLiked ? 'fill' : 'regular'} />
                    </button>
                </div>

                {/* List */}
                <table className="song-list-table">
                    <thead>
                        <tr>
                            <th className="th-id">#</th>
                            <th>Title</th>
                            <th className="th-duration"><Clock size={16} /></th>
                            <th style={{ width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {albumTracks.map((song, idx) => {
                            const isPlayingCurrent = currentSong?.id === song.id;
                            const isLiked = likedSongs.includes(song.id);

                            return (
                                <tr
                                    key={song.id}
                                    className={`song-row ${isPlayingCurrent ? 'active' : ''}`}
                                    onClick={() => handleSongClick(song, idx)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        openContextMenu(e.clientX, e.clientY, song, 'song', { source: 'album' });
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ color: isPlayingCurrent ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: '500' }}>
                                                {song.title}
                                            </span>
                                            <Link to={`/artist/${encodeURIComponent(song.artist)}`} className="text-link-hover" onClick={(e) => e.stopPropagation()}>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {song.artist}
                                                </span>
                                            </Link>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {song.duration}
                                    </td>
                                    <td>
                                        <button
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: isLiked ? 'var(--accent-color)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                opacity: isLiked ? 1 : 0.6
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleLikedSong(song.id, userId);
                                            }}
                                            className="like-btn-hover"
                                        >
                                            <Heart size={18} weight={isLiked ? "fill" : "regular"} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Copyright info */}
                <div style={{ marginTop: '32px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <p>© {releaseYear} SpotiClone Records</p>
                    <p>℗ {releaseYear} SpotiClone Records</p>
                </div>
            </div>
        </div>
    );
}
