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

// Hardcoded fallback tracks shown when all API calls fail
const FALLBACK_TRACKS: ItunesTrack[] = [
    { trackId: 1, trackName: 'Blinding Lights', artistName: 'The Weeknd', collectionName: 'After Hours', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/22/f7/6f/22f76f5f-1dc5-fc5d-28f1-f5a7f6a9e4c4/source/100x100bb.jpg', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/c6/df/3c/c6df3c57-d9b0-0a3e-0cf0-96eb2a76bdc4/mzaf_11393219547076778456.plus.aac.p.m4a', trackTimeMillis: 200040, primaryGenreName: 'Pop' },
    { trackId: 2, trackName: 'Levitating', artistName: 'Dua Lipa', collectionName: 'Future Nostalgia', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/47/b7/e8/47b7e8a3-1e10-e72f-a9c2-79cde9e12c2f/source/100x100bb.jpg', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/24/ab/0a/24ab0ac4-3009-6e80-c8f8-5ffca3e1e7f2/mzaf_7756466700547671597.plus.aac.p.m4a', trackTimeMillis: 203064, primaryGenreName: 'Pop' },
    { trackId: 3, trackName: 'Stay', artistName: 'The Kid LAROI & Justin Bieber', collectionName: 'Stay', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/00/c3/2e/00c32e63-0cd1-1636-9cd1-f0daa8bf6edd/source/100x100bb.jpg', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/be/3d/e6/be3de6e2-1fca-e42d-6f62-44f2fd9b3e06/mzaf_16773649069668682979.plus.aac.p.m4a', trackTimeMillis: 141000, primaryGenreName: 'Pop' },
    { trackId: 4, trackName: 'Industry Baby', artistName: 'Lil Nas X & Jack Harlow', collectionName: 'Montero', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d9/90/cb/d990cbf3-47b0-29e4-2c5e-fbab2fc14c29/source/100x100bb.jpg', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/8b/3d/27/8b3d274a-bb78-c3ed-5bbe-30aaca35c879/mzaf_4437936019503736699.plus.aac.p.m4a', trackTimeMillis: 212000, primaryGenreName: 'Hip-Hop/Rap' },
    { trackId: 5, trackName: 'good 4 u', artistName: 'Olivia Rodrigo', collectionName: 'SOUR', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7e/8b/6a/7e8b6a97-8174-3d3a-34a9-f1a2ab9e7fa8/source/100x100bb.jpg', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/01/02/97/010297e4-e40a-d9d9-20c8-b6ed1b46c0a7/mzaf_3702892699832963097.plus.aac.p.m4a', trackTimeMillis: 178147, primaryGenreName: 'Pop' },
    { trackId: 6, trackName: 'Peaches', artistName: 'Justin Bieber ft. Daniel Caesar', collectionName: 'Justice', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/e6/5e/28/e65e287d-4a0b-93ef-4ea3-c3bce84ac2e9/source/100x100bb.jpg', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/f4/10/88/f410885b-5ed4-9869-9040-1eefbb66e897/mzaf_13100124671003985374.plus.aac.p.m4a', trackTimeMillis: 198000, primaryGenreName: 'R&B/Soul' },
];

export async function searchTracks(query: string, limit = 20): Promise<ItunesTrack[]> {
    if (!query.trim()) return FALLBACK_TRACKS;
    const params = new URLSearchParams({
        term: query,
        media: 'music',
        limit: limit.toString(),
        entity: 'song',
        country: 'us',
    });
    
    const targetUrl = `${ITUNES_BASE}/search?${params}`;
    
    // Multiple CORS proxies to try in order
    const proxies = [
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
        (url: string) => `https://cors.eu.org/${url}`,
    ];

    for (const proxyFn of proxies) {
        try {
            const proxyUrl = proxyFn(targetUrl);
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) continue;
            
            const data: ItunesSearchResult = await res.json();
            if (data?.results?.length) {
                return data.results.filter(t => t.previewUrl);
            }
        } catch {
            continue;
        }
    }

    console.warn("All proxies failed, returning fallback tracks");
    // Return fallback tracks filtered by query keyword (best-effort)
    const q = query.toLowerCase();
    const filtered = FALLBACK_TRACKS.filter(t =>
        t.trackName.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q)
    );
    return filtered.length > 0 ? filtered : FALLBACK_TRACKS;
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
