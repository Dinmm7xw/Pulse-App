import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Zap, MessageSquare, Users, Send, Shield } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import './CreateShoutModal.css';

interface CreateShoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    location: [number, number];
}

type ShoutType = 'love' | 'hype' | 'meet' | 'question';

export const CreateShoutModal: React.FC<CreateShoutModalProps> = ({ isOpen, onClose, location }) => {
    const { addShout } = usePulseStore();
    const [text, setText] = useState('');
    const [type, setType] = useState<ShoutType>('hype');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setIsSubmitting(true);
        await addShout({
            text,
            type,
            lat: location[0],
            lng: location[1],
            isAnonymous
        });
        setIsSubmitting(false);
        setText('');
        onClose();
    };

    if (!isOpen) return null;

    const types = [
        { id: 'hype', label: 'Хайп', icon: <Zap size={20} />, color: '#7000FF' },
        { id: 'love', label: 'Признание', icon: <Heart size={20} />, color: '#FF005C' },
        { id: 'meet', label: 'Встреча', icon: <Users size={20} />, color: '#00D1FF' },
        { id: 'question', label: 'Вопрос', icon: <MessageSquare size={20} />, color: '#00FF94' },
    ];

    return (
        <AnimatePresence>
            <div className="shout-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="shout-modal glass"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="shout-modal-header">
                        <h3>Создать отметку</h3>
                        <button onClick={onClose}><X /></button>
                    </div>

                    <div className="shout-type-selector">
                        {types.map(t => (
                            <div 
                                key={t.id} 
                                className={`shout-type-item ${type === t.id ? 'active' : ''}`}
                                onClick={() => setType(t.id as ShoutType)}
                                style={{ '--active-color': t.color } as any}
                            >
                                <div className="shout-type-icon">{t.icon}</div>
                                <span>{t.label}</span>
                            </div>
                        ))}
                    </div>

                    <textarea 
                        placeholder="Что здесь происходит или что ты хочешь сказать?..."
                        value={text}
                        onChange={e => setText(e.target.value)}
                        maxLength={100}
                    />

                    <div className="shout-options">
                        <div className="shout-anon-toggle" onClick={() => setIsAnonymous(!isAnonymous)}>
                            <Shield size={18} color={isAnonymous ? '#00FF94' : '#666'} />
                            <span>Анонимно</span>
                            <div className={`shout-toggle-track ${isAnonymous ? 'active' : ''}`}>
                                <div className="shout-toggle-thumb"></div>
                            </div>
                        </div>
                        <span className="shout-timer-info">Исчезнет через 8ч</span>
                    </div>

                    <button 
                        className="shout-submit-btn" 
                        onClick={handleSubmit}
                        disabled={!text.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Публикация...' : <><Send size={18} /> Оставить след</>}
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
