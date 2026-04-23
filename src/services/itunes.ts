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
    
    try {
        // Using allorigins 'get' endpoint which is often more reliable
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        const json = await res.json();
        
        if (json && json.contents) {
            const data: ItunesSearchResult = JSON.parse(json.contents);
            return data.results.filter(t => t.previewUrl);
        }
        
        // Fallback to raw if get fails or returns unexpected format
        const rawRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
        const rawData: ItunesSearchResult = await rawRes.json();
        return rawData.results.filter(t => t.previewUrl);
    } catch (error) {
        console.error("iTunes search failed:", error);
        // Last resort: direct fetch (might fail due to CORS in browser)
        try {
            const res = await fetch(targetUrl);
            const data: ItunesSearchResult = await res.json();
            return data.results.filter(t => t.previewUrl);
        } catch (e) {
            return [];
        }
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
