import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

/**
 * useKeyboardShortcuts: Global keyboard shortcuts for the music player.
 * Must be called inside a component that has access to the player store.
 *
 * Shortcuts:
 *   Space       → Play / Pause
 *   ArrowRight  → Skip forward
 *   ArrowLeft   → Skip back / Restart
 *   M           → Toggle mute
 *   L           → Like / Unlike current song
 */
export function useKeyboardShortcuts() {
    const {
        isPlaying,
        togglePlay,
        currentSong,
        volume,
        setVolume,
        toggleLikedSong,
        likedSongs,
    } = usePlayerStore();

    // Store the previous volume before muting
    const prevVolume = useRef(volume > 0 ? volume : 0.5);

    // Keep prevVolume up to date when volume changes externally
    useEffect(() => {
        if (volume > 0) {
            prevVolume.current = volume;
        }
    }, [volume]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't fire shortcuts when typing in an input field
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;

            const store = usePlayerStore.getState();

            switch (e.key) {
                case ' ':
                case 'Space':
                    e.preventDefault();
                    store.togglePlay();
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    // Trigger skip forward via the BottomPlayer logic by
                    // dispatching a custom event that BottomPlayer listens to.
                    window.dispatchEvent(new CustomEvent('kb-skip-forward'));
                    break;

                case 'ArrowLeft':
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('kb-skip-back'));
                    break;

                case 'm':
                case 'M': {
                    const currentVol = usePlayerStore.getState().volume;
                    if (currentVol > 0) {
                        prevVolume.current = currentVol;
                        store.setVolume(0);
                    } else {
                        store.setVolume(prevVolume.current);
                    }
                    break;
                }

                case 'l':
                case 'L': {
                    const song = usePlayerStore.getState().currentSong;
                    if (song) {
                        store.toggleLikedSong(song.id);
                    }
                    break;
                }

                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
