import React, { useMemo, useState, useEffect } from 'react';
import { Play, Pause, Clock, Heart, Check } from 'phosphor-react';
import { useParams, Link } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { fetchArtistInfo } from '../services/lastfm';

export default function ArtistView() {
    const { artistName } = useParams();
    const decodedArtistName = decodeURIComponent(artistName);

    const {
        songs,
        currentSong,
        isPlaying,
        likedSongs,
        toggleLikedSong,
        setCurrentSong,
        togglePlay,
        setQueue,
        openContextMenu,
        followedArtists,
        toggleFollowArtist
    } = usePlayerStore();

    const [artistInfo, setArtistInfo] = useState(null);
    const [isBioExpanded, setIsBioExpanded] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setArtistInfo(null);
        setIsBioExpanded(false);
        fetchArtistInfo(decodedArtistName).then(info => {
            if (isMounted && info) {
                setArtistInfo(info);
            }
        });
        return () => { isMounted = false; };
    }, [decodedArtistName]);

    // Filter songs by this exact artist name
    const artistTracks = useMemo(() => {
        return songs.filter(song => song.artist === decodedArtistName);
    }, [songs, decodedArtistName]);

    const isThisArtistPlaying = currentSong && currentSong.artist === decodedArtistName;

    // Use the first track's cover as the artist's avatar simulation
    const coverUrl = artistTracks.length > 0 ? artistTracks[0].coverUrl : '';

    // Simulate monthly listeners deterministically based on the artist's name length or char code
    const followers = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < decodedArtistName.length; i++) {
            hash = decodedArtistName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash % 900) + 100;
    }, [decodedArtistName]);

    const { currentUser } = useAuthStore();
    const userId = currentUser?.id || null;

    const handlePlayArtist = () => {
        if (artistTracks.length === 0) return;
        if (isThisArtistPlaying) {
            togglePlay();
        } else {
            setCurrentSong(artistTracks[0], { id: `artist-${decodedArtistName}`, name: decodedArtistName });
            setQueue(artistTracks.slice(1));
        }
    };

    const handleSongClick = (song, index) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song, { id: `artist-${decodedArtistName}`, name: decodedArtistName });
            const newQueue = artistTracks.slice(index + 1);
            setQueue(newQueue);
        }
    };

    if (artistTracks.length === 0) {
        return (
            <div className="page-placeholder">
                <h2>Artist Not Found</h2>
                <p>We couldn't find any tracks belonging to this artist.</p>
            </div>
        );
    }

    return (
        <div className="artist-view">
            {/* Header with Circle Avatar */}
            <div className="playlist-header" style={{ alignItems: 'center' }}>
                <img
                    src={coverUrl}
                    alt={decodedArtistName}
                    style={{
                        width: '232px',
                        height: '232px',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.5)'
                    }}
                />

                <div className="playlist-info-header" style={{ marginLeft: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)' }}>
                        <span style={{
                            background: 'var(--accent-color)',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                        }}>✓</span>
                        <p className="playlist-type" style={{ color: 'var(--text-primary)', margin: 0 }}>Verified Artist</p>
                    </div>

                    <h1 className="playlist-name-large" style={{ fontSize: decodedArtistName.length > 20 ? '56px' : '84px', margin: '8px 0', letterSpacing: '-0.02em' }}>
                        {decodedArtistName}
                    </h1>

                    <p className="playlist-stats" style={{ color: 'var(--text-secondary)' }}>
                        {followers},000 monthly listeners
                    </p>
                </div>
            </div>

            <div className="playlist-content">
                {/* Actions */}
                <div className="playlist-actions-bar" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <button
                        className="main-play-btn"
                        onClick={handlePlayArtist}
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
                        {isThisArtistPlaying && isPlaying ? <Pause size={28} weight="fill" /> : <Play size={28} weight="fill" style={{ marginLeft: '4px' }} />}
                    </button>
                    <button
                        className="action-icon"
                        onClick={() => toggleFollowArtist(decodedArtistName, userId)}
                        style={{
                            padding: '8px 24px', width: 'auto', borderRadius: '24px',
                            border: followedArtists.includes(decodedArtistName)
                                ? '1px solid var(--accent-color)'
                                : '1px solid var(--text-secondary)',
                            background: 'transparent',
                            color: followedArtists.includes(decodedArtistName)
                                ? 'var(--accent-color)'
                                : 'var(--text-primary)',
                            fontWeight: 'bold', fontSize: '13px',
                            textTransform: 'uppercase', letterSpacing: '1px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {followedArtists.includes(decodedArtistName) && <Check size={14} weight="bold" />}
                        {followedArtists.includes(decodedArtistName) ? 'Following' : 'Follow'}
                    </button>
                </div>

                {/* Artist Bio */}
                {artistInfo && artistInfo.bio && (
                    <div style={{ marginTop: '32px', marginBottom: '32px', maxWidth: '800px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>About {decodedArtistName}</h2>
                        <div 
                            style={{ 
                                fontSize: '14px', 
                                color: 'var(--text-secondary)', 
                                lineHeight: '1.6',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: isBioExpanded ? 'unset' : '4',
                                WebkitBoxOrient: 'vertical'
                            }}
                            dangerouslySetInnerHTML={{ __html: artistInfo.bio.replace(/<a /g, '<a style="color:var(--accent-color)" target="_blank" ') }}
                        />
                        <button 
                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', padding: '8px 0', marginTop: '8px' }}
                        >
                            {isBioExpanded ? 'Show less' : 'Read more'}
                        </button>
                    </div>
                )}

                {/* Popular Tracks */}
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Popular Releases</h2>
                <table className="song-list-table">
                    <thead>
                        {/* Headers are often hidden in artist view for clean look, but we'll keep it minimal */}
                        <tr>
                            <th className="th-id">#</th>
                            <th>Title</th>
                            <th>Album</th>
                            <th className="th-duration"><Clock size={16} /></th>
                            <th style={{ width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {artistTracks.map((song, idx) => {
                            const isPlayingCurrent = currentSong?.id === song.id;
                            const isLiked = likedSongs.includes(song.id);

                            return (
                                <tr
                                    key={song.id}
                                    className={`song-row ${isPlayingCurrent ? 'active' : ''}`}
                                    onClick={() => handleSongClick(song, idx)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        openContextMenu(e.clientX, e.clientY, song, 'song', { source: 'artist' });
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
                                            <span style={{ color: isPlayingCurrent ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: '500' }}>
                                                {song.title}
                                            </span>
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
                                        >
                                            <Heart size={18} weight={isLiked ? "fill" : "regular"} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Similar Artists */}
                {artistInfo && artistInfo.similar && artistInfo.similar.length > 0 && (
                    <div style={{ marginTop: '48px', paddingBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Fans Also Like</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
                            {artistInfo.similar.slice(0, 6).map((similarArtist, i) => (
                                <Link to={`/artist/${encodeURIComponent(similarArtist.name)}`} key={i} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', transition: 'background 0.3s' }} className="hover-bg-elevated">
                                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', marginBottom: '16px', background: 'var(--bg-elevated)' }}>
                                            {similarArtist.image ? (
                                                <img src={similarArtist.image} alt={similarArtist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '40px', color: 'rgba(255,255,255,0.1)' }}>?</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                            {similarArtist.name}
                                        </h3>
                                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Artist</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
