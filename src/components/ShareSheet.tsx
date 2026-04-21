import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Link, Instagram, MessageCircle, Send, MoreHorizontal, User } from 'lucide-react';
import './ShareSheet.css';
import { usePulseStore } from '../store/useStore';

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

export const ShareSheet: React.FC<ShareSheetProps> = ({ isOpen, onClose, postId }) => {
    const { friendsLocations, repostPost } = usePulseStore();

    const handleRepost = async () => {
        await repostPost(postId);
        onClose();
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Ссылка скопирована!');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        className="share-sheet-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div 
                        className="share-sheet"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className="share-sheet-header">Отправить</div>

                        <div className="share-section">
                            <div className="share-horizontal-scroll">
                                {friendsLocations.map(friend => (
                                    <div key={friend.id} className="friend-item" onClick={() => alert(`Отправлено ${friend.displayName}`)}>
                                        <div className="friend-avatar">
                                            {friend.photoURL ? <img src={friend.photoURL} alt="" /> : <User size={24} color="#555" />}
                                        </div>
                                        <span className="friend-name">{friend.displayName}</span>
                                    </div>
                                ))}
                                {friendsLocations.length === 0 && (
                                    <div className="friend-item" style={{ opacity: 0.5 }}>
                                        <div className="friend-avatar"><User size={24} color="#444" /></div>
                                        <span className="friend-name">Нет друзей</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="repost-container">
                            <div className="repost-btn" onClick={handleRepost}>
                                <div className="repost-icon-circle">
                                    <Repeat size={32} strokeWidth={3} />
                                </div>
                                <span className="repost-label">Репост</span>
                            </div>
                        </div>

                        <div className="share-section">
                            <div className="share-section-title">Поделиться</div>
                            <div className="share-horizontal-scroll">
                                <div className="social-item" onClick={copyLink}>
                                    <div className="social-icon-circle link">
                                        <Link size={24} color="white" />
                                    </div>
                                    <span className="social-name">Ссылка</span>
                                </div>
                                <div className="social-item" onClick={() => alert('Instagram')}>
                                    <div className="social-icon-circle instagram">
                                        <Instagram size={24} color="white" />
                                    </div>
                                    <span className="social-name">Instagram</span>
                                </div>
                                <div className="social-item" onClick={() => alert('Viber')}>
                                    <div className="social-icon-circle viber">
                                        <MessageCircle size={24} color="white" />
                                    </div>
                                    <span className="social-name">Viber</span>
                                </div>
                                <div className="social-item" onClick={() => alert('Сообщение')}>
                                    <div className="social-icon-circle">
                                        <Send size={24} color="white" />
                                    </div>
                                    <span className="social-name">Сообщение</span>
                                </div>
                                <div className="social-item">
                                    <div className="social-icon-circle">
                                        <MoreHorizontal size={24} color="white" />
                                    </div>
                                    <span className="social-name">Другое</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
