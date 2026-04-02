import React, { useRef, useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import {
    PlayCircle, PauseCircle, SkipBack, SkipForward,
    Shuffle, Repeat, RepeatOnce, Queue, Desktop, SpeakerHigh,
    ArrowsOutSimple, MicrophoneStage, Heart, CaretDown
} from 'phosphor-react';

import { Link, useNavigate, useLocation } from 'react-router-dom';

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
        isVideoAudioMode, setIsVideoAudioMode
    } = usePlayerStore();

    const audioRef = useRef(null);
    const nextAudioRef = useRef(null); // For gapless preloading & crossfade
    const [nextSong, setNextSong] = useState(null);
    const [isCrossfading, setIsCrossfading] = useState(false);
    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
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

    const toggleExpand = (e) => {
        if (window.innerWidth <= 768 && !isMobileExpanded) {
            if (!e.target.closest('.control-btn') && !e.target.closest('.player-progress-bar')) {
                setIsMobileExpanded(true);
            }
        }
    };

    return (
        <div 
            className={`bottom-player glass-panel ${isMobileExpanded ? 'mobile-expanded' : ''}`}
            onClick={toggleExpand}
        >
            {isMobileExpanded && (
                <div className="mobile-player-header">
                    <button className="collapse-btn" onClick={(e) => { e.stopPropagation(); setIsMobileExpanded(false); }}>
                        <CaretDown size={32} weight="bold" />
                    </button>
                    <span className="now-playing-text" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Now Playing</span>
                    <div style={{ width: 32 }}></div>
                </div>
            )}

            {/* Primary Audio */}
            <audio
                ref={audioRef}
                src={currentSong.audioUrl}
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />

            {/* Hidden Secondary Audio for Gapless Preload */}
            {nextSong && (
                <audio
                    ref={nextAudioRef}
                    src={nextSong.audioUrl}
                    crossOrigin="anonymous"
                    preload="auto"
                    muted // Just for pre-caching
                />
            )}

            {/* 1. Now Playing Info (Left) */}
            <div className="player-left">
                {currentSong ? (
                    <>
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
                        <button
                            className="action-icon"
                            style={{
                                marginLeft: '8px',
                                color: likedSongs.includes(currentSong.id) ? 'var(--accent-color)' : 'var(--text-secondary)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onClick={() => toggleLikedSong(currentSong.id)}
                        >
                            <Heart size={20} weight={likedSongs.includes(currentSong.id) ? "fill" : "regular"} />
                        </button>
                    </>
                ) : (
                    // This block should ideally not be reached due to the early return for !currentSong
                    // but kept for robustness if currentSong becomes null mid-render.
                    <p style={{ color: 'var(--text-secondary)' }}>No song selected</p>
                )}
            </div>

            {/* 2. Main Controls (Center) */}
            <div className="player-center">
                <div className="player-controls">
                    <button className={`control-btn ${isShuffle ? 'active-btn' : ''}`} onClick={toggleShuffle}>
                        <Shuffle size={20} />
                    </button>
                    <button className="control-btn" onClick={handleSkipBack}><SkipBack size={24} weight="fill" /></button>

                    <button className="control-btn play-btn" onClick={togglePlay}>
                        {isPlaying ? (
                            <PauseCircle size={40} weight="fill" />
                        ) : (
                            <PlayCircle size={40} weight="fill" />
                        )}
                    </button>

                    <button className="control-btn" onClick={handleSkipForward}><SkipForward size={24} weight="fill" /></button>

                    <button
                        className={`control-btn ${repeatMode !== 'off' ? 'active-btn' : ''}`}
                        onClick={toggleRepeat}
                        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                    >
                        {repeatMode === 'one' ? <RepeatOnce size={20} /> : <Repeat size={20} />}
                        {repeatMode !== 'off' && (
                            <span style={{
                                width: '4px', height: '4px',
                                background: 'var(--accent-color)',
                                borderRadius: '50%',
                                position: 'absolute',
                                bottom: '-6px',
                                boxShadow: '0 0 8px var(--accent-color)'
                            }}></span>
                        )}
                    </button>
                </div>

                <div className="player-progress-bar">
                    <span className="time-current">{formatTime(currentTime)}</span>
                    <div
                        className="progress-bg"
                        ref={progressBarRef}
                        onMouseDown={handleProgressMouseDown}
                        style={{ position: 'relative' }}
                    >
                        <div className="progress-fill" style={{ width: `${currentPercent}%` }}></div>
                        <div
                            className="progress-handle"
                            style={{
                                left: `${currentPercent}%`,
                                opacity: isDraggingProgress ? 1 : undefined,
                                background: isDraggingProgress ? 'var(--accent-color)' : undefined
                            }}
                        ></div>
                    </div>
                    <span className="time-total">{formatTime(duration)}</span>
                </div>
            </div>

            {/* 3. Extra Controls (Right) */}
            <div className="player-right">
                <button
                    className={`extra-btn ${location.pathname === '/lyrics' ? 'active-btn' : ''}`}
                    onClick={() => navigate('/lyrics')}
                    title="Lyrics"
                >
                    <MicrophoneStage size={18} />
                </button>
                <button
                    className={`extra-btn ${location.pathname === '/queue' ? 'active-btn' : ''}`}
                    onClick={() => navigate('/queue')}
                    title="Queue"
                >
                    <Queue size={18} />
                </button>
                <button className="extra-btn"><Desktop size={18} /></button>

                <div className="volume-control">
                    <button className="extra-btn"><SpeakerHigh size={18} /></button>
                    <div
                        className="progress-bg volume-slider"
                        ref={volumeBarRef}
                        onMouseDown={handleVolumeMouseDown}
                        style={{ position: 'relative' }}
                    >
                        <div className="progress-fill" style={{ width: `${volumePercent}%` }}></div>
                        <div
                            className="progress-handle"
                            style={{
                                left: `${volumePercent}%`,
                                opacity: isDraggingVolume ? 1 : undefined,
                                background: isDraggingVolume ? 'var(--accent-color)' : undefined
                            }}
                        ></div>
                    </div>
                </div>

                <button className="extra-btn" onClick={toggleFullscreen} title="Fullscreen"><ArrowsOutSimple size={18} /></button>
            </div>

            <style>{`
                .active-btn {
                    color: var(--accent-hover) !important;
                    filter: drop-shadow(0 0 6px var(--accent-color));
                }
            `}</style>
        </div>
    );
}
