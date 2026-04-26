import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, RefreshCw, Shield, Loader, Camera, Music, Hash, Lock, Users, Eye } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { uploadMedia } from '../../lib/upload';
import { MusicPicker } from '../../components/MusicPicker/MusicPicker';
import { CropModal } from '../../components/CropModal';
import type { ItunesTrack } from '../../services/itunes';
import './CreatePostModal.css';

const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

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
        muteVideoAudio?: boolean;
    }) => void;
}

type Step = 'CAPTURE' | 'EDIT' | 'FINALIZE';
type Mode = 'camera' | 'text';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPublish }) => {
    const [step, setStep] = useState<Step>('CAPTURE');
    const [mode, setMode] = useState<Mode>('camera');
    const [text, setText] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    
    // TikTok-style settings

    const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
    const [selectedTrack, setSelectedTrack] = useState<ItunesTrack | null>(null);
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [muteOriginalAudio, setMuteOriginalAudio] = useState(false);
    
    // Camera settings
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [flashOn, setFlashOn] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [activeFilter, setActiveFilter] = useState('none');
    const [beautifyOn, setBeautifyOn] = useState(false);
    const [timer, setTimer] = useState<0 | 3 | 10>(0);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdown, setCountdown] = useState(0);
    
    // Editor UI state
    const [showCropper, setShowCropper] = useState(false);

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
        setStep('EDIT');
    };

    const handleCaptureAction = () => {
        if (isCountingDown) return;
        
        if (timer > 0) {
            setIsCountingDown(true);
            setCountdown(timer);
            const int = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(int);
                        setIsCountingDown(false);
                        if (mediaType === 'image') capturePhoto();
                        else startRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (mediaType === 'image') capturePhoto();
            else {
                if (isRecording) stopRecording();
                else startRecording();
            }
        }
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
            setCapturedVideo(url); setMediaBlob(blob); setMediaType('video'); setStep('EDIT');
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
        const filters = [
            'none', 
            'brightness(1.1) contrast(1.1) saturate(1.2)', // Vivid
            'grayscale(1) contrast(1.2)', // Noir
            'sepia(0.3) contrast(1.1) brightness(0.9)', // Retro
            'hue-rotate(180deg) saturate(0.8)', // Cinema
            'brightness(1.2) blur(0.5px) contrast(0.9)', // Dreamy
        ];
        const currentIdx = filters.indexOf(activeFilter);
        setActiveFilter(filters[(currentIdx + 1) % filters.length]);
    };

    const getFilterString = () => {
        let base = activeFilter === 'none' ? '' : activeFilter;
        if (beautifyOn) {
            // Beauty effect: smooth skin (blur) + brightness + soft contrast
            base += ' brightness(1.05) contrast(1.05) saturate(1.1) blur(0.3px)';
        }
        return base || 'none';
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.filter = getFilterString();
            ctx.drawImage(videoRef.current, 0, 0);
        }
        canvas.toBlob((blob) => {
            if (blob) {
                setCapturedImage(URL.createObjectURL(blob));
                setMediaBlob(blob);
                setStep('EDIT');
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
            audioUrl: selectedTrack?.previewUrl ?? undefined,
            audioName: selectedTrack ? `${selectedTrack.trackName} — ${selectedTrack.artistName}` : undefined,
            muteVideoAudio: muteOriginalAudio
        });
        
        // Note: Future step is updating addPost to accept additional metadata
        // Fully reset state after publish
        setText(''); 
        setCapturedImage(null);
        setCapturedVideo(null);
        setSelectedTrack(null);
        setMuteOriginalAudio(false);
        setIsUploading(false); 
        setMode('camera'); 
        setStep('CAPTURE');
        onClose();
    };

    // Reset state when modal is closed to avoid "stuck" UI on reopen
    useEffect(() => {
        if (!isOpen) {
            setText('');
            setCapturedImage(null);
            setCapturedVideo(null);
            setMediaBlob(null);
            setSelectedTrack(null);
            setMuteOriginalAudio(false);
            setIsUploading(false);
            setMode('camera');
            setStep('CAPTURE');
            setIsRecording(false);
            setRecordingTime(0);
        }
    }, [isOpen]);



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
                                    <div className="user-avatar">{auth.currentUser?.photoURL ? <img src={auth.currentUser.photoURL} /> : <img src={NEUTRAL_AVATAR} className="neutral-tiny-pfp" />}</div>
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
                            {step === 'CAPTURE' ? (
                                    <div className="camera-view">
                                        <video 
                                            ref={videoRef} 
                                            autoPlay 
                                            playsInline 
                                            muted 
                                            className="camera-video-preview" 
                                            style={{ filter: getFilterString() }} 
                                        />
                                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                                        
                                        {isCountingDown && (
                                            <div className="countdown-overlay">
                                                <motion.span
                                                    key={countdown}
                                                    initial={{ scale: 2, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.5, opacity: 0 }}
                                                >
                                                    {countdown}
                                                </motion.span>
                                            </div>
                                        )}

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
                                                <button className={`tool-btn ${timer > 0 ? 'active' : ''}`} onClick={() => setTimer(timer === 0 ? 3 : timer === 3 ? 10 : 0)}>
                                                    <span className="timer-label">{timer > 0 ? `${timer}s` : '⏲️'}</span>
                                                </button>
                                                <button className={`tool-btn ${beautifyOn ? 'active' : ''}`} onClick={() => setBeautifyOn(!beautifyOn)}>
                                                    <div className="beauty-icon">✨</div>
                                                </button>
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
                                                     onClick={handleCaptureAction}>
                                                    <div className="capture-btn-inner"></div>
                                                </div>
                                                <div className="filter-preview glass" onClick={cycleFilter}>✨</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : step === 'EDIT' ? (
                                    <div className="editor-view">
                                        <div className="media-preview-container">
                                            {mediaType === 'video' ? (
                                                <video 
                                                    src={capturedVideo!} 
                                                    autoPlay 
                                                    loop 
                                                    muted 
                                                    playsInline 
                                                    className="editor-media-preview" 
                                                    style={{ filter: getFilterString() }}
                                                />
                                            ) : (
                                                <img 
                                                    src={capturedImage!} 
                                                    alt="" 
                                                    className="editor-media-preview" 
                                                    style={{ filter: getFilterString() }}
                                                />
                                            )}
                                        </div>

                                        <div className="editor-sidebar">
                                            <button className="editor-tool-btn" onClick={() => setShowMusicPicker(true)}>
                                                <div className="tool-icon-wrap"><Music size={22} /></div>
                                                <span>Музыка</span>
                                            </button>
                                            <button className="editor-tool-btn" onClick={() => setShowCropper(true)}>
                                                <div className="tool-icon-wrap"><Hash size={22} /></div>
                                                <span>Обрезать</span>
                                            </button>
                                            <button className="editor-tool-btn" onClick={() => alert('Текст скоро!')}>
                                                <div className="tool-icon-wrap"><span>Aa</span></div>
                                                <span>Текст</span>
                                            </button>
                                            <button className="editor-tool-btn" onClick={cycleFilter}>
                                                <div className="tool-icon-wrap">✨</div>
                                                <span>Фильтры</span>
                                            </button>
                                        </div>

                                        {showCropper && (mediaType === 'image' ? capturedImage : capturedVideo) && (
                                            <CropModal 
                                                image={mediaType === 'image' ? capturedImage! : capturedVideo!} 
                                                onCropComplete={(pixels) => {
                                                    console.log("Cropped Area:", pixels);
                                                    setShowCropper(false);
                                                    alert("Кадрирование применено!");
                                                }}
                                                onClose={() => setShowCropper(false)}
                                            />
                                        )}

                                        <div className="editor-footer">
                                            <button className="back-btn" onClick={() => setStep('CAPTURE')}>Назад</button>
                                            <button className="next-btn" onClick={() => setStep('FINALIZE')}>Далее</button>
                                        </div>

                                        <AnimatePresence>
                                            {showMusicPicker && (
                                                <MusicPicker
                                                    onSelectTrack={(track) => {
                                                        setSelectedTrack(track);
                                                        setShowMusicPicker(false);
                                                    }}
                                                    onClose={() => setShowMusicPicker(false)}
                                                    selectedTrackId={selectedTrack?.trackId}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                <div className="finalize-mode">
                                    <header className="finalize-header">
                                        <button className="back-arrow-btn" onClick={() => setStep('EDIT')}>←</button>
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
                                            <div className="setting-item" onClick={() => setShowMusicPicker(true)}>
                                                <div className="setting-icon"><Music size={18} /></div>
                                                <div className="setting-label">
                                                    <span>Музыка</span>
                                                    <p>{selectedTrack ? `${selectedTrack.trackName} — ${selectedTrack.artistName}` : 'Выбрать звук'}</p>
                                                </div>
                                                <button className="chevron">›</button>
                                            </div>

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

                                            {mediaType === 'video' && (
                                                <div className="setting-item" onClick={() => setMuteOriginalAudio(!muteOriginalAudio)}>
                                                    <div className="setting-icon">{muteOriginalAudio ? <MicOff size={18} /> : <Mic size={18} />}</div>
                                                    <div className="setting-label">
                                                        <span>Звук видео</span>
                                                        <p>{muteOriginalAudio ? 'Выключен' : 'Включен'}</p>
                                                    </div>
                                                    <div className={`mini-toggle ${muteOriginalAudio ? 'active' : ''}`}></div>
                                                </div>
                                            )}
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
