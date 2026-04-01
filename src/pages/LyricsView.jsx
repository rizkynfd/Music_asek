import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { fetchSyncedLyrics } from '../services/lrclib';
import { MusicNote, MonitorPlay, TextT } from 'phosphor-react';
import BackgroundVideo from '../components/BackgroundVideo';

export default function LyricsView() {
    const { currentSong, currentTime } = usePlayerStore();
    const [isVideoMode, setIsVideoMode] = useState(false);
    const lyricsContainerRef = useRef(null);
    const lyricsRefs = useRef([]);

    const [lyrics, setLyrics]       = useState([]);
    const [status, setStatus]       = useState('idle'); // idle | loading | found | not-found
    const [source, setSource]       = useState('');     // 'lrclib' | 'local' | 'plain'

    // Fetch lyrics whenever song changes
    const fetchLyrics = useCallback(async (song) => {
        if (!song) { setLyrics([]); setStatus('idle'); return; }

        // 1. Use locally stored synced lyrics first (mockData)
        if (song.lyrics && song.lyrics.length > 0) {
            setLyrics(song.lyrics);
            setStatus('found');
            setSource('local');
            return;
        }

        // 2. Try LRCLIB (3-step strategy: get with duration → get without → search)
        setStatus('loading');
        const result = await fetchSyncedLyrics({
            title:    song.title,
            artist:   song.artist,
            album:    song.album,
            duration: song.duration,
        });

        if (result && result.lines && result.lines.length > 0) {
            setLyrics(result.lines);
            setStatus('found');
            setSource(result.type === 'synced' ? 'lrclib' : 'plain');
        } else {
            setLyrics([]);
            setStatus('not-found');
            setSource('');
        }
    }, []);

    useEffect(() => {
        lyricsRefs.current = [];
        fetchLyrics(currentSong);
    }, [currentSong?.id, fetchLyrics]);

    // Find currently active lyric line
    const activeIndex = lyrics.reduce((acc, lyric, index) => {
        if (currentTime >= lyric.time) return index;
        return acc;
    }, -1);

    // Auto-scroll to active line
    useEffect(() => {
        if (activeIndex !== -1 && lyricsRefs.current[activeIndex]) {
            lyricsRefs.current[activeIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeIndex]);

    /* ── Loading State ── */
    if (status === 'loading') {
        return (
            <div className="lv-center">
                <div className="lv-spinner" />
                <p className="lv-hint">Looking for lyrics…</p>
            </div>
        );
    }

    /* ── No Song ── */
    if (!currentSong) {
        return (
            <div className="lv-center">
                <MusicNote size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p className="lv-hint">Play a song to see lyrics</p>
            </div>
        );
    }

    /* ── Not Found ── */
    if (status === 'not-found' || lyrics.length === 0) {
        return (
            <div className="lv-center">
                <MusicNote size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontWeight: 700, marginBottom: 6 }}>{currentSong.title}</p>
                <p className="lv-hint">No lyrics available for this song</p>
            </div>
        );
    }

    /* ── Lyrics View ── */
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            <BackgroundVideo opacity={isVideoMode ? 1 : 0.25} blur={isVideoMode ? '0px' : '40px'} isSharp={isVideoMode} />
            
            <div className={`lyrics-view ${isVideoMode ? 'mode-video' : ''}`} ref={lyricsContainerRef}>
                {/* Mode Toggle */}
                <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 10, display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setIsVideoMode(false)}
                        style={{ padding: '8px', borderRadius: '50%', border: 'none', background: !isVideoMode ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: !isVideoMode ? '#000' : '#fff', cursor: 'pointer' }}
                        title="Lyrics Focus"
                    >
                        <TextT size={20} weight="bold" />
                    </button>
                    <button 
                        onClick={() => setIsVideoMode(true)}
                        style={{ padding: '8px', borderRadius: '50%', border: 'none', background: isVideoMode ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: isVideoMode ? '#000' : '#fff', cursor: 'pointer' }}
                        title="Video Focus"
                    >
                        <MonitorPlay size={20} weight="bold" />
                    </button>
                </div>

                {/* Source badge */}
            <div className="lv-badge">
                {source === 'lrclib' && '🎵 Synced via LRCLIB'}
                {source === 'plain'  && '📄 Plain lyrics via LRCLIB'}
                {source === 'local'  && '📝 From library'}
            </div>

            <div className="lyrics-content">
                {lyrics.map((line, index) => (
                    <div
                        key={index}
                        ref={el => lyricsRefs.current[index] = el}
                        className={`lyric-line ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'past' : ''}`}
                    >
                        {line.text}
                    </div>
                ))}
            </div>

            <style>{`
                .lyrics-view {
                    height: 100%;
                    overflow-y: auto;
                    padding: 40px 24px 80px;
                    scroll-behavior: smooth;
                    mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
                }
                .lyrics-view::-webkit-scrollbar { display: none; }

                .lv-center {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    text-align: center;
                    padding: 24px;
                    gap: 4px;
                }
                .lv-hint {
                    font-size: 14px;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }

                /* Spinner */
                .lv-spinner {
                    width: 32px; height: 32px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top-color: var(--accent-color);
                    border-radius: 50%;
                    animation: lv-spin 0.8s linear infinite;
                    margin-bottom: 12px;
                }
                @keyframes lv-spin { to { transform: rotate(360deg); } }

                /* Badge */
                .lv-badge {
                    text-align: center;
                    font-size: 11px;
                    color: var(--text-tertiary);
                    margin-bottom: 32px;
                    letter-spacing: 0.5px;
                    opacity: 0.7;
                }

                .lyrics-content {
                    max-width: 780px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .lyric-line {
                    font-size: 28px;
                    font-weight: 800;
                    color: rgba(255,255,255,0.18);
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    line-height: 1.4;
                    filter: blur(1.5px);
                    cursor: default;
                    user-select: none;
                }
                .lyric-line.past {
                    color: rgba(255,255,255,0.38);
                    filter: blur(0.5px);
                }
                .lyric-line.active {
                    color: #fff;
                    transform: scale(1.04);
                    filter: blur(0);
                    text-shadow: 0 0 24px rgba(255,255,255,0.25);
                }

                @media (max-width: 768px) {
                    .lyric-line { font-size: 20px; }
                }

                /* Video Mode Overrides */
                .mode-video {
                    mask-image: none !important;
                    -webkit-mask-image: none !important;
                    background: rgba(0,0,0,0.4);
                }
                .mode-video .lyrics-content {
                    max-width: 100%;
                    padding-bottom: 20vh;
                    justify-content: flex-end;
                    height: 100%;
                }
                .mode-video .lyric-line {
                    font-size: 22px;
                    text-align: center;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
                }
                .mode-video .lyric-line.active {
                    transform: scale(1.1);
                    color: var(--accent-color);
                }
            `}</style>
            </div>
        </div>
    );
}
