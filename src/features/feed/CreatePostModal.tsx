import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, RefreshCw, Send, Shield, Loader, Camera, Music, Hash, Eye, Lock, Users, Play, Pause } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { uploadMedia } from '../../lib/upload';
import { PULSE_LIBRARY } from '../../constants/audio';
import type { PulseTrack } from '../../constants/audio';
import './CreatePostModal.css';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPublish: (postData: {
        text: string;
        isAnonymous: boolean;
        mediaUrl?: string;
        hashtags?: string[];
        privacy?: string;
        audioUrl?: string;
        audioName?: string;
    }) => void;
}

type Mode = 'camera' | 'text' | 'preview';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPublish }) => {
    const [mode, setMode] = useState<Mode>('camera');
    const [text, setText] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    
    // TikTok-style settings
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
    const [selectedTrack, setSelectedTrack] = useState<PulseTrack | null>(null);
    const [showMusicSelector, setShowMusicSelector] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Camera settings
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [flashOn, setFlashOn] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [activeFilter, setActiveFilter] = useState('none');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // HARD STOP and CLEAR when switching to text mode
    useEffect(() => {
        if (mode === 'text') {
            // Stop camera immediately
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            // Clear all media
            setCapturedImage(null);
            setCapturedVideo(null);
            setMediaBlob(null);
            setIsRecording(false);
        }
    }, [mode]);

    // Timer logic
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            setRecordingTime(0);
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Camera Init logic
    useEffect(() => {
        if (mode === 'camera' && isOpen) {
            const constraints: any = { 
                video: { 
                    facingMode,
                    advanced: [{ torch: flashOn }] 
                } 
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => console.error("Camera error:", err));
        }
        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [mode, isOpen, facingMode, flashOn]);

    const switchCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');

    const toggleFlash = async () => {
        if (!videoRef.current?.srcObject) return;
        const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
            try {
                await track.applyConstraints({ //@ts-ignore
                    advanced: [{ torch: !flashOn }] });
                setFlashOn(!flashOn);
            } catch (err) { console.error("Flash error:", err); }
        } else { alert("Вспышка не поддерживается"); }
    };

    const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setMediaBlob(file);
        if (file.type.startsWith('video/')) {
            setMediaType('video'); setCapturedVideo(url);
        } else {
            setMediaType('image'); setCapturedImage(url);
        }
        setMode('preview');
    };

    const startRecording = () => {
        if (!videoRef.current?.srcObject) return;
        const stream = videoRef.current.srcObject as MediaStream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            setCapturedVideo(url); setMediaBlob(blob); setMediaType('video'); setMode('preview');
        };
        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const cycleFilter = () => {
        const filters = ['none', 'sepia(0.5)', 'grayscale(1)', 'hue-rotate(90deg)', 'brightness(1.5)'];
        const currentIdx = filters.indexOf(activeFilter);
        setActiveFilter(filters[(currentIdx + 1) % filters.length]);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                setCapturedImage(URL.createObjectURL(blob));
                setMediaBlob(blob);
                setMode('preview');
            }
        }, 'image/jpeg', 0.8);
    };

    const handlePublish = async () => {
        setIsUploading(true);
        let mediaUrl = '';
        if (mediaBlob) {
            try { mediaUrl = await uploadMedia(mediaBlob); }
            catch (error: any) { alert("Ошибка загрузки: " + error.message); }
        }

        // Parse hashtags from text
        const parsedTags = text.match(/#\w+/g)?.map(t => t.slice(1)) || [];

        onPublish({
            text: text || "Новое фото 📸",
            isAnonymous,
            mediaUrl,
            hashtags: parsedTags,
            privacy,
            audioUrl: selectedTrack?.url,
            audioName: selectedTrack ? `${selectedTrack.name} — ${selectedTrack.artist}` : undefined
        });
        
        // Note: Future step is updating addPost to accept additional metadata
        // For now, let's reset
        setText(''); 
        setCapturedImage(null); 
        setMediaBlob(null); 
        setSelectedTrack(null);
        setIsUploading(false); 
        setMode('camera'); 
        onClose();
    };

    const toggleMusic = (track: PulseTrack) => {
        if (selectedTrack?.id === track.id) {
            if (isAudioPlaying) {
                audioRef.current?.pause();
                setIsAudioPlaying(false);
            } else {
                audioRef.current?.play();
                setIsAudioPlaying(true);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setSelectedTrack(track);
            const audio = new Audio();
            audio.preload = "auto";
            audio.src = track.url;
            audioRef.current = audio;
            
            // Basic event listeners for debugging
            audio.onerror = () => console.error("Audio failed to load:", track.url);
            
            // Modern browsers return a promise from play()
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsAudioPlaying(true);
                }).catch(e => {
                    if (e.name !== 'AbortError') {
                        console.warn("Initial playback failed, trying load()...", e);
                        audio.load();
                        audio.play().then(() => setIsAudioPlaying(true)).catch(() => {});
                    }
                });
            }
            
            audio.onended = () => setIsAudioPlaying(false);
        }
    };

    // Cleanup audio on modal close
    useEffect(() => {
        if (!isOpen && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsAudioPlaying(false);
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div 
                        key="backdrop"
                        className="modal-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    
                    {mode === 'text' ? (
                        <motion.div
                            key="text-modal-isolated"
                            className="create-post-modal text-mode"
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="threads-mode">
                                <header className="threads-header">
                                    <button onClick={() => setMode('camera')}>Отмена</button>
                                    <h3>Новый пост</h3>
                                    <button className="post-action-btn" disabled={!text || isUploading} onClick={handlePublish}>
                                        {isUploading ? 'Загрузка...' : 'Опубликовать'}
                                    </button>
                                </header>
                                <div className="threads-content">
                                    <div className="user-avatar">{auth.currentUser?.photoURL ? <img src={auth.currentUser.photoURL} /> : '👤'}</div>
                                    <div className="post-input-area">
                                        <span className="user-handle">{auth.currentUser?.displayName || auth.currentUser?.email || 'User'}</span>
                                        <textarea
                                            placeholder="Что происходит?..."
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="threads-footer">
                                    <div className="anonymity-toggle" onClick={() => setIsAnonymous(!isAnonymous)}>
                                        <Shield size={16} color={isAnonymous ? "#00FF94" : "#666"} />
                                        <span className={isAnonymous ? 'active' : ''}>Опубликовать анонимно</span>
                                        <div className={`mini-toggle ${isAnonymous ? 'active' : ''}`}></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="camera-modal-isolated"
                            className="create-post-modal camera-mode"
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            {mode === 'camera' ? (
                                <div className="camera-view">
                                    <video ref={videoRef} autoPlay playsInline muted className="camera-video-preview" style={{ filter: activeFilter }} />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    {isRecording && (
                                        <div className="recording-indicator-overlay">
                                            <div className="blink-dot"></div>
                                            <span>{formatTime(recordingTime)}</span>
                                        </div>
                                    )}
                                    <div className="camera-controls-top">
                                        <button className="icon-btn" onClick={onClose}><X size={24} /></button>
                                        <div className="camera-tools">
                                            <button className={`tool-btn ${flashOn ? 'active' : ''}`} onClick={toggleFlash}><Zap size={20} fill={flashOn ? "#FFD700" : "none"} /></button>
                                            <button className="tool-btn" onClick={switchCamera}><RefreshCw size={20} /></button>
                                        </div>
                                    </div>
                                    <div className="camera-controls-bottom">
                                        <div className="mode-selector">
                                            <span className={mediaType === 'video' ? 'active' : ''} onClick={() => setMediaType('video')}>Видео</span>
                                            <span className={mediaType === 'image' ? 'active' : ''} onClick={() => setMediaType('image')}>Фото</span>
                                            <span onClick={() => setMode('text')}>Текст</span>
                                        </div>
                                        <div className="capture-row">
                                            <label className="gallery-preview glass"><Camera size={20} /><input type="file" hidden accept="image/*,video/*" onChange={handleGalleryUpload} /></label>
                                            <div className={`capture-btn-outer ${isRecording ? 'recording' : ''}`} 
                                                 onTouchStart={() => mediaType === 'video' && startRecording()}
                                                 onTouchEnd={() => mediaType === 'video' && stopRecording()}
                                                 onMouseDown={() => (window.innerWidth > 768 && mediaType === 'video') && startRecording()}
                                                 onMouseUp={() => (window.innerWidth > 768 && mediaType === 'video') && stopRecording()}
                                                 onClick={() => mediaType === 'image' && capturePhoto()}><div className="capture-btn-inner"></div></div>
                                            <div className="filter-preview glass" onClick={cycleFilter}>✨</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="finalize-mode">
                                    <header className="finalize-header">
                                        <button className="back-arrow-btn" onClick={() => setMode('camera')}>←</button>
                                        <h3>Новая публикация</h3>
                                        <button className="publish-final-btn" onClick={handlePublish} disabled={isUploading}>
                                            {isUploading ? <Loader className="spin" /> : 'Опубликовать'}
                                        </button>
                                    </header>

                                    <div className="finalize-scrollable">
                                        <div className="finalize-top">
                                            <div className="caption-section">
                                                <textarea 
                                                    placeholder="Напишите подпись или добавьте #хештеги..." 
                                                    value={text} 
                                                    onChange={(e) => setText(e.target.value)} 
                                                />
                                            </div>
                                            <div className="media-thumbnail">
                                                {mediaType === 'video' ? (
                                                    <video src={capturedVideo!} muted autoPlay loop />
                                                ) : (
                                                    <img src={capturedImage!} alt="Mini Preview" />
                                                )}
                                                <div className="thumb-badge">Превью</div>
                                            </div>
                                        </div>

                                        <div className="settings-list">
                                            <div className="setting-item" onClick={() => setShowMusicSelector(!showMusicSelector)}>
                                                <div className="setting-icon"><Music size={18} /></div>
                                                <div className="setting-label">
                                                    <span>Музыка</span>
                                                    <p>{selectedTrack ? `${selectedTrack.name} — ${selectedTrack.artist}` : 'Выбрать звук'}</p>
                                                </div>
                                                <button className="chevron">›</button>
                                            </div>

                                            {showMusicSelector && (
                                                <div className="music-selector-tray">
                                                    {PULSE_LIBRARY.map(track => (
                                                        <div 
                                                            key={track.id} 
                                                            className={`music-card ${selectedTrack?.id === track.id ? 'active' : ''}`}
                                                            onClick={() => toggleMusic(track)}
                                                        >
                                                            <div className="track-cover">
                                                                <img src={track.cover} alt={track.name} />
                                                                {selectedTrack?.id === track.id && isAudioPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                                                            </div>
                                                            <div className="track-info">
                                                                <span className="track-name">{track.name}</span>
                                                                <span className="track-artist">{track.artist}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="setting-item">
                                                <div className="setting-icon"><Eye size={18} /></div>
                                                <div className="setting-label">
                                                    <span>Конфиденциальность</span>
                                                    <div className="privacy-pills">
                                                        <button 
                                                            className={privacy === 'public' ? 'active' : ''} 
                                                            onClick={() => setPrivacy('public')}
                                                        >
                                                            <Users size={14} /> Всем
                                                        </button>
                                                        <button 
                                                            className={privacy === 'private' ? 'active' : ''} 
                                                            onClick={() => setPrivacy('private')}
                                                        >
                                                            <Lock size={14} /> Личное
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="setting-item" onClick={() => setIsAnonymous(!isAnonymous)}>
                                                <div className="setting-icon"><Shield size={18} color={isAnonymous ? "#00FF94" : "#666"} /></div>
                                                <div className="setting-label">
                                                    <span>Анонимная публикация</span>
                                                    <p>{isAnonymous ? 'Личность скрыта' : 'Видно всем'}</p>
                                                </div>
                                                <div className={`mini-toggle ${isAnonymous ? 'active' : ''}`}></div>
                                            </div>
                                        </div>

                                        <div className="finalize-tip">
                                            <p>Ваша публикация будет видна в ленте и на карте Pulse</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
};
