import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';
import { usePulseStore } from '../store/useStore';
import './ConnectionsSheet.css';

interface ConnectionsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

export const ConnectionsSheet: React.FC<ConnectionsSheetProps> = ({ isOpen, onClose, userId, type }) => {
    const { followingIds, followUser, unfollowUser, fetchFollowers, fetchFollowing, setViewingUserId } = usePulseStore();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            setIsLoading(true);
            try {
                const results = type === 'followers' 
                    ? await fetchFollowers(userId) 
                    : await fetchFollowing(userId);
                setUsers(results);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen && userId) {
            loadUsers();
        }
    }, [isOpen, userId, type, fetchFollowers, fetchFollowing]);

    const handleUserClick = (targetUid: string) => {
        setViewingUserId(targetUid);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        className="connections-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div 
                        className="connections-sheet glass"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <header className="connections-header">
                            <div className="drag-handle" />
                            <h3>{type === 'followers' ? 'Подписчики' : 'Подписки'}</h3>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </header>

                        <div className="connections-list">
                            {isLoading ? (
                                <div className="loading-connections">Загрузка...</div>
                            ) : users.length === 0 ? (
                                <div className="empty-connections">
                                    {type === 'followers' ? 'У пользователя пока нет подписчиков' : 'Пользователь ни на кого не подписан'}
                                </div>
                            ) : (
                                users.map(user => (
                                    <div key={user.id} className="connection-item" onClick={() => handleUserClick(user.id)}>
                                        <div className="connection-avatar">
                                            {user.photoURL ? <img src={user.photoURL} alt="" /> : <div className="avatar-placeholder"><User size={20} /></div>}
                                        </div>
                                        <div className="connection-info">
                                            <span className="username">@{user.username}</span>
                                            <span className="display-name">{user.displayName || user.username}</span>
                                        </div>
                                        <button 
                                            className={`follow-mini-btn ${followingIds.includes(user.id) ? 'following' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                followingIds.includes(user.id) ? unfollowUser(user.id) : followUser(user.id);
                                            }}
                                        >
                                            {followingIds.includes(user.id) ? 'Подписки' : 'Подписаться'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
