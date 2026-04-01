const YOUTUBE_API_BASE = 'https://youtube.googleapis.com/youtube/v3';

// Simple in-memory cache to avoid burning quota
const videoIdCache = new Map();

export async function fetchMusicVideoId(artist, title) {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    
    if (!apiKey) {
        console.warn('YouTube API key is missing. Set VITE_YOUTUBE_API_KEY in your .env file.');
        return null;
    }

    if (!artist || !title) return null;

    const cacheKey = `${artist}-${title}`.toLowerCase();
    if (videoIdCache.has(cacheKey)) {
        return videoIdCache.get(cacheKey);
    }

    try {
        const query = `${artist} ${title} official music video`;
        const params = new URLSearchParams({
            part: 'snippet',
            maxResults: '1',
            q: query,
            type: 'video',
            videoCategoryId: '10', // Music
            key: apiKey
        });

        const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
        if (!res.ok) return null;

        const data = await res.json();
        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            videoIdCache.set(cacheKey, videoId);
            return videoId;
        }

        videoIdCache.set(cacheKey, null);
        return null;
    } catch (err) {
        console.error('Failed to fetch YouTube Video ID:', err);
        return null;
    }
}
