import React, { useEffect, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { fetchMusicVideoId } from '../services/youtube';

export default function BackgroundVideo({ 
    opacity = 0.15, 
    blur = '20px', 
    isSharp = false,
    unmuted = false,
    className = ""
}) {
    const { currentSong, isPlaying } = usePlayerStore();
    const [videoId, setVideoId] = useState(null);

    useEffect(() => {
        let isMounted = true;
        
        // Reset immediately so old video doesn't flash
        setVideoId(null);

        if (!currentSong) {
            return;
        }

        const timeout = setTimeout(() => {
            fetchMusicVideoId(currentSong.artist, currentSong.title).then(id => {
                if (isMounted) setVideoId(id);
            });
        }, 800);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, [currentSong?.id]);

    if (!videoId) {
        if (isSharp) {
            return (
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                         <div className="pulse-loader" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-color)', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Finding Clip...</span>
                    <style>{`
                        @keyframes spin { to { transform: rotate(360deg); } }
                    `}</style>
                </div>
            );
        }
        return null;
    }

    const containerStyle = isSharp ? {
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 'inherit',
        opacity: isPlaying ? 1 : 0.8,
        transition: 'opacity 0.5s ease',
        background: '#000'
    } : {
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
        opacity: isPlaying ? opacity : 0,
        transition: 'opacity 1s ease',
        filter: `blur(${blur}) saturate(1.5)`
    };

    return (
        <div style={containerStyle} className={className}>
            <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${unmuted ? 0 : 1}&controls=${unmuted ? 1 : 0}&showinfo=0&rel=0&loop=1&playlist=${videoId}&modestbranding=1&playsinline=1`}
                allow="autoplay; encrypted-media"
                style={{
                    width: isSharp ? '100%' : '100vw',
                    height: isSharp ? '100%' : '56.25vw',
                    minHeight: isSharp ? '100%' : '100vh',
                    minWidth: isSharp ? '100%' : '177.77vh',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    objectFit: 'cover',
                    border: 'none',
                    pointerEvents: unmuted ? 'auto' : 'none'
                }}
                title="Background Video"
            />
        </div>
    );
}
