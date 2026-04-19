export interface PulseTrack {
    id: string;
    name: string;
    artist: string;
    url: string;
    cover: string;
}

export const PULSE_LIBRARY: PulseTrack[] = [
    {
        id: '1',
        name: 'Vibe Night',
        artist: 'Lofi Beat',
        url: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
        cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'
    },
    {
        id: '2',
        name: 'Cyber Drive',
        artist: 'Synthwave',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&h=100&fit=crop'
    },
    {
        id: '3',
        name: 'Space Drift',
        artist: 'Ambient',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=100&h=100&fit=crop'
    },
    {
        id: '4',
        name: 'Tech Flow',
        artist: 'Modern Beat',
        url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
        cover: 'https://images.unsplash.com/photo-1598387181032-a3103a4db5b3?w=100&h=100&fit=crop'
    }
];
