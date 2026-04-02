import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { playlists as mockPlaylists, songs as mockSongs, genres as initialGenres } from '../data/mockData'
import { supabase } from '../services/supabase'
import { useAuthStore } from './useAuthStore'

const isSupabaseConfigured = () =>
    !!import.meta.env.VITE_SUPABASE_URL &&
    !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'ISI_DENGAN_ANON_KEY_KAMU_DARI_SUPABASE'

// Normalize a song row from Supabase snake_case → camelCase
const normalizeSong = (s) => ({
    ...s,
    audioUrl: s.audio_url || s.audioUrl || '',
    coverUrl: s.cover_url || s.coverUrl || '',
    desc: s.description || s.desc || '',
})

// Normalize a playlist row from Supabase
const normalizePlaylist = (p) => ({
    ...p,
    desc: p.description || p.desc || '',
    coverUrl: p.cover_url || p.coverUrl || '',
    songs: (p.playlist_songs || []).map(ps => ps.song_id),
})

export const usePlayerStore = create(
    persist(
        (set, get) => ({
            leftSidebarWidth: 280,
            setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
            rightSidebarWidth: 320,
            setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
            isVideoAudioMode: false,
            setIsVideoAudioMode: (val) => set({ isVideoAudioMode: val }),
            // Last.fm scrobbling
            lastfmSessionKey: null,
            setLastfmSessionKey: (key) => set({ lastfmSessionKey: key }),
            lastfmUser: null,
            setLastfmUser: (user) => set({ lastfmUser: user }),
            // Dynamic album colors
            albumColors: { bg: '#121212', accent: '#1DB954', muted: 'rgba(255,255,255,0.08)' },
            setAlbumColors: (colors) => set({ albumColors: colors }),
            currentSong: null,
            isPlaying: false,
            volume: 0.5,
            currentTime: 0,
            duration: 0,
            isShuffle: false,
            repeatMode: 'off',
            queue: [],
            playbackHistory: [],
            currentPlaylist: null,
            isLeftSidebarOpen: true,
            isRightSidebarOpen: true,
            playlists: mockPlaylists,
            songs: mockSongs,
            genres: initialGenres,
            isAdminAuthenticated: false,
            likedSongs: [],
            followedArtists: [],
            userLikedSongs: {},
            userFollowedArtists: {},
            userPlaybackHistory: {},
            isInitialized: false,

            // Context Menu
            contextMenu: { isOpen: false, x: 0, y: 0, item: null, type: 'song', meta: null },
            openContextMenu: (x, y, item, type = 'song', meta = null) => set({ contextMenu: { isOpen: true, x, y, item, type, meta } }),
            closeContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, isOpen: false } })),

            // Toast
            toast: { message: '', isVisible: false },
            showToast: (message) => {
                set({ toast: { message, isVisible: true } });
                setTimeout(() => {
                    set((state) => {
                        if (state.toast.message === message) return { toast: { ...state.toast, isVisible: false } };
                        return state;
                    });
                }, 3000);
            },

            // Modals
            editModal: { isOpen: false, playlistId: null },
            openEditModal: (playlistId) => set({ editModal: { isOpen: true, playlistId } }),
            closeEditModal: () => set({ editModal: { isOpen: false, playlistId: null } }),

            confirmDialog: { isOpen: false, message: '', actionType: null, payload: null },
            showConfirm: (message, actionType, payload = null) => set({ confirmDialog: { isOpen: true, message, actionType, payload } }),
            closeConfirm: () => set((state) => ({ confirmDialog: { ...state.confirmDialog, isOpen: false } })),

            // ─────────────────────────────────────────
            // SUPABASE INIT — fetch songs + playlists
            // ─────────────────────────────────────────
            initializeFromSupabase: async () => {
                if (!isSupabaseConfigured()) return;
                if (get().isInitialized) return; // Only init once per session

                try {
                    // Fetch songs
                    const { data: songData, error: songErr } = await supabase
                        .from('songs')
                        .select('*')
                        .order('id');

                    if (!songErr && songData && songData.length > 0) {
                        set({ songs: songData.map(normalizeSong) });
                    }

                    // Fetch public playlists with their song IDs
                    const { data: playlistData, error: plErr } = await supabase
                        .from('playlists')
                        .select('*, playlist_songs(song_id)')
                        .eq('is_public', true);

                    if (!plErr && playlistData && playlistData.length > 0) {
                        set({ playlists: playlistData.map(normalizePlaylist) });
                    }

                    set({ isInitialized: true });
                } catch (err) {
                    console.error('[Supabase] initializeFromSupabase error:', err);
                }
            },

            // ─────────────────────────────────────────
            // LOAD USER DATA — liked songs, followed artists, user playlists
            // ─────────────────────────────────────────
            loadUserData: async (userId) => {
                const state = get();
                
                // Set local history first quickly
                set({
                    playbackHistory: state.userPlaybackHistory[userId] || []
                });

                if (!userId) return;

                if (!isSupabaseConfigured()) {
                    // Fallback to local per-user data with auto-claim for orphaned playlists
                    set((state) => {
                        let nextPlaylists = state.playlists;
                        const orphans = state.playlists.filter(p => !p.owner_id && p.id.startsWith('playlist-'));
                        
                        if (orphans.length > 0) {
                            nextPlaylists = state.playlists.map(p => 
                                (!p.owner_id && p.id.startsWith('playlist-')) ? { ...p, owner_id: userId } : p
                            );
                        }
                        
                        return {
                            likedSongs: state.userLikedSongs[userId] || [],
                            followedArtists: state.userFollowedArtists[userId] || [],
                            playlists: nextPlaylists,
                        };
                    });
                    return;
                }

                try {
                    // Fetch liked song IDs
                    const { data: likedData } = await supabase
                        .from('liked_songs')
                        .select('song_id')
                        .eq('user_id', userId);
                    const likedSongs = (likedData || []).map(r => r.song_id);

                    // Fetch followed artist names
                    const { data: followedData } = await supabase
                        .from('followed_artists')
                        .select('artist_name')
                        .eq('user_id', userId);
                    const followedArtists = (followedData || []).map(r => r.artist_name);

                    // Fetch user's own playlists
                    const { data: userPlaylists } = await supabase
                        .from('playlists')
                        .select('*, playlist_songs(song_id)')
                        .eq('owner_id', userId);

                    set((state) => {
                        const normalized = (userPlaylists || []).map(normalizePlaylist);
                        // Merge: keep existing non-user playlists, add user's playlists
                        const existingIds = new Set(normalized.map(p => p.id));
                        const others = state.playlists.filter(p => !existingIds.has(p.id));
                        
                        // MIGRATION: Auto-claim orphans for current user locally
                        const migratedOthers = others.map(p => 
                            (!p.owner_id && p.id.startsWith('playlist-')) ? { ...p, owner_id: userId } : p
                        );

                        return {
                            likedSongs,
                            followedArtists,
                            playlists: [...migratedOthers, ...normalized],
                            userLikedSongs: { ...state.userLikedSongs, [userId]: likedSongs },
                            userFollowedArtists: { ...state.userFollowedArtists, [userId]: followedArtists },
                        };
                    });
                } catch (err) {
                    console.error('[Supabase] loadUserData error:', err);
                }
            },

            clearUserData: () => set({
                likedSongs: [],
                followedArtists: [],
                isInitialized: false, // Re-fetch on next login
                currentSong: null,
                isPlaying: false,
                queue: [],
                playbackHistory: [],
                currentPlaylist: null,
            }),

            // ─────────────────────────────────────────
            // LIKED SONGS
            // ─────────────────────────────────────────
            toggleLikedSong: (songId, userId) => {
                const state = get();
                const isLiked = state.likedSongs.includes(songId);

                // Optimistic local update
                set((s) => {
                    const updated = isLiked
                        ? s.likedSongs.filter(id => id !== songId)
                        : [...s.likedSongs, songId];
                    const userMap = userId ? { ...s.userLikedSongs, [userId]: updated } : s.userLikedSongs;
                    return { likedSongs: updated, userLikedSongs: userMap };
                });

                // Background sync to Supabase
                if (userId && isSupabaseConfigured()) {
                    if (isLiked) {
                        supabase.from('liked_songs').delete()
                            .eq('user_id', userId).eq('song_id', songId)
                            .catch(err => console.error('[Supabase] unlike error:', err));
                    } else {
                        supabase.from('liked_songs').upsert([{ user_id: userId, song_id: songId }])
                            .catch(err => console.error('[Supabase] like error:', err));
                    }
                }
            },

            getLikedSongsForUser: (userId) => {
                const state = get();
                if (!userId) return state.likedSongs;
                return state.userLikedSongs[userId] || [];
            },

            // ─────────────────────────────────────────
            // FOLLOW ARTIST
            // ─────────────────────────────────────────
            toggleFollowArtist: (artistName, userId) => {
                const state = get();
                const isFollowing = state.followedArtists.includes(artistName);

                // Optimistic local update
                set((s) => {
                    const updated = isFollowing
                        ? s.followedArtists.filter(a => a !== artistName)
                        : [...s.followedArtists, artistName];
                    const userMap = userId ? { ...s.userFollowedArtists, [userId]: updated } : s.userFollowedArtists;
                    return { followedArtists: updated, userFollowedArtists: userMap };
                });

                // Background sync to Supabase
                if (userId && isSupabaseConfigured()) {
                    if (isFollowing) {
                        supabase.from('followed_artists').delete()
                            .eq('user_id', userId).eq('artist_name', artistName)
                            .catch(err => console.error('[Supabase] unfollow error:', err));
                    } else {
                        supabase.from('followed_artists').upsert([{ user_id: userId, artist_name: artistName }])
                            .catch(err => console.error('[Supabase] follow error:', err));
                    }
                }
            },

            getFollowedArtistsForUser: (userId) => {
                const state = get();
                if (!userId) return state.followedArtists;
                return state.userFollowedArtists[userId] || [];
            },

            // ─────────────────────────────────────────
            // PLAYER ACTIONS
            // ─────────────────────────────────────────
            setCurrentSong: (song, playlist = null) => {
                if (!song) return;
                const state = get();
                state.addToHistory(song);
                set({ currentSong: song, isPlaying: true, currentPlaylist: playlist || null });
            },
            setIsPlaying: (isPlaying) => set({ isPlaying }),
            togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
            setVolume: (volume) => set({ volume }),
            setPlaybackProgress: (currentTime, duration) => set({ currentTime, duration }),
            toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
            toggleRepeat: () => set((state) => ({
                repeatMode: state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off'
            })),

            // Queue
            setQueue: (queue) => set({ queue }),
            addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
            playNext: (song) => set((state) => ({ queue: [song, ...state.queue] })),
            removeFromQueue: (index) => set((state) => ({ queue: state.queue.filter((_, i) => i !== index) })),
            clearQueue: () => set({ queue: [] }),
            addToHistory: (song) => set((state) => {
                const currentUser = useAuthStore.getState().currentUser;
                const userId = currentUser ? currentUser.id : 'guest';

                // Prevent consecutive duplicates
                if (state.playbackHistory.length > 0 && state.playbackHistory[0].id === song.id) {
                    return {};
                }
                
                const updatedHistory = [song, ...state.playbackHistory.filter(s => s.id !== song.id)].slice(0, 50);

                return { 
                    playbackHistory: updatedHistory,
                    userPlaybackHistory: {
                        ...state.userPlaybackHistory,
                        [userId]: updatedHistory
                    }
                };
            }),
            clearHistory: () => set((state) => {
                const currentUser = useAuthStore.getState().currentUser;
                const userId = currentUser ? currentUser.id : 'guest';
                return {
                    playbackHistory: [],
                    userPlaybackHistory: {
                        ...state.userPlaybackHistory,
                        [userId]: []
                    }
                };
            }),

            // UI
            toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
            toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),

            // ─────────────────────────────────────────
            // ADMIN AUTH & SONG CRUD
            // ─────────────────────────────────────────
            loginAdmin: (password) => {
                const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
                if (password === adminPass) {
                    set({ isAdminAuthenticated: true });
                    return true;
                }
                return false;
            },
            logoutAdmin: () => set({ isAdminAuthenticated: false }),


            addSong: async (song) => {
                // Optimistic local update
                const tempId = song.id || `temp-${Date.now()}`;
                const newSong = { ...song, id: tempId };
                set((state) => ({ songs: [newSong, ...state.songs] }));

                // Save to Supabase
                if (isSupabaseConfigured()) {
                    try {
                        const { data, error } = await supabase.from('songs').insert([{
                            title: song.title,
                            artist: song.artist,
                            album: song.album || '',
                            genre: song.genre || '',
                            audio_url: song.audioUrl || '',
                            cover_url: song.coverUrl || '',
                            duration: song.duration || '',
                            description: song.desc || '',
                        }]).select().single();

                        if (error) throw error;
                        
                        // Replace temp record with real one from DB (to get real ID)
                        if (data) {
                            set((state) => ({
                                songs: state.songs.map(s => s.id === tempId ? normalizeSong(data) : s)
                            }));
                        }
                    } catch (err) {
                        console.error('[Supabase] addSong error:', err);
                        // Rollback on error
                        set((state) => ({ songs: state.songs.filter(s => s.id !== tempId) }));
                        alert("Gagal menyimpan lagu ke database Supabase. Pastikan SQL Editor sudah dijalankan.");
                    }
                }
            },

            deleteSong: async (id) => {
                const state = get();
                const previousSongs = state.songs;
                const previousLiked = state.likedSongs;
                const previousPlaylists = state.playlists;

                // Optimistic local update
                set((state) => ({
                    songs: state.songs.filter(s => s.id !== id),
                    likedSongs: state.likedSongs.filter(likedId => likedId !== id),
                    queue: state.queue.filter(qItem => qItem.id !== id),
                    playlists: state.playlists.map(p => ({ ...p, songs: p.songs.filter(songId => songId !== id) }))
                }));

                // Delete from Supabase
                if (isSupabaseConfigured()) {
                    try {
                        const { error } = await supabase.from('songs').delete().eq('id', id);
                        if (error) throw error;
                        state.showToast("Song deleted from database");
                    } catch (err) {
                        console.error('[Supabase] deleteSong error:', err);
                        // Rollback on error
                        set({ 
                            songs: previousSongs, 
                            likedSongs: previousLiked, 
                            playlists: previousPlaylists 
                        });
                        alert("Gagal menghapus lagu dari database Supabase.\n\nPastikan Anda sudah menjalankan SQL DELETE policy di SQL Editor Supabase.");
                    }
                }
            },

            // ─────────────────────────────────────────
            // PLAYLIST CRUD
            // ─────────────────────────────────────────
            addPlaylist: async (playlist) => {
                // Optimistic update
                set((state) => ({ playlists: [...state.playlists, playlist] }));

                // Sync to Supabase as a public playlist
                if (isSupabaseConfigured()) {
                    try {
                        // 1. Insert the playlist
                        const { error: plErr } = await supabase.from('playlists').insert([{
                            id: playlist.id,
                            name: playlist.name,
                            description: playlist.desc,
                            cover_url: playlist.coverUrl,
                            is_public: true, // Curated are always public
                            owner_id: null,  // Owned by system/admin
                        }]);

                        if (plErr) throw plErr;

                        // 2. Insert playlist songs
                        if (playlist.songs && playlist.songs.length > 0) {
                            const songLinks = playlist.songs.map(songId => ({
                                playlist_id: playlist.id,
                                song_id: songId
                            }));
                            const { error: sErr } = await supabase.from('playlist_songs').insert(songLinks);
                            if (sErr) throw sErr;
                        }
                    } catch (err) {
                        console.error('[Supabase] addPlaylist error:', err);
                        // Rollback
                        set((state) => ({ playlists: state.playlists.filter(p => p.id !== playlist.id) }));
                        alert("Gagal menyimpan playlist ke database.");
                    }
                }
            },

            createNewPlaylist: async (fixedId) => {
                const tempId = fixedId || `playlist-${Date.now()}`;
                const state = get();
                
                // We need the current user to set ownership for local accounts
                const currentUser = useAuthStore.getState().currentUser;

                const newPlaylist = {
                    id: tempId,
                    name: `My Playlist #${state.playlists.length + 1}`,
                    desc: 'Custom created playlist',
                    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
                    songs: [],
                    owner_id: currentUser ? currentUser.id : null // IMPORTANT for local filtering
                };

                // Optimistic local update
                set((s) => ({ playlists: [...s.playlists, newPlaylist] }));

                // Save to Supabase
                if (isSupabaseConfigured()) {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        const { data, error } = await supabase.from('playlists').insert([{
                            id: tempId,
                            name: newPlaylist.name,
                            description: newPlaylist.desc,
                            cover_url: newPlaylist.coverUrl,
                            owner_id: user?.id || null,
                            is_public: false,
                        }]).select().single();

                        if (error) throw error;

                        if (data) {
                            set((state) => ({
                                playlists: state.playlists.map(p => p.id === tempId ? normalizePlaylist(data) : p)
                            }));
                        }
                    } catch (err) {
                        console.error('[Supabase] createPlaylist error:', err);
                        // Rollback on error
                        set((state) => ({ playlists: state.playlists.filter(p => p.id !== tempId) }));
                        alert("Gagal membuat playlist di Supabase. Pastikan SQL Editor sudah dijalankan.");
                    }
                }
            },

            deletePlaylist: async (playlistId) => {
                const state = get();
                const previousPlaylists = state.playlists;

                // Optimistic local update
                set((state) => ({ playlists: state.playlists.filter(p => p.id !== playlistId) }));

                if (isSupabaseConfigured()) {
                    try {
                        const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
                        if (error) throw error;
                        state.showToast("Playlist deleted from database");
                    } catch (err) {
                        console.error('[Supabase] deletePlaylist error:', err);
                        // Rollback
                        set({ playlists: previousPlaylists });
                        alert("Gagal menghapus playlist dari database Supabase.\n\nPastikan kebijakan DELETE sudah aktif di SQL Editor.");
                    }
                }
            },

            editPlaylist: (id, updates) => {
                set((state) => ({
                    playlists: state.playlists.map(p => p.id === id ? { ...p, ...updates } : p)
                }));

                if (isSupabaseConfigured()) {
                    supabase.from('playlists').update({
                        name: updates.name,
                        description: updates.desc,
                        cover_url: updates.coverUrl,
                    }).eq('id', id)
                        .catch(err => console.error('[Supabase] editPlaylist error:', err));
                }
            },

            addSongToPlaylist: (songId, playlistId) => {
                set((state) => ({
                    playlists: state.playlists.map(p => {
                        if (p.id === playlistId && !p.songs.includes(songId)) {
                            return { ...p, songs: [...p.songs, songId] };
                        }
                        return p;
                    })
                }));

                if (isSupabaseConfigured()) {
                    supabase.from('playlist_songs').upsert([{ playlist_id: playlistId, song_id: songId }])
                        .catch(err => console.error('[Supabase] addSongToPlaylist error:', err));
                }
            },

            removeSongFromPlaylist: (songId, playlistId) => {
                set((state) => ({
                    playlists: state.playlists.map(p => {
                        if (p.id === playlistId) return { ...p, songs: p.songs.filter(id => id !== songId) };
                        return p;
                    })
                }));

                if (isSupabaseConfigured()) {
                    supabase.from('playlist_songs').delete()
                        .eq('playlist_id', playlistId).eq('song_id', songId)
                        .catch(err => console.error('[Supabase] removeSongFromPlaylist error:', err));
                }
            },
        }),
        {
            name: 'spotify-clone-storage',
            partialize: (state) => ({
                volume: state.volume,
                isShuffle: state.isShuffle,
                repeatMode: state.repeatMode,
                likedSongs: state.likedSongs,
                userLikedSongs: state.userLikedSongs,
                userFollowedArtists: state.userFollowedArtists,
                followedArtists: state.followedArtists,
                playlists: state.playlists,
                songs: state.songs,
                genres: state.genres,
                isAdminAuthenticated: state.isAdminAuthenticated,
                queue: state.queue,
                playbackHistory: state.playbackHistory,
                userPlaybackHistory: state.userPlaybackHistory,
                currentPlaylist: state.currentPlaylist,
            }),
        }
    )
)
