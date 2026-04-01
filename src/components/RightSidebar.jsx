import React, { useEffect, useState, useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { CheckCircle, XCircle } from 'phosphor-react';
import { fetchSyncedLyrics } from '../services/lrclib';
import { useNavigate } from 'react-router-dom';
import BackgroundVideo from './BackgroundVideo';

export default function RightSidebar() {
    const { currentSong, isRightSidebarOpen, isPlaying, currentTime } = usePlayerStore();
    const navigate = useNavigate();

    const [lyrics, setLyrics] = useState([]);

    const fetchLyrics = useCallback(async (song) => {
        if (!song) { setLyrics([]); return; }
        if (song.lyrics?.length > 0) { setLyrics(song.lyrics); return; }
        const result = await fetchSyncedLyrics({ title: song.title, artist: song.artist, album: song.album, duration: song.duration });
        setLyrics(result?.lines || []);
    }, []);

    useEffect(() => {
        fetchLyrics(currentSong);
    }, [currentSong?.id, fetchLyrics]);

    // Find active lyric line
    const activeIndex = lyrics.reduce((acc, lyric, index) => {
        if (currentTime >= lyric.time) return index;
        return acc;
    }, -1);

    const activeLine   = lyrics[activeIndex]?.text || '';
    const nextLine     = lyrics[activeIndex + 1]?.text || '';
    const hasLyrics    = lyrics.length > 0;

    if (!isRightSidebarOpen) return null;

    if (!currentSong) {
        return (
            <aside className="right-sidebar glass-panel" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Play a song to see details here</p>
            </aside>
        );
    }

    return (
        <aside className="right-sidebar glass-panel" style={{ width: 'var(--right-sidebar-width)', minWidth: 'var(--right-sidebar-width)' }}>
            <div className="now-playing-header">
                <h4>Now Playing</h4>
                <button className="close-btn" onClick={() => usePlayerStore.getState().toggleRightSidebar()}>
                    <XCircle size={24} />
                </button>
            </div>

            <div className="now-playing-art">
                <div className={`vinyl-wrapper ${isPlaying ? 'spinning' : ''}`}>
                    <img src={currentSong.coverUrl} alt="Cover" />
                </div>
            </div>

            <div className="now-playing-info" style={{ marginBottom: '20px' }}>
                <div className="title-row">
                    <div style={{ maxWidth: '85%' }}>
                        <h2 className="song-title text-ellipsis" style={{ fontSize: '24px', fontWeight: '800' }}>{currentSong.title}</h2>
                        <p className="artist-name text-ellipsis" style={{ fontSize: '16px', opacity: 0.7 }}>{currentSong.artist}</p>
                    </div>
                    <CheckCircle size={24} color="var(--accent-color)" weight="fill" />
                </div>
            </div>

            {/* Video Clip Section */}
            <div className="rs-video-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p className="rs-lyrics-label" style={{ margin: 0 }}>Official Video</p>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>PREVIEW</span>
                </div>
                <div className="rs-video-container">
                    <BackgroundVideo isSharp={true} />
                </div>
            </div>

            {/* Lyrics Preview */}
            {hasLyrics && (
                <div
                    className="rs-lyrics-preview"
                    onClick={() => navigate('/lyrics')}
                    title="View full lyrics"
                >
                    <p className="rs-lyrics-label">Lyrics</p>
                    <p className="rs-lyrics-active">{activeLine || '♪'}</p>
                    {nextLine && <p className="rs-lyrics-next">{nextLine}</p>}
                </div>
            )}

            <div className="about-artist glass-panel">
                <h4>About the Artist</h4>
                <p style={{ marginTop: '8px' }}>{currentSong.desc || `Discover more about ${currentSong.artist}.`}</p>
            </div>

            <style>{`
                .right-sidebar {
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    overflow-y: auto;
                    height: 100%;
                }
                .now-playing-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .now-playing-art {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 24px;
                }
                .vinyl-wrapper {
                    width: 100%;
                    max-width: 240px; /* Cap size on large sidebars */
                    aspect-ratio: 1/1;
                    border-radius: 50%;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    border: 4px solid rgba(255,255,255,0.05);
                }
                .vinyl-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .spinning {
                    animation: spin 20s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .rs-lyrics-preview {
                    margin: 0 0 16px;
                    padding: 14px 16px;
                    border-radius: var(--border-radius-md);
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--bg-glass-border);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .rs-lyrics-preview:hover {
                    background: rgba(255,255,255,0.1);
                }
                .rs-lyrics-label {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-tertiary);
                    margin-bottom: 8px;
                }
                .rs-lyrics-active {
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.5;
                    margin-bottom: 4px;
                }
                .rs-lyrics-next {
                    font-size: 13px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }
                .rs-video-section {
                    margin-bottom: 24px;
                    flex-shrink: 0;
                }
                .rs-video-container {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    background: rgba(0,0,0,0.2);
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.05);
                    position: relative;
                    box-shadow: inset 0 4px 12px rgba(0,0,0,0.2);
                }
                .about-artist {
                    padding: 16px;
                    margin-bottom: 20px;
                }
            `}</style>
        </aside>
    );
}
