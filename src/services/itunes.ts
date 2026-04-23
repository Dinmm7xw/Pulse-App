const ITUNES_BASE = 'https://itunes.apple.com';

export interface ItunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName: string;
    artworkUrl100: string;
    previewUrl: string | null;
    trackTimeMillis: number;
    primaryGenreName: string;
}

export interface ItunesSearchResult {
    resultCount: number;
    results: ItunesTrack[];
}

export async function searchTracks(query: string, limit = 20): Promise<ItunesTrack[]> {
    if (!query.trim()) return [];
    const params = new URLSearchParams({
        term: query,
        media: 'music',
        limit: limit.toString(),
        entity: 'song',
    });
    
    const targetUrl = `${ITUNES_BASE}/search?${params}`;
    
    // List of proxies to try in order
    const proxies = [
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];

    for (const proxyFn of proxies) {
        try {
            const proxyUrl = proxyFn(targetUrl);
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`Proxy failed with status ${res.status}`);
            
            const data: ItunesSearchResult = await res.json();
            if (data && data.results) {
                return data.results.filter(t => t.previewUrl);
            }
        } catch (error) {
            console.warn(`Proxy ${proxyFn.name || 'alternative'} failed, trying next...`, error);
            continue;
        }
    }

    // Last resort: direct fetch (likely to fail in browser, but good for local dev)
    try {
        const res = await fetch(targetUrl);
        const data: ItunesSearchResult = await res.json();
        return data.results.filter(t => t.previewUrl);
    } catch (e) {
        console.error("All search attempts failed");
        return [];
    }
}

export async function getTracksByGenre(genre: string, limit = 20): Promise<ItunesTrack[]> {
    return searchTracks(genre, limit);
}

export const GENRE_TAGS = [
    { label: '🔥 Trending', query: 'trending 2024' },
    { label: '😌 Chill', query: 'chill lofi' },
    { label: '🎤 Hip-Hop', query: 'hip hop rap' },
    { label: '⚡ Electronic', query: 'electronic dance' },
    { label: '🎸 Pop', query: 'pop hits' },
    { label: '🌙 R&B', query: 'rnb soul' },
    { label: '🎻 Acoustic', query: 'acoustic indie' },
    { label: '🏋️ Workout', query: 'workout gym energy' },
];

export function formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}
