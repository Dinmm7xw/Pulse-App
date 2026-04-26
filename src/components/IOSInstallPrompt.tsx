import React, { useState, useEffect } from 'react';
import { Share, X, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './IOSInstallPrompt.css';

export const IOSInstallPrompt: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Detect if it's iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        // Check if already in standalone mode (installed)
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
        
        // Check if user dismissed it recently
        const isDismissed = localStorage.getItem('pwa_prompt_dismissed');

        if (isIOS && !isStandalone && !isDismissed) {
            // Show after a short delay to not annoy immediately
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Don't show again for 7 days
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    className="ios-prompt-overlay"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                >
                    <div className="ios-prompt-card glass">
                        <button className="close-prompt" onClick={handleDismiss}><X size={18} /></button>
                        
                        <div className="prompt-header">
                            <div className="app-icon-mini">
                                <img src="/apple-touch-icon.png" alt="Pulse" />
                            </div>
                            <div className="prompt-text">
                                <h3>Установи Pulse</h3>
                                <p>Добавь на экран «Домой», чтобы скрыть адресную строку Safari.</p>
                            </div>
                        </div>

                        <div className="instructions-steps">
                            <div className="step">
                                <div className="step-icon"><Share size={20} color="#007AFF" /></div>
                                <span>Нажми на кнопку <strong>«Поделиться»</strong> в меню Safari</span>
                            </div>
                            <div className="step">
                                <div className="step-icon"><PlusSquare size={20} /></div>
                                <span>Выбери <strong>«На экран «Домой»»</strong></span>
                            </div>
                        </div>

                        <div className="prompt-arrow"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
