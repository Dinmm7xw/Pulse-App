import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, UserPlus, MessageCircle } from 'lucide-react';
import './NotificationsModal.css';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const mockNotifications = [
    { id: 1, type: 'like', text: 'Айгерим лайкнула ваш пульс', time: '2 м. назад', icon: <Heart size={16} fill="var(--primary-color)" color="var(--primary-color)" /> },
    { id: 2, type: 'follow', text: 'Максат подписался на вас', time: '1 ч. назад', icon: <UserPlus size={16} color="#00D1FF" /> },
    { id: 3, type: 'comment', text: 'Алина оставила комментарий: "Супер!"', time: '3 ч. назад', icon: <MessageCircle size={16} color="#00FF88" /> },
    { id: 4, type: 'like', text: 'Данияр лайкнул ваш пульс', time: 'Вчера', icon: <Heart size={16} fill="var(--primary-color)" color="var(--primary-color)" /> },
    { id: 5, type: 'system', text: 'Добро пожаловать в Pulse! Заполните ваш профиль.', time: '2 д. назад', icon: <span style={{fontSize: '16px'}}>👋</span> },
];

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

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
                        {mockNotifications.map(notif => (
                            <div key={notif.id} className="notif-item">
                                <div className="notif-icon-wrapper">
                                    {notif.icon}
                                </div>
                                <div className="notif-body">
                                    <span className="notif-text">{notif.text}</span>
                                    <span className="notif-time">{notif.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
