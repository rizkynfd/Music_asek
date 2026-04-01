/**
 * API Service Layer — Musik Asek + Supabase
 *
 * Semua fungsi menggunakan Supabase sebagai backend.
 * Jika Supabase belum dikonfigurasi (VITE_SUPABASE_URL kosong),
 * otomatis fallback ke mock data lokal.
 */

import { supabase } from './supabase';
import { songs as mockSongs, playlists as mockPlaylists, genres, albums } from '../data/mockData';

const isSupabaseConfigured = () =>
    !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
    && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'ISI_DENGAN_ANON_KEY_KAMU_DARI_SUPABASE';

const ok = (data) => ({ data, error: null });
const err = (message) => ({ data: null, error: message });

// ─────────────────────────────────────────────
// SONGS
// ─────────────────────────────────────────────

export async function getSongs() {
    if (!isSupabaseConfigured()) return ok([...mockSongs]);

    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('id');

    if (error) return err(error.message);

    // Normalize field names to match existing component usage
    const normalized = data.map(s => ({
        ...s,
        desc: s.description,
    }));
    return ok(normalized);
}

export async function getSongsByGenre(genreId) {
    if (!isSupabaseConfigured()) {
        return ok(mockSongs.filter(s => s.genre === genreId));
    }
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('genre', genreId);
    if (error) return err(error.message);
    return ok(data);
}

export async function getSongById(id) {
    if (!isSupabaseConfigured()) {
        const song = mockSongs.find(s => s.id === id);
        return song ? ok(song) : err('Song not found');
    }
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return err(error.message);
    return ok(data);
}

export async function search(query) {
    if (!isSupabaseConfigured()) {
        const q = query.toLowerCase();
        const matched = mockSongs.filter(s =>
            s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
        );
        return ok({ songs: matched, artists: [], albums: [], playlists: [] });
    }

    // Supabase full-text search using ilike
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`);

    if (error) return err(error.message);

    // Derive artists and albums from results
    const artistSet = new Map();
    const albumSet = new Map();
    data.forEach(s => {
        if (!artistSet.has(s.artist)) artistSet.set(s.artist, { name: s.artist, coverUrl: s.cover_url });
        if (s.album && !albumSet.has(s.album)) albumSet.set(s.album, { name: s.album, artist: s.artist, coverUrl: s.cover_url });
    });

    return ok({
        songs: data,
        artists: Array.from(artistSet.values()),
        albums: Array.from(albumSet.values()),
        playlists: []
    });
}

export async function addSong(song) {
    if (!isSupabaseConfigured()) return ok(song);
    const { data, error } = await supabase.from('songs').insert([{
        title: song.title,
        artist: song.artist,
        album: song.album,
        genre: song.genre,
        audio_url: song.audioUrl,
        cover_url: song.coverUrl,
        duration: song.duration,
        description: song.desc,
    }]).select().single();
    if (error) return err(error.message);
    return ok(data);
}

export async function deleteSong(id) {
    if (!isSupabaseConfigured()) return ok({ id });
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) return err(error.message);
    return ok({ id });
}

// ─────────────────────────────────────────────
// PLAYLISTS
// ─────────────────────────────────────────────

export async function getPlaylists() {
    if (!isSupabaseConfigured()) return ok([...mockPlaylists]);

    const { data, error } = await supabase
        .from('playlists')
        .select(`*, playlist_songs(song_id)`)
        .eq('is_public', true);

    if (error) return err(error.message);

    // Normalize: songs = [song_id, ...]
    const normalized = data.map(p => ({
        ...p,
        desc: p.description,
        coverUrl: p.cover_url,
        songs: (p.playlist_songs || []).map(ps => ps.song_id)
    }));
    return ok(normalized);
}

export async function createPlaylist(playlistData) {
    if (!isSupabaseConfigured()) {
        return ok({ ...playlistData, id: `playlist-${Date.now()}` });
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('playlists').insert([{
        id: playlistData.id || `playlist-${Date.now()}`,
        name: playlistData.name,
        description: playlistData.desc || '',
        cover_url: playlistData.coverUrl || '',
        owner_id: user?.id || null,
        is_public: false,
    }]).select().single();
    if (error) return err(error.message);
    return ok(data);
}

export async function updatePlaylist(id, updates) {
    if (!isSupabaseConfigured()) return ok({ id, ...updates });
    const { data, error } = await supabase
        .from('playlists')
        .update({
            name: updates.name,
            description: updates.desc,
            cover_url: updates.coverUrl,
        })
        .eq('id', id)
        .select()
        .single();
    if (error) return err(error.message);
    return ok(data);
}

export async function deletePlaylist(id) {
    if (!isSupabaseConfigured()) return ok({ id });
    const { error } = await supabase.from('playlists').delete().eq('id', id);
    if (error) return err(error.message);
    return ok({ id });
}

export async function addSongToPlaylist(playlistId, songId) {
    if (!isSupabaseConfigured()) return ok({ playlistId, songId });
    const { error } = await supabase.from('playlist_songs').upsert([{
        playlist_id: playlistId,
        song_id: songId,
    }]);
    if (error) return err(error.message);
    return ok({ playlistId, songId });
}

export async function removeSongFromPlaylist(playlistId, songId) {
    if (!isSupabaseConfigured()) return ok({ playlistId, songId });
    const { error } = await supabase.from('playlist_songs').delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);
    if (error) return err(error.message);
    return ok({ playlistId, songId });
}

// ─────────────────────────────────────────────
// GENRES & ALBUMS (static for now)
// ─────────────────────────────────────────────

export async function getGenres() {
    return ok([...genres]);
}

export async function getAlbums() {
    return ok([...albums]);
}

export async function getAlbumByName(name) {
    return ok(albums.find(a => a.name === name) || null);
}

// ─────────────────────────────────────────────
// AUTH (Supabase Auth)
// ─────────────────────────────────────────────

export async function loginUser(email, password) {
    if (!isSupabaseConfigured()) return ok({ message: 'handled_by_store' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return err(error.message);
    return ok(data);
}

export async function registerUser(username, email, password) {
    if (!isSupabaseConfigured()) return ok({ message: 'handled_by_store' });

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username, avatar_color: getRandomColor() }
        }
    });
    if (error) return err(error.message);
    return ok(data);
}

export async function logoutUser() {
    if (!isSupabaseConfigured()) return ok({ message: 'logged_out' });
    const { error } = await supabase.auth.signOut();
    if (error) return err(error.message);
    return ok({ message: 'logged_out' });
}

export async function getCurrentUser() {
    if (!isSupabaseConfigured()) return ok(null);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return err(error.message);
    return ok(user);
}

// ─────────────────────────────────────────────
// LIKED SONGS (Supabase)
// ─────────────────────────────────────────────

export async function getLikedSongs(userId) {
    if (!isSupabaseConfigured()) return ok([]);
    const { data, error } = await supabase
        .from('liked_songs')
        .select('song_id')
        .eq('user_id', userId);
    if (error) return err(error.message);
    return ok(data.map(row => row.song_id));
}

export async function likeSong(userId, songId) {
    if (!isSupabaseConfigured()) return ok({ songId, liked: true });
    const { error } = await supabase.from('liked_songs').upsert([{ user_id: userId, song_id: songId }]);
    if (error) return err(error.message);
    return ok({ songId, liked: true });
}

export async function unlikeSong(userId, songId) {
    if (!isSupabaseConfigured()) return ok({ songId, liked: false });
    const { error } = await supabase.from('liked_songs').delete()
        .eq('user_id', userId).eq('song_id', songId);
    if (error) return err(error.message);
    return ok({ songId, liked: false });
}

// ─────────────────────────────────────────────
// FOLLOWED ARTISTS (Supabase)
// ─────────────────────────────────────────────

export async function getFollowedArtists(userId) {
    if (!isSupabaseConfigured()) return ok([]);
    const { data, error } = await supabase
        .from('followed_artists')
        .select('artist_name')
        .eq('user_id', userId);
    if (error) return err(error.message);
    return ok(data.map(row => row.artist_name));
}

export async function followArtist(userId, artistName) {
    if (!isSupabaseConfigured()) return ok({ artistName, following: true });
    const { error } = await supabase.from('followed_artists').upsert([{ user_id: userId, artist_name: artistName }]);
    if (error) return err(error.message);
    return ok({ artistName, following: true });
}

export async function unfollowArtist(userId, artistName) {
    if (!isSupabaseConfigured()) return ok({ artistName, following: false });
    const { error } = await supabase.from('followed_artists').delete()
        .eq('user_id', userId).eq('artist_name', artistName);
    if (error) return err(error.message);
    return ok({ artistName, following: false });
}

// ─────────────────────────────────────────────
// STORAGE — Upload audio & cover
// ─────────────────────────────────────────────

export async function uploadSongCover(file, fileName) {
    const { data, error } = await supabase.storage
        .from('song-covers')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) return err(error.message);
    const { data: urlData } = supabase.storage.from('song-covers').getPublicUrl(fileName);
    return ok(urlData.publicUrl);
}

export async function uploadSongAudio(file, fileName) {
    const { data, error } = await supabase.storage
        .from('song-audio')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) return err(error.message);
    const { data: urlData } = supabase.storage.from('song-audio').getPublicUrl(fileName);
    return ok(urlData.publicUrl);
}

// Helper: random avatar color
function getRandomColor() {
    const colors = ['#00f0ff', '#b026ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b'];
    return colors[Math.floor(Math.random() * colors.length)];
}

export const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
