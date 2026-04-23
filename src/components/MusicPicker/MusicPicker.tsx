import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Play, Pause, Music, ChevronRight, Loader } from 'lucide-react';
import { searchTracks, getTracksByGenre, GENRE_TAGS, formatDuration } from '../../services/itunes';
import type { ItunesTrack } from '../../services/itunes';
import './MusicPicker.css';

interface MusicPickerProps {
    onSelectTrack: (track: ItunesTrack) => void;
    onClose: () => void;
    selectedTrackId?: number;
}

type Tab = 'trending' | 'genres' | 'search';

export const MusicPicker: React.FC<MusicPickerProps> = ({ onSelectTrack, onClose, selectedTrackId }) => {
    const [activeTab, setActiveTab] = useState<Tab>('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [tracks, setTracks] = useState<ItunesTrack[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadTracks = useCallback(async (query: string) => {
        setIsLoading(true);
        try {
            const results = await searchTracks(query);
            setTracks(results);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load trending on mount
    useEffect(() => {
        loadTracks('trending hits 2024');
    }, [loadTracks]);

    // Debounced search
    useEffect(() => {
        if (activeTab !== 'search') return;
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (!searchQuery.trim()) {
            setTracks([]);
            return;
        }
        searchTimerRef.current = setTimeout(() => {
            loadTracks(searchQuery);
        }, 400);
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [searchQuery, activeTab, loadTracks]);

    const handleGenreSelect = (query: string, label: string) => {
        setSelectedGenre(label);
        setIsLoading(true);
        getTracksByGenre(query).then(results => {
            setTracks(results);
            setIsLoading(false);
        });
    };

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        stopAudio();
        if (tab === 'trending') loadTracks('trending hits 2024');
        if (tab === 'genres') { setTracks([]); setSelectedGenre(null); }
        if (tab === 'search') setTracks([]);
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingId(null);
    };

    const handlePlayPause = (track: ItunesTrack) => {
        if (!track.previewUrl) return;

        if (playingId === track.trackId) {
            stopAudio();
            return;
        }

        stopAudio();
        const audio = new Audio(track.previewUrl);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingId(null);
        audioRef.current = audio;
        setPlayingId(track.trackId);
    };

    const handleSelect = (track: ItunesTrack) => {
        stopAudio();
        onSelectTrack(track);
        onClose();
    };

    // Cleanup on unmount
    useEffect(() => () => stopAudio(), []);

    return (
        <motion.div
            className="music-picker-overlay"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
            {/* Header */}
            <div className="music-picker-header">
                <button className="mp-close-btn" onClick={onClose}><X size={22} /></button>
                <h2>Добавить звук</h2>
                <div style={{ width: 36 }} />
            </div>

            {/* Tabs */}
            <div className="music-tabs">
                {(['trending', 'genres', 'search'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        className={`music-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab)}
                    >
                        {tab === 'trending' ? '🔥 Популярное' : tab === 'genres' ? '🎼 Жанры' : '🔍 Поиск'}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <AnimatePresence>
                {activeTab === 'search' && (
                    <motion.div
                        className="mp-search-bar"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <Search size={18} className="search-icon" />
                        <input
                            autoFocus
                            placeholder="Поиск треков, артистов..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} /></button>}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Genre Pills */}
            <AnimatePresence>
                {activeTab === 'genres' && (
                    <motion.div
                        className="genre-pills-container"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {GENRE_TAGS.map(g => (
                            <button
                                key={g.label}
                                className={`genre-pill ${selectedGenre === g.label ? 'active' : ''}`}
                                onClick={() => handleGenreSelect(g.query, g.label)}
                            >
                                {g.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Track List */}
            <div className="mp-track-list">
                {isLoading ? (
                    <div className="mp-loading">
                        <Loader className="spin" size={32} />
                        <span>Загружаем треки...</span>
                    </div>
                ) : tracks.length === 0 && activeTab === 'search' && !searchQuery ? (
                    <div className="mp-empty">
                        <Music size={48} />
                        <span>Введите название или артиста</span>
                    </div>
                ) : tracks.length === 0 && activeTab === 'genres' && !selectedGenre ? (
                    <div className="mp-empty">
                        <span>Выберите жанр выше ☝️</span>
                    </div>
                ) : (
                    <AnimatePresence>
                        {tracks.map((track, i) => (
                            <motion.div
                                key={track.trackId}
                                className={`mp-track-row ${selectedTrackId === track.trackId ? 'selected' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                {/* Play / Artwork */}
                                <div className="mp-artwork-wrap" onClick={() => handlePlayPause(track)}>
                                    <img src={track.artworkUrl100} alt="" />
                                    <div className={`mp-play-overlay ${playingId === track.trackId ? 'playing' : ''}`}>
                                        {playingId === track.trackId ? <Pause fill="white" size={18} /> : <Play fill="white" size={18} />}
                                    </div>
                                    {playingId === track.trackId && (
                                        <div className="mp-eq-bars">
                                            <span /><span /><span /><span />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="mp-track-info" onClick={() => handlePlayPause(track)}>
                                    <span className="mp-track-name">{track.trackName}</span>
                                    <span className="mp-artist-name">{track.artistName}</span>
                                    <span className="mp-duration">{formatDuration(track.trackTimeMillis)}</span>
                                </div>

                                {/* Add button */}
                                <button
                                    className={`mp-add-btn ${selectedTrackId === track.trackId ? 'added' : ''}`}
                                    onClick={() => handleSelect(track)}
                                >
                                    {selectedTrackId === track.trackId ? '✓' : <ChevronRight size={18} />}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
};
