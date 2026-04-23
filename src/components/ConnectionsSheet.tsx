import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, UserPlus, UserCheck } from 'lucide-react';
import { usePulseStore } from '../store/useStore';
import './ConnectionsSheet.css';

interface ConnectionsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

export const ConnectionsSheet: React.FC<ConnectionsSheetProps> = ({ isOpen, onClose, userId, type }) => {
    const { fetchUserProfile, followingIds, followUser, unfollowUser } = usePulseStore();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadUsers();
        }
    }, [isOpen, userId, type]);

    const loadUsers = async () => {
        setIsLoading(true);
        // In a real app, we'd fetch the actual list from Firestore.
        // For now, let's simulate or fetch a few to show the UI.
        // We'll need a way to get the actual list of IDs first.
        // Since we don't have a "fetchFollowers" function yet, we'll use a placeholder
        // or implement it in the store.
        
        // Simulating loading for now - we'll update the store to provide this data
        setTimeout(() => {
            setIsLoading(false);
        }, 800);
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
                            ) : (
                                <div className="empty-connections">
                                    {type === 'followers' ? 'У пользователя пока нет подписчиков' : 'Пользователь ни на кого не подписан'}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
