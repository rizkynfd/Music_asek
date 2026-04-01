import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { PlayCircle, PauseCircle, Heart, Queue, User, Disc, ShareNetwork, Trash, PencilSimple, ListPlus, CaretRight, Plus } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ContextMenu() {
    const {
        contextMenu, closeContextMenu, setCurrentSong, togglePlay, currentSong,
        isPlaying, toggleLikedSong, likedSongs, addToQueue, playNext,
        openEditModal, playlists, songs, addSongToPlaylist, createNewPlaylist, showToast, removeSongFromPlaylist, showConfirm
    } = usePlayerStore();
    const menuRef = useRef(null);
    const subMenuRef = useRef(null);
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const userId = currentUser?.id || null;
    const [showPlaylists, setShowPlaylists] = useState(false);

    // Close on click outside or escape key
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) &&
                (!subMenuRef.current || !subMenuRef.current.contains(e.target))) {
                closeContextMenu();
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') closeContextMenu();
        };

        if (contextMenu.isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEsc);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowPlaylists(false); // Reset submenu state on new open
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [contextMenu.isOpen, closeContextMenu, contextMenu.item]);

    if (!contextMenu.isOpen || !contextMenu.item) return null;

    const { x, y, item, type, meta } = contextMenu;

    // Ensure menu stays within screen bounds
    const menuStyle = {
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 9999,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-glass-border)',
        borderRadius: 'var(--border-radius-md)',
        padding: '4px',
        minWidth: '220px',
        boxShadow: 'var(--shadow-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    };

    const handleAction = (action) => {
        action();
        closeContextMenu();
    };

    if (type === 'playlist') {
        // Allow edit/delete for all playlists (not just user-created ones)
        const isCustom = true;
        const handleDelete = () => {
            showConfirm(
                `Are you sure you want to delete "${item.name}"?`,
                'DELETE_PLAYLIST',
                item.id
            );
        };

        const handleShare = () => {
            navigator.clipboard.writeText(`https://stellarbeats.app/playlist/${item.id}`);
            showToast("Playlist link copied to clipboard!");
        };

        const handlePlayNext = () => {
            if (!item.songs || item.songs.length === 0) {
                showToast("Playlist is empty");
                return;
            }
            const playlistSongs = item.songs.map(id => songs.find(s => s.id === id)).filter(Boolean);
            if (playlistSongs.length > 0) {
                [...playlistSongs].reverse().forEach(s => playNext(s));
                showToast(`Added ${playlistSongs.length} songs to play next`);
            }
        };

        const handleAddToQueue = () => {
            if (!item.songs || item.songs.length === 0) {
                showToast("Playlist is empty");
                return;
            }
            const playlistSongs = item.songs.map(id => songs.find(s => s.id === id)).filter(Boolean);
            if (playlistSongs.length > 0) {
                playlistSongs.forEach(s => addToQueue(s));
                showToast(`Added ${playlistSongs.length} songs to queue`);
            }
        };

        return (
            <div ref={menuRef} style={menuStyle} className="context-menu">
                <button className="cm-item" onClick={() => handleAction(() => { navigate(`/playlist/${item.id}`); })}>
                    <PlayCircle size={20} />
                    <span>Open Playlist</span>
                </button>
                <div className="cm-divider"></div>
                <button className="cm-item" onClick={() => handleAction(handlePlayNext)}>
                    <ListPlus size={20} />
                    <span>Play next</span>
                </button>
                <button className="cm-item" onClick={() => handleAction(handleAddToQueue)}>
                    <Queue size={20} />
                    <span>Add to queue</span>
                </button>
                <div className="cm-divider"></div>
                {isCustom && (
                    <button className="cm-item" onClick={() => handleAction(() => openEditModal(item.id))}>
                        <PencilSimple size={20} />
                        <span>Edit details</span>
                    </button>
                )}
                {isCustom && (
                    <button className="cm-item" onClick={() => handleAction(handleDelete)}>
                        <Trash size={20} />
                        <span>Delete</span>
                    </button>
                )}
                <div className="cm-divider"></div>
                <button className="cm-item" onClick={() => handleAction(handleShare)}>
                    <ShareNetwork size={20} />
                    <span>Share</span>
                </button>
            </div>
        );
    }

    // Default: type === 'song'
    const song = item;
    const isLiked = likedSongs.includes(song.id);
    const isThisPlaying = currentSong?.id === song.id && isPlaying;

    const handlePlay = () => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song);
        }
    };

    const handleCopyLink = () => {
        // Mock share copy
        navigator.clipboard.writeText(`https://stellarbeats.app/track/${song.id}`);
        showToast("Link copied to clipboard!");
    };

    return (
        <div ref={menuRef} style={menuStyle} className="context-menu">
            {meta?.startsWith('playlist-') && (
                <>
                    <button className="cm-item" onClick={() => handleAction(() => {
                        removeSongFromPlaylist(song.id, meta);
                        showToast("Removed from this playlist");
                    })}>
                        <Trash size={20} />
                        <span>Remove from this playlist</span>
                    </button>
                    <div className="cm-divider"></div>
                </>
            )}

            <button className="cm-item" onClick={() => handleAction(handlePlay)}>
                {isThisPlaying ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                <span>{isThisPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <div className="cm-divider"></div>
            <button className="cm-item" onClick={() => handleAction(() => toggleLikedSong(song.id, userId))}>
                <Heart size={20} weight={isLiked ? "fill" : "regular"} color={isLiked ? "var(--accent-color)" : "currentColor"} />
                <span>{isLiked ? 'Remove from Liked Songs' : 'Save to your Liked Songs'}</span>
            </button>
            <button className="cm-item" onClick={() => handleAction(() => playNext(song))}>
                <ListPlus size={20} />
                <span>Play next</span>
            </button>
            <button className="cm-item" onClick={() => handleAction(() => addToQueue(song))}>
                <Queue size={20} />
                <span>Add to queue</span>
            </button>

            {/* Nested Playlist Menu */}
            <div
                className="cm-item"
                onMouseEnter={() => setShowPlaylists(true)}
                onMouseLeave={() => setShowPlaylists(false)}
                style={{ position: 'relative' }}
            >
                <Plus size={20} />
                <span style={{ flex: 1 }}>Add to playlist</span>
                <CaretRight size={16} />

                {showPlaylists && (
                    <div
                        ref={subMenuRef}
                        style={{
                            ...menuStyle,
                            position: 'absolute',
                            left: '100%',
                            top: 0,
                            marginLeft: '2px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}
                        className="context-menu"
                    >
                        {/* Only show custom playlists created by user, not standard Mock ones */}
                        <button className="cm-item" onClick={() => {
                            createNewPlaylist();
                            // We don't have the new ID immediately here without refactoring store, 
                            // so we just create an empty new playlist and the user can add it later.
                            showToast("New playlist created! Save songs here.");
                            closeContextMenu();
                        }}>
                            <Plus size={20} />
                            <span>New playlist</span>
                        </button>
                        <div className="cm-divider"></div>
                        {playlists.filter(p => p.id.startsWith('playlist-') && p.owner_id === currentUser?.id).map(p => (
                            <button
                                key={p.id}
                                className="cm-item text-ellipsis"
                                onClick={() => handleAction(() => {
                                    if (p.songs.includes(song.id)) {
                                        showToast(`Already added to ${p.name}`);
                                    } else {
                                        addSongToPlaylist(song.id, p.id);
                                        showToast(`Added to ${p.name}`);
                                    }
                                })}
                            >
                                <span className="text-ellipsis" style={{ maxWidth: '180px' }}>{p.name}</span>
                            </button>
                        ))}
                        {playlists.filter(p => p.id.startsWith('playlist-') && p.owner_id === currentUser?.id).length === 0 && (
                            <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                No custom playlists yet.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="cm-divider"></div>
            <button className="cm-item" onClick={() => handleAction(() => navigate(`/artist/${encodeURIComponent(song.artist)}`))}>
                <User size={20} />
                <span>Go to artist</span>
            </button>
            <button className="cm-item" onClick={() => handleAction(() => navigate(`/album/${encodeURIComponent(song.album || song.title)}`))}>
                <Disc size={20} />
                <span>Go to album</span>
            </button>
            <div className="cm-divider"></div>
            <button className="cm-item" onClick={() => handleAction(handleCopyLink)}>
                <ShareNetwork size={20} />
                <span>Share</span>
            </button>
        </div>
    );
}
