import CryptoJS from 'crypto-js';

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';
const API_KEY     = import.meta.env.VITE_LASTFM_API_KEY;
const API_SECRET  = import.meta.env.VITE_LASTFM_API_SECRET;

/** Generate Last.fm API signature (MD5 hash of sorted params + secret) */
function generateSig(params) {
    const sorted = Object.keys(params)
        .filter(k => k !== 'format')
        .sort()
        .map(k => `${k}${params[k]}`)
        .join('');
    return CryptoJS.MD5(sorted + API_SECRET).toString();
}

/** Send "Now Playing" notification to Last.fm */
export async function sendNowPlaying(sessionKey, song) {
    if (!API_KEY || !API_SECRET || !sessionKey || !song) return;

    const params = {
        method: 'track.updateNowPlaying',
        artist: song.artist,
        track:  song.title,
        album:  song.album || '',
        duration: song.duration ? parseInt(song.duration) : undefined,
        api_key: API_KEY,
        sk: sessionKey,
        format: 'json',
    };
    // Remove undefined values
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);
    params.api_sig = generateSig(params);

    try {
        await fetch(LASTFM_BASE, {
            method: 'POST',
            body: new URLSearchParams(params),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    } catch (e) {
        console.warn('Last.fm Now Playing failed:', e);
    }
}

/** Scrobble a track (called after 30s or >50% played) */
export async function scrobbleTrack(sessionKey, song, timestamp) {
    if (!API_KEY || !API_SECRET || !sessionKey || !song) return;

    const params = {
        method: 'track.scrobble',
        artist: song.artist,
        track:  song.title,
        album:  song.album || '',
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        api_key: API_KEY,
        sk: sessionKey,
        format: 'json',
    };
    params.api_sig = generateSig(params);

    try {
        const res = await fetch(LASTFM_BASE, {
            method: 'POST',
            body: new URLSearchParams(params),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const data = await res.json();
        if (data.scrobbles?.['@attr']?.accepted > 0) {
            console.log('✅ Last.fm scrobble accepted:', song.title);
        }
    } catch (e) {
        console.warn('Last.fm scrobble failed:', e);
    }
}

/** Step 1 of auth: request a token then redirect user to Last.fm to authorize */
export function startLastfmAuth() {
    if (!API_KEY) return;
    // After user authorizes, Last.fm redirects to our callback URL with ?token=xxx
    const callbackUrl = `${window.location.origin}/settings?lastfm_callback=1`;
    const authUrl = `https://www.last.fm/api/auth/?api_key=${API_KEY}&cb=${encodeURIComponent(callbackUrl)}`;
    window.open(authUrl, '_blank', 'width=600,height=700');
}

/** Step 2 of auth: exchange token for session key */
export async function getLastfmSession(token) {
    if (!API_KEY || !API_SECRET || !token) return null;

    const params = { method: 'auth.getSession', api_key: API_KEY, token, format: 'json' };
    params.api_sig = generateSig(params);

    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${LASTFM_BASE}?${query}`);
        const data = await res.json();
        return data.session?.key || null;
    } catch (e) {
        console.warn('Last.fm getSession failed:', e);
        return null;
    }
}

/** Get the scrobble count and recent tracks for a user (display purposes) */
export async function getLastfmUserInfo(sessionKey) {
    if (!API_KEY || !sessionKey) return null;
    const params = { method: 'user.getInfo', api_key: API_KEY, sk: sessionKey, format: 'json' };
    params.api_sig = generateSig(params);
    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${LASTFM_BASE}?${query}`);
        const data = await res.json();
        return data.user || null;
    } catch {
        return null;
    }
}
