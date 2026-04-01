import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, Trash, MusicNote } from 'phosphor-react';
import { usePlayerStore } from '../store/usePlayerStore';

export default function RecentlyPlayed() {
    const navigate = useNavigate();
    const { playbackHistory, setCurrentSong, currentSong, isPlaying, togglePlay, clearHistory, openContextMenu } = usePlayerStore();

    // Deduplicate by id, keep most recent occurrence
    const seen = new Set();
    const recentSongs = playbackHistory.filter(song => {
        if (seen.has(song.id)) return false;
        seen.add(song.id);
        return true;
    });

    const handlePlaySong = (song) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song);
        }
    };

    if (recentSongs.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', color: 'var(--text-secondary)' }}>
                <Clock size={72} weight="thin" />
                <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>No listening history yet</h2>
                <p>Start playing songs to see them here.</p>
                <button
                    className="auth-btn-primary"
                    style={{ width: 'auto', padding: '12px 32px', marginTop: '8px' }}
                    onClick={() => navigate('/')}
                >
                    Discover Music
                </button>
            </div>
        );
    }

    return (
        <div className="recently-played-view">
            {/* Header */}
            <div className="rp-header">
                <div className="rp-header-icon">
                    <Clock size={40} weight="fill" />
                </div>
                <div>
                    <p className="playlist-type">History</p>
                    <h1 style={{ fontSize: '48px', fontWeight: 800, margin: '4px 0' }}>Recently Played</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{recentSongs.length} songs</p>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '0 24px' }}>
                {recentSongs.length > 0 && (
                    <button
                        onClick={() => setCurrentSong(recentSongs[0])}
                        style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'var(--accent-color)', color: '#000',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: 'none', cursor: 'pointer', fontSize: '24px'
                        }}
                    >
                        <Play size={28} weight="fill" style={{ marginLeft: '3px' }} />
                    </button>
                )}
                <button
                    onClick={clearHistory}
                    className="action-icon"
                    title="Clear History"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}
                >
                    <Trash size={16} />
                    Clear History
                </button>
            </div>

            {/* Song Table */}
            <table className="song-list-table" style={{ padding: '0 24px' }}>
                <thead>
                    <tr>
                        <th className="th-id">#</th>
                        <th>Title</th>
                        <th>Album</th>
                        <th className="th-duration"><Clock size={16} /></th>
                    </tr>
                </thead>
                <tbody>
                    {recentSongs.map((song, idx) => {
                        const isPlayingCurrent = currentSong?.id === song.id;
                        return (
                            <tr
                                key={`${song.id}-${idx}`}
                                className={`song-row ${isPlayingCurrent ? 'active' : ''}`}
                                onClick={() => handlePlaySong(song)}
                                onContextMenu={(e) => { e.preventDefault(); openContextMenu(e.clientX, e.clientY, song); }}
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
                                        <div>
                                            <p style={{ color: isPlayingCurrent ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{song.title}</p>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>{song.artist}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{song.album || '—'}</td>
                                <td style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>{song.duration}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Styles */}
            <style>{`
                .recently-played-view { padding-bottom: 48px; }
                .rp-header {
                    display: flex;
                    align-items: flex-end;
                    gap: 24px;
                    padding: 32px 24px 24px;
                    background: linear-gradient(to bottom, rgba(0,240,255,0.15), transparent);
                }
                .rp-header-icon {
                    width: 160px; height: 160px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, var(--accent-color), var(--accent-purple));
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    color: #000;
                    box-shadow: 0 8px 32px rgba(0,240,255,0.3);
                }
            `}</style>
        </div>
    );
}
