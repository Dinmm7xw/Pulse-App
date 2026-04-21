import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Check, X } from 'lucide-react';
import './AudioTrimmer.css';

interface AudioTrimmerProps {
    audioUrl: string;
    onTrim: (startTime: number, duration: number) => void;
    onCancel: () => void;
}

export const AudioTrimmer: React.FC<AudioTrimmerProps> = ({ audioUrl, onTrim, onCancel }) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);

    useEffect(() => {
        if (!waveformRef.current) return;

        wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#444',
            progressColor: '#ff0050',
            cursorColor: '#fff',
            barWidth: 2,
            barRadius: 3,
            height: 80,
            normalize: true,
            interact: true,
        });

        wavesurfer.current.load(audioUrl);

        wavesurfer.current.on('ready', () => {
            setDuration(wavesurfer.current!.getDuration());
        });

        wavesurfer.current.on('play', () => setIsPlaying(true));
        wavesurfer.current.on('pause', () => setIsPlaying(false));

        return () => {
            wavesurfer.current?.destroy();
        };
    }, [audioUrl]);

    const handleTrim = () => {
        // Simple trimmer logic: we capture the current scroll/position
        const currentTime = wavesurfer.current?.getCurrentTime() || 0;
        onTrim(currentTime, 15); // Default 15s trim
    };

    return (
        <div className="audio-trimmer-modal glass">
            <header className="trimmer-header">
                <button onClick={onCancel}><X size={20} /></button>
                <span>Обрезать звук</span>
                <button className="confirm-btn" onClick={handleTrim}><Check size={20} /></button>
            </header>

            <div className="trimmer-content">
                <div ref={waveformRef} className="waveform-container" />
                
                <div className="trim-info">
                    <span>Начало: {startTime.toFixed(1)}с</span>
                    <span>Длительность: 15с</span>
                </div>
            </div>

            <div className="trimmer-controls">
                <button className="play-pause-btn" onClick={() => wavesurfer.current?.playPause()}>
                    {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
                </button>
            </div>
        </div>
    );
};
