/**
 * LRCLIB API Service
 * Fetches synchronized (timestamped) lyrics for songs.
 * Docs: https://lrclib.net/docs
 *
 * Strategy:
 * 1. Try GET /api/get (exact match, with duration)
 * 2. Try GET /api/get (without duration — looser match)
 * 3. Try GET /api/search (text search, take best result)
 * 4. Return null if all fail
 */

const LRCLIB_BASE = 'https://lrclib.net/api';

// In-memory cache to avoid repeated API calls per session
const lyricsCache = new Map();

/**
 * Parse LRC format string into { time, text }[] array
 * LRC example: "[01:23.45] Some lyric text here"
 */
export function parseLrc(lrcString) {
    if (!lrcString) return [];

    const lines = lrcString.split('\n');
    const result = [];

    for (const line of lines) {
        const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/);
        if (!match) continue;

        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const ms      = parseInt((match[3] || '0').padEnd(3, '0'), 10);
        const text    = match[4].trim();

        if (text) {
            result.push({ time: minutes * 60 + seconds + ms / 1000, text });
        }
    }

    return result.sort((a, b) => a.time - b.time);
}

/** "M:SS" or "MM:SS" → total seconds (number) */
function durationToSeconds(duration) {
    if (!duration) return undefined;
    const parts = duration.split(':');
    if (parts.length !== 2) return undefined;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/** Extract synced or plain lyrics from a LRCLIB response object */
function extractLyricsFromResponse(data) {
    if (!data) return null;

    if (data.syncedLyrics) {
        const parsed = parseLrc(data.syncedLyrics);
        if (parsed.length > 0) return { lines: parsed, type: 'synced' };
    }

    if (data.plainLyrics) {
        const plain = data.plainLyrics
            .split('\n')
            .filter(l => l.trim())
            .map((text, i) => ({ time: i * 4, text }));
        return { lines: plain, type: 'plain' };
    }

    return null;
}

/**
 * Fetch synced lyrics from LRCLIB.
 * Returns { lines: { time, text }[], type: 'synced'|'plain' } or null.
 */
export async function fetchSyncedLyrics({ title, artist, album, duration }) {
    if (!title || !artist) return null;

    const cacheKey = `${artist.toLowerCase()}::${title.toLowerCase()}`;
    if (lyricsCache.has(cacheKey)) return lyricsCache.get(cacheKey);

    const durationSec = durationToSeconds(duration);

    // ── Attempt 1: GET /api/get with all params (including duration) ──
    if (durationSec) {
        try {
            const params = new URLSearchParams({
                track_name: title,
                artist_name: artist,
                ...(album ? { album_name: album } : {}),
                duration: durationSec,
            });
            const res = await fetch(`${LRCLIB_BASE}/get?${params}`);
            if (res.ok) {
                const data = await res.json();
                const result = extractLyricsFromResponse(data);
                if (result) {
                    lyricsCache.set(cacheKey, result);
                    return result;
                }
            }
        } catch { /* continue */ }
    }

    // ── Attempt 2: GET /api/get WITHOUT duration (looser match) ──
    try {
        const params = new URLSearchParams({
            track_name: title,
            artist_name: artist,
        });
        const res = await fetch(`${LRCLIB_BASE}/get?${params}`);
        if (res.ok) {
            const data = await res.json();
            const result = extractLyricsFromResponse(data);
            if (result) {
                lyricsCache.set(cacheKey, result);
                return result;
            }
        }
    } catch { /* continue */ }

    // ── Attempt 3: GET /api/search (keyword search, take first synced result) ──
    try {
        const params = new URLSearchParams({
            track_name: title,
            artist_name: artist,
            q: `${artist} ${title}`,
        });
        const res = await fetch(`${LRCLIB_BASE}/search?${params}`);
        if (res.ok) {
            const results = await res.json();
            if (Array.isArray(results) && results.length > 0) {
                // Prefer synced lyrics, fall back to first result
                const synced = results.find(r => r.syncedLyrics);
                const best   = synced || results[0];
                const result = extractLyricsFromResponse(best);
                if (result) {
                    lyricsCache.set(cacheKey, result);
                    return result;
                }
            }
        }
    } catch { /* continue */ }

    lyricsCache.set(cacheKey, null);
    return null;
}

/** Clear lyrics cache */
export function clearLyricsCache() {
    lyricsCache.clear();
}
