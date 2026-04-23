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
    const res = await fetch(`${ITUNES_BASE}/search?${params}`);
    const data: ItunesSearchResult = await res.json();
    return data.results.filter(t => t.previewUrl);
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
