import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send } from 'lucide-react';
import './StoryViewer.css';
import type { Post } from '../../types';

const ANON_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

interface StoryViewerProps {
    stories: Post[];
    initialIndex: number;
    onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);

    const currentStory = stories[currentIndex];

    // Handle auto-advance
    useEffect(() => {
        if (!currentStory) return;
        
        let timer: any;
        const isVideo = currentStory.mediaUrl?.includes('/video/upload/');
        
        // Only auto-advance images (videos should wait for end, but for simplicity we'll give videos a fixed 10s or wait for onEnded)
        if (!isVideo) {
            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        handleNext();
                        return 0;
                    }
                    return prev + 2; // 5 seconds total (100 / 2 = 50 ticks * 100ms = 5s)
                });
            }, 100);
        } else {
            // For video, we'll let the video timeupdate handle it
            setProgress(0);
        }

        return () => clearInterval(timer);
    }, [currentIndex, currentStory]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    const handleTouch = (e: React.MouseEvent<HTMLDivElement>) => {
        const x = e.clientX;
        const screenWidth = window.innerWidth;
        if (x < screenWidth / 2) {
            handlePrev();
        } else {
            handleNext();
        }
    };

    if (!currentStory) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="story-viewer-overlay"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
            >
                {/* Progress bars */}
                <div className="story-progress-container">
                    {stories.map((story, idx) => (
                        <div key={story.id} className="story-progress-bar-bg">
                            <div 
                                className="story-progress-bar-fill"
                                style={{ 
                                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                                }}
                            />
                        </div>
                    ))}
                </div>

                <header className="story-header">
                    <div className="story-user-info">
                        <img 
                            src={currentStory.isAnonymous ? ANON_AVATAR : (currentStory.userAvatar || '/default-avatar.png')} 
                            alt="" 
                        />
                        <span className="story-username">{currentStory.isAnonymous ? 'Аноним' : currentStory.user}</span>
                        <span className="story-time">1 ч.</span>
                    </div>
                    <button className="story-close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                        <X size={28} />
                    </button>
                </header>

                <div className="story-media-container" onClick={handleTouch}>
                    {currentStory.mediaUrl?.includes('/video/upload/') ? (
                        <video 
                            src={currentStory.mediaUrl} 
                            autoPlay 
                            playsInline 
                            className="story-full-media"
                            onEnded={handleNext}
                            onTimeUpdate={(e) => {
                                const target = e.target as HTMLVideoElement;
                                setProgress((target.currentTime / target.duration) * 100);
                            }}
                        />
                    ) : (
                        <img src={currentStory.mediaUrl} alt="" className="story-full-media" />
                    )}
                </div>

                <footer className="story-footer" onClick={(e) => e.stopPropagation()}>
                    <input type="text" placeholder="Ответить..." />
                    <button className="story-action-btn"><Heart size={24} /></button>
                    <button className="story-action-btn"><Send size={24} /></button>
                </footer>
            </motion.div>
        </AnimatePresence>
    );
};
