import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, UserPlus, MessageCircle, Repeat, Bell } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import './NotificationsModal.css';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
    const { notifications, markNotifRead } = usePulseStore();

    if (!isOpen) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={14} fill="#FF4D67" color="#FF4D67" />;
            case 'follow': return <UserPlus size={14} color="#00D1FF" />;
            case 'comment': return <MessageCircle size={14} color="#00FF88" />;
            case 'repost': return <Repeat size={14} color="#7000FF" />;
            default: return <Bell size={14} color="white" />;
        }
    };

    const formatTime = (ts: any) => {
        if (!ts) return 'Только что';
        const ms = ts.seconds ? ts.seconds * 1000 : (typeof ts === 'number' ? ts : (ts.toMillis ? ts.toMillis() : Date.now()));
        const diff = Date.now() - ms;
        const mins = Math.floor(diff / (1000 * 60));
        if (mins < 1) return 'Только что';
        if (mins < 60) return `${mins} м. назад`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} ч. назад`;
        return `${Math.floor(hours / 24)} д. назад`;
    };

    const handleNotifClick = (id: string) => {
        markNotifRead(id);
    };

    return (
        <AnimatePresence>
            <div className="notif-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="notif-modal-content"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    <div className="notif-header">
                        <h3>Уведомления</h3>
                        <button className="notif-close-btn" onClick={onClose}><X size={24} /></button>
                    </div>

                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notifs">
                                <p>У вас пока нет уведомлений</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotifClick(notif.id)}
                                >
                                    <div className="notif-avatar-wrap">
                                        <img src={notif.fromAvatar || NEUTRAL_AVATAR} className="notif-avatar" alt="" />
                                        <div className="notif-badge">
                                            {getIcon(notif.type)}
                                        </div>
                                    </div>
                                    <div className="notif-body">
                                        <p className="notif-text">
                                            <span className="notif-sender">{notif.fromName}</span> {notif.text}
                                        </p>
                                        <span className="notif-time">{formatTime(notif.timestamp)}</span>
                                    </div>
                                    {!notif.isRead && <div className="unread-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
