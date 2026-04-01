const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

export async function fetchArtistInfo(artistName) {
    const apiKey = import.meta.env.VITE_LASTFM_API_KEY;
    
    if (!apiKey) {
        console.warn('Last.fm API key is missing. Set VITE_LASTFM_API_KEY in your .env file.');
        return null;
    }

    try {
        const params = new URLSearchParams({
            method: 'artist.getinfo',
            artist: artistName,
            api_key: apiKey,
            format: 'json',
            autocorrect: '1'
        });

        const res = await fetch(`${LASTFM_API_BASE}?${params}`);
        if (!res.ok) return null;

        const data = await res.json();
        if (data.error || !data.artist) return null;

        return {
            bio: data.artist.bio?.content || data.artist.bio?.summary || '',
            bioUrl: data.artist.bio?.links?.link?.href || '',
            similar: data.artist.similar?.artist?.map(a => ({
                name: a.name,
                url: a.url,
                image: a.image?.find(img => img.size === 'extralarge')?.['#text'] || 
                       a.image?.find(img => img.size === 'large')?.['#text'] || ''
            })) || [],
            stats: data.artist.stats || {},
            tags: data.artist.tags?.tag?.map(t => t.name) || []
        };
    } catch (err) {
        console.error('Failed to fetch Last.fm artist info:', err);
        return null;
    }
}
