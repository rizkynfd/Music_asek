import React, { useRef, useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import {
    PlayCircle, PauseCircle, SkipBack, SkipForward,
    Shuffle, Repeat, RepeatOnce, Queue, Desktop, SpeakerHigh,
    ArrowsOutSimple, MicrophoneStage, Heart, CaretDown
} from 'phosphor-react';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { sendNowPlaying, scrobbleTrack } from '../services/lastfmScrobble';
import { fetchSyncedLyrics } from '../services/lrclib';
import { fetchMusicVideoId } from '../services/youtube';

export default function BottomPlayer() {
    const {
        currentSong, isPlaying, setIsPlaying, setCurrentSong,
        volume, setVolume, queue, removeFromQueue, songs,
        addToHistory, currentTime, duration, setPlaybackProgress,
        isShuffle,
        repeatMode,
        toggleShuffle,
        toggleRepeat,
        likedSongs,
        toggleLikedSong,
        isVideoAudioMode, setIsVideoAudioMode,
        lastfmSessionKey,
    } = usePlayerStore();

    const audioRef = useRef(null);
    const nextAudioRef = useRef(null); // For gapless preloading & crossfade
    const [nextSong, setNextSong] = useState(null);
    const [isCrossfading, setIsCrossfading] = useState(false);
    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const [mobileLyrics, setMobileLyrics] = useState([]);
    // Mobile Cinema Modal — must be before any early returns (Rules of Hooks)
    const [mobileCinemaOpen, setMobileCinemaOpen] = useState(false);
    const [mobileVideoId, setMobileVideoId] = useState(null);
    const [mobileVideoLoading, setMobileVideoLoading] = useState(false);
    const crossfadeTime = 5;

    // Mute the main audio when video audio mode is active
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.muted = isVideoAudioMode;
    }, [isVideoAudioMode]);

    const navigate = useNavigate();
    const location = useLocation();
    const progressBarRef = useRef(null);
    const volumeBarRef = useRef(null);

    // --- Audio Normalizer Refs ---
    const audioCtxRef = useRef(null);
    const primarySourceRef = useRef(null);
    const compressorRef = useRef(null);
    const gainNodeRef = useRef(null);

    useEffect(() => {
        if (!audioRef.current) return;
        
        const initAudio = () => {
            if (audioCtxRef.current) {
                if (audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
                return;
            }
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new AudioCtx();
                
                compressorRef.current = audioCtxRef.current.createDynamicsCompressor();
                compressorRef.current.threshold.value = -24;
                compressorRef.current.knee.value = 30;
                compressorRef.current.ratio.value = 12;
                compressorRef.current.attack.value = 0.003;
                compressorRef.current.release.value = 0.25;

                gainNodeRef.current = audioCtxRef.current.createGain();
                gainNodeRef.current.gain.value = audioRef.current.volume || 1;
                
                primarySourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
                primarySourceRef.current.connect(compressorRef.current);
                compressorRef.current.connect(gainNodeRef.current);
                gainNodeRef.current.connect(audioCtxRef.current.destination);
            } catch (err) {
                console.error('Audio normalizer initialization failed:', err);
            }
        };

        const audioEl = audioRef.current;
        audioEl.addEventListener('play', initAudio);
        return () => {
            audioEl.removeEventListener('play', initAudio);
        };
    }, []);

    // Sync play/pause with Zustand state
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(err => console.error("Playback prevented:", err));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSong]);

    // Listen for keyboard shortcut custom events from useKeyboardShortcuts
    useEffect(() => {
        const onSkipForward = () => handleSkipForward();
        const onSkipBack = () => handleSkipBack();
        window.addEventListener('kb-skip-forward', onSkipForward);
        window.addEventListener('kb-skip-back', onSkipBack);
        return () => {
            window.removeEventListener('kb-skip-forward', onSkipForward);
            window.removeEventListener('kb-skip-back', onSkipBack);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSong, queue, isShuffle, repeatMode, songs, currentTime, duration]);

    // Sync volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = volume;
        }
    }, [volume, currentSong?.id]);

    // ── Last.fm: Now Playing + Scrobble ──
    const scrobbledRef = React.useRef(false);
    const songStartTimeRef = React.useRef(null);

    // ── Mobile Lyrics Fetch ──
    useEffect(() => {
        if (!currentSong) return;
        fetchSyncedLyrics({ title: currentSong.title, artist: currentSong.artist, album: currentSong.album, duration: currentSong.duration })
            .then(r => setMobileLyrics(r?.lines || []));
    }, [currentSong?.id]);

    useEffect(() => {
        scrobbledRef.current = false;
        songStartTimeRef.current = Math.floor(Date.now() / 1000);
        if (!lastfmSessionKey || !currentSong) return;
        sendNowPlaying(lastfmSessionKey, currentSong);
    }, [currentSong?.id, lastfmSessionKey]);

    useEffect(() => {
        if (!lastfmSessionKey || !currentSong || scrobbledRef.current) return;
        const threshold = Math.min(30, duration * 0.5);
        if (currentTime >= threshold && threshold > 0) {
            scrobbledRef.current = true;
            scrobbleTrack(lastfmSessionKey, currentSong, songStartTimeRef.current);
        }
    }, [currentTime, duration, currentSong, lastfmSessionKey]);

    // Global drag listeners
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingProgress && progressBarRef.current) {
                const rect = progressBarRef.current.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const seekTime = percent * duration;
                if (audioRef.current) {
                    audioRef.current.currentTime = seekTime;
                    setPlaybackProgress(seekTime, duration);
                }
            } else if (isDraggingVolume && volumeBarRef.current) {
                const rect = volumeBarRef.current.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setVolume(percent);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingProgress(false);
            setIsDraggingVolume(false);
        };

        if (isDraggingProgress || isDraggingVolume) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.classList.add('dragging-active');
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('dragging-active');
        };
    }, [isDraggingProgress, isDraggingVolume, duration, setPlaybackProgress, setVolume]);

    // Audio Event Handlers
    const handleTimeUpdate = () => {
        const time = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        setPlaybackProgress(time, dur);

        // Gapless Preloading: If less than 20s remaining, prepare next
        if (dur > 0 && dur - time < 20 && !nextSong) {
            prepareNextSong();
        }

        // Crossfade Trigger: If less than crossfadeTime remaining
        if (dur > 0 && dur - time < crossfadeTime && !isCrossfading && nextSong) {
            startCrossfade();
        }
    };

    const prepareNextSong = () => {
        // 1. Check Queue
        if (queue.length > 0) {
            setNextSong(queue[0]);
            return;
        }
        // 2. Playlist/Catalog sequence
        const currentIndex = songs.findIndex(s => s.id === currentSong.id);
        const next = songs[currentIndex + 1] || songs[0];
        setNextSong(next);
    };

    const startCrossfade = () => {
        setIsCrossfading(true);
        if (nextAudioRef.current) {
            nextAudioRef.current.volume = 0;
            nextAudioRef.current.muted = false;
            nextAudioRef.current.play();

            // Volume Ramp
            const interval = 100; //ms
            const steps = (crossfadeTime * 1000) / interval;
            const volumeStep = volume / steps;

            const fadeInterval = setInterval(() => {
                if (audioRef.current && nextAudioRef.current) {
                    const newPrimaryVol = Math.max(0, audioRef.current.volume - volumeStep);
                    audioRef.current.volume = newPrimaryVol;
                    if (gainNodeRef.current) {
                        gainNodeRef.current.gain.value = newPrimaryVol;
                    }
                    nextAudioRef.current.volume = Math.min(volume, nextAudioRef.current.volume + volumeStep);
                }
            }, interval);

            setTimeout(() => {
                clearInterval(fadeInterval);
                setIsCrossfading(false);
                // The actual handleEnded will trigger the store update
            }, crossfadeTime * 1000);
        }
    };

    const handleLoadedMetadata = () => {
        setPlaybackProgress(audioRef.current.currentTime, audioRef.current.duration);
    };

    const handleEnded = () => {
        if (repeatMode === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            return;
        }
        handleSkipForward();
        setNextSong(null); // Reset for next cycle
    };

    // UI Handlers
    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const seekTime = percent * duration;
        if (audioRef.current) {
            audioRef.current.currentTime = seekTime;
            setPlaybackProgress(seekTime, duration);
        }
    };

    const handleProgressMouseDown = (e) => {
        setIsDraggingProgress(true);
        handleSeek(e);
    };

    const handleSkipForward = () => {
        if (!currentSong) return;

        // 1. Check User Queue first
        if (queue.length > 0) {
            const nextFromQueue = queue[0];
            removeFromQueue(0);
            setCurrentSong(nextFromQueue);
            return;
        }

        // 2. Handle Shuffle
        if (isShuffle && songs.length > 1) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
            } while (songs[randomIndex].id === currentSong.id);
            setCurrentSong(songs[randomIndex]);
            return;
        }

        // 3. Default Playlist/Catalog sequence
        const currentIndex = songs.findIndex(s => s.id === currentSong.id);
        if (currentIndex < songs.length - 1) {
            setCurrentSong(songs[currentIndex + 1]);
        } else {
            // End of list, check repeat 'all'
            if (repeatMode === 'all' || repeatMode === 'one') {
                setCurrentSong(songs[0]);
            } else {
                setIsPlaying(false);
            }
        }
    };

    const handleSkipBack = () => {
        if (!currentSong) return;
        if (currentTime > 3) {
            audioRef.current.currentTime = 0;
            setPlaybackProgress(0, duration);
            return;
        }

        const currentIndex = songs.findIndex(s => s.id === currentSong.id);
        if (currentIndex > 0) {
            setCurrentSong(songs[currentIndex - 1]);
        } else {
            setCurrentSong(songs[songs.length - 1]);
        }
    };

    const handleVolumeChange = (e) => {
        const rect = volumeBarRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(percent);
    };

    const handleVolumeMouseDown = (e) => {
        setIsDraggingVolume(true);
        handleVolumeChange(e);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // ── Mobile Lyrics Fetch (before early return — Rules of Hooks) ──
    useEffect(() => {
        if (!currentSong) return;
        fetchSyncedLyrics({ title: currentSong.title, artist: currentSong.artist, album: currentSong.album })
            .then(r => setMobileLyrics(r?.lines || []))
            .catch(() => setMobileLyrics([]));
    }, [currentSong?.id]);

    // ── Cinema Video ID Fetch (before early return — Rules of Hooks) ──
    useEffect(() => {
        if (!mobileCinemaOpen || !currentSong) return;
        setMobileVideoId(null);
        setMobileVideoLoading(true);
        fetchMusicVideoId(currentSong.artist, currentSong.title)
            .then(id => { setMobileVideoId(id); setMobileVideoLoading(false); })
            .catch(() => setMobileVideoLoading(false));
    }, [mobileCinemaOpen, currentSong?.id]);

    // If no song is selected, show a dummy placeholder
    if (!currentSong) {
        return (
            <div className="bottom-player glass-panel" style={{ justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Select a song to start playing</p>
            </div>
        );
    }

    const currentPercent = duration ? (currentTime / duration) * 100 : 0;
    const volumePercent = volume * 100;

    const toggleExpand = () => {
        if (window.innerWidth <= 768) {
            setIsMobileExpanded(true);
        }
    };


    const mobileActiveLyricIdx = mobileLyrics.reduce((acc, l, i) => currentTime >= l.time ? i : acc, -1);
    const mobileActiveLyric = mobileLyrics[mobileActiveLyricIdx]?.text || '';
    const mobileNextLyric   = mobileLyrics[mobileActiveLyricIdx + 1]?.text || '';

    return (
        <>
        {/* ── Mobile Cinema Modal (Video fullscreen on mobile) ── */}
        {mobileCinemaOpen && (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 10005,
                background: '#000',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{ padding: '44px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)' }}>
                    <button onClick={() => { setMobileCinemaOpen(false); setIsVideoAudioMode(false); }}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CaretDown size={20} weight="bold" />
                    </button>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff' }}>{currentSong.title}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{currentSong.artist}</p>
                    </div>
                    {/* Audio / Video toggle */}
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '3px' }}>
                        <button onClick={() => setIsVideoAudioMode(false)}
                            style={{ padding: '4px 10px', borderRadius: '16px', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                background: !isVideoAudioMode ? 'var(--accent-color)' : 'transparent',
                                color: !isVideoAudioMode ? '#000' : 'rgba(255,255,255,0.6)' }}>🎵</button>
                        <button onClick={() => setIsVideoAudioMode(true)}
                            style={{ padding: '4px 10px', borderRadius: '16px', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                background: isVideoAudioMode ? '#e040fb' : 'transparent',
                                color: isVideoAudioMode ? '#fff' : 'rgba(255,255,255,0.6)' }}>🎬</button>
                    </div>
                </div>
                {/* Video */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#111' }}>
                        {mobileVideoLoading ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                                <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Mencari video...</p>
                            </div>
                        ) : mobileVideoId ? (
                            <iframe
                                key={`${mobileVideoId}-${isVideoAudioMode}`}
                                title="video"
                                src={`https://www.youtube.com/embed/${mobileVideoId}?autoplay=1&mute=${isVideoAudioMode ? 0 : 1}&rel=0&playsinline=1&modestbranding=1`}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allow="autoplay; fullscreen"
                                allowFullScreen
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                                <span style={{ fontSize: '32px' }}>🎵</span>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 }}>Video MV tidak ditemukan</p>
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: 0 }}>{currentSong.title} — {currentSong.artist}</p>
                            </div>
                        )}
                    </div>
                    {/* Song info below video */}
                    <div style={{ padding: '16px 20px', width: '100%' }}>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>{currentSong.title}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{currentSong.artist}</p>
                    </div>
                </div>
                {isVideoAudioMode && (
                    <p style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: 'rgba(224,64,251,0.7)', fontWeight: '700', margin: 0 }}>🎬 Audio dari video — player website di-mute</p>
                )}
            </div>
        )}

        {/* ── Spotify-style Mobile Expanded Player ── */}
        {isMobileExpanded && (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 10002,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                background: '#0a0a0f',
            }}>
                {/* Blurred album background */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${currentSong.coverUrl})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'blur(50px) brightness(0.2) saturate(1.8)',
                    transform: 'scale(1.15)',
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />

                {/* Main content — uses flex to fill + stay inside viewport */}
                <div style={{
                    position: 'relative', zIndex: 1,
                    display: 'flex', flexDirection: 'column',
                    height: '100%', padding: '0 0 env(safe-area-inset-bottom)',
                }}>

                    {/* 1. Header (fixed height) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '48px 20px 8px', flexShrink: 0 }}>
                        <button onClick={() => setIsMobileExpanded(false)}
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                            <CaretDown size={26} weight="bold" />
                        </button>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.45)' }}>Now Playing</p>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '700', color: '#fff' }}>{currentSong.album || currentSong.title}</p>
                        </div>
                        <div style={{ width: 34 }} />
                    </div>

                    {/* 2. Album Art (flex: 1, takes remaining space) */}
                    <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 32px', minHeight: 0 }}>
                        <div style={{
                            width: '100%', maxWidth: '280px',
                            aspectRatio: '1/1', borderRadius: '12px',
                            overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                        }}>
                            <img src={currentSong.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>

                    {/* 3. Song Info + Like (fixed) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 24px', flexShrink: 0 }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                            <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.title}</p>
                            <p style={{ margin: '3px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.artist}</p>
                        </div>
                        <button onClick={() => toggleLikedSong(currentSong.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                                color: likedSongs.includes(currentSong.id) ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)' }}>
                            <Heart size={26} weight={likedSongs.includes(currentSong.id) ? 'fill' : 'regular'} />
                        </button>
                    </div>

                    {/* 4. Lyrics preview (fixed) */}
                    {mobileActiveLyric && (
                        <div onClick={() => { setIsMobileExpanded(false); navigate('/lyrics'); }}
                            style={{ margin: '4px 16px', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff', lineHeight: 1.4 }}>{mobileActiveLyric}</p>
                            {mobileNextLyric && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{mobileNextLyric}</p>}
                        </div>
                    )}

                    {/* 5. Progress bar (fixed) */}
                    <div style={{ padding: '12px 24px 4px', flexShrink: 0 }}>
                        <div onMouseDown={handleProgressMouseDown} ref={progressBarRef}
                            style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', position: 'relative', marginBottom: '6px' }}>
                            <div style={{ width: `${currentPercent}%`, height: '100%', borderRadius: '4px', background: '#fff', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', top: '50%', left: `${currentPercent}%`, transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', background: '#fff', pointerEvents: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{formatTime(currentTime)}</span>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* 6. Controls (fixed) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 20px 8px', flexShrink: 0 }}>
                        <button className={`control-btn ${isShuffle ? 'active-btn' : ''}`} onClick={toggleShuffle}><Shuffle size={20} /></button>
                        <button className="control-btn" onClick={handleSkipBack}><SkipBack size={26} weight="fill" /></button>
                        <button className="control-btn play-btn" onClick={togglePlay}>
                            {isPlaying ? <PauseCircle size={58} weight="fill" /> : <PlayCircle size={58} weight="fill" />}
                        </button>
                        <button className="control-btn" onClick={handleSkipForward}><SkipForward size={26} weight="fill" /></button>
                        <button className={`control-btn ${repeatMode !== 'off' ? 'active-btn' : ''}`} onClick={toggleRepeat}>
                            {repeatMode === 'one' ? <RepeatOnce size={20} /> : <Repeat size={20} />}
                        </button>
                    </div>

                    {/* 7. Action bar — Video + Queue (fixed) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 24px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button
                            onClick={() => { setMobileCinemaOpen(true); setIsVideoAudioMode(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '20px', padding: '8px 18px', cursor: 'pointer',
                                color: '#fff', fontSize: '13px', fontWeight: '600',
                                backdropFilter: 'blur(8px)',
                            }}>
                            🎬 Tonton Video
                        </button>
                        <button onClick={() => { setIsMobileExpanded(false); navigate('/lyrics'); }}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <MicrophoneStage size={22} />
                            <span style={{ fontSize: '9px' }}>Lirik</span>
                        </button>
                        <button onClick={() => { setIsMobileExpanded(false); navigate('/queue'); }}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <Queue size={22} />
                            <span style={{ fontSize: '9px' }}>Antrian</span>
                        </button>
                    </div>

                </div>
            </div>
        )}

        {/* ── Mini Player (Desktop + Mobile compact) ── */}
        <div className={`bottom-player glass-panel`}>
            {/* Audio elements */}
            <audio ref={audioRef} src={currentSong.audioUrl} crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} />
            {nextSong && (
                <audio ref={nextAudioRef} src={nextSong.audioUrl} crossOrigin="anonymous" preload="auto" muted />
            )}

            {/* Mobile tap-to-expand zone (covers art + song info area) */}
            <button
                className="mobile-expand-zone hidden-desktop"
                onClick={toggleExpand}
                aria-label="Expand player"
                style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: 'calc(100% - 160px)',
                    background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 2,
                }}
            />

            {/* 1. Now Playing Info (Left) */}
            <div className="player-left">
                <Link to={`/album/${encodeURIComponent(currentSong.album || currentSong.title)}`}>
                    <img src={currentSong.coverUrl} alt="Cover" className="player-art" />
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Link to={`/album/${encodeURIComponent(currentSong.album || currentSong.title)}`} className="text-link-hover">
                        <span className="player-title">{currentSong.title}</span>
                    </Link>
                    <Link to={`/artist/${encodeURIComponent(currentSong.artist)}`} className="text-link-hover">
                        <span className="player-artist">{currentSong.artist}</span>
                    </Link>
                </div>
                <button className="action-icon"
                    style={{ marginLeft: '8px', color: likedSongs.includes(currentSong.id) ? 'var(--accent-color)' : 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => toggleLikedSong(currentSong.id)}>
                    <Heart size={20} weight={likedSongs.includes(currentSong.id) ? "fill" : "regular"} />
                </button>
            </div>

            {/* 2. Main Controls (Center) */}
            <div className="player-center">
                <div className="player-controls">
                    <button className={`control-btn ${isShuffle ? 'active-btn' : ''}`} onClick={toggleShuffle}>
                        <Shuffle size={20} />
                    </button>
                    <button className="control-btn" onClick={handleSkipBack}><SkipBack size={24} weight="fill" /></button>
                    <button className="control-btn play-btn" onClick={togglePlay}>
                        {isPlaying ? <PauseCircle size={40} weight="fill" /> : <PlayCircle size={40} weight="fill" />}
                    </button>
                    <button className="control-btn" onClick={handleSkipForward}><SkipForward size={24} weight="fill" /></button>
                    <button className={`control-btn ${repeatMode !== 'off' ? 'active-btn' : ''}`} onClick={toggleRepeat}
                        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        {repeatMode === 'one' ? <RepeatOnce size={20} /> : <Repeat size={20} />}
                        {repeatMode !== 'off' && (
                            <span style={{ width: '4px', height: '4px', background: 'var(--accent-color)', borderRadius: '50%', position: 'absolute', bottom: '-6px', boxShadow: '0 0 8px var(--accent-color)' }}></span>
                        )}
                    </button>
                </div>
                <div className="player-progress-bar">
                    <span className="time-current">{formatTime(currentTime)}</span>
                    <div className="progress-bg" ref={progressBarRef} onMouseDown={handleProgressMouseDown} style={{ position: 'relative' }}>
                        <div className="progress-fill" style={{ width: `${currentPercent}%` }}></div>
                        <div className="progress-handle" style={{ left: `${currentPercent}%`, opacity: isDraggingProgress ? 1 : undefined, background: isDraggingProgress ? 'var(--accent-color)' : undefined }}></div>
                    </div>
                    <span className="time-total">{formatTime(duration)}</span>
                </div>
            </div>

            {/* 3. Extra Controls (Right) */}
            <div className="player-right">
                <button className={`extra-btn ${location.pathname === '/lyrics' ? 'active-btn' : ''}`} onClick={() => navigate('/lyrics')} title="Lyrics">
                    <MicrophoneStage size={18} />
                </button>
                <button className={`extra-btn ${location.pathname === '/queue' ? 'active-btn' : ''}`} onClick={() => navigate('/queue')} title="Queue">
                    <Queue size={18} />
                </button>
                <button className="extra-btn"><Desktop size={18} /></button>
                <div className="volume-control">
                    <button className="extra-btn"><SpeakerHigh size={18} /></button>
                    <div className="progress-bg volume-slider" ref={volumeBarRef} onMouseDown={handleVolumeMouseDown} style={{ position: 'relative' }}>
                        <div className="progress-fill" style={{ width: `${volumePercent}%` }}></div>
                        <div className="progress-handle" style={{ left: `${volumePercent}%`, opacity: isDraggingVolume ? 1 : undefined, background: isDraggingVolume ? 'var(--accent-color)' : undefined }}></div>
                    </div>
                </div>
                <button className="extra-btn" onClick={toggleFullscreen} title="Fullscreen"><ArrowsOutSimple size={18} /></button>
            </div>

            <style>{`
                .active-btn {
                    color: var(--accent-hover) !important;
                    filter: drop-shadow(0 0 6px var(--accent-color));
                }
                .mobile-expand-zone {
                    display: none;
                }
                @media (max-width: 768px) {
                    .mobile-expand-zone {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
        </>
    );
}
