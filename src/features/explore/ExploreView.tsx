import React, { useState, useEffect } from 'react';
import { Search, User, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { PulseFeed } from '../feed/PulseFeed';
import { motion, AnimatePresence } from 'framer-motion';
import './ExploreView.css';

interface ExploreViewProps {
    onViewProfile: (uid: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onViewProfile }) => {
    const { searchUsers, followUser, unfollowUser, followingIds, posts } = usePulseStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchUsers(searchQuery);
            setSearchResults(results);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchUsers]);

    const handleFollowToggle = async (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        if (followingIds.includes(userId)) {
            await unfollowUser(userId);
        } else {
            await followUser(userId);
        }
    };

    return (
        <div className="explore-view">
            <header className="explore-header glass">
                <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Поиск людей в Pulse..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className="explore-content">
                <AnimatePresence mode="wait">
                    {searchQuery ? (
                        <motion.div 
                            key="search-results"
                            className="search-results-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {isSearching ? (
                                <div className="explore-loading">
                                    <Loader2 className="spin" size={32} />
                                </div>
                            ) : (searchResults || []).length > 0 ? (
                                (searchResults || []).map(user => (
                                    <div 
                                        key={user.id} 
                                        className="user-search-card glass"
                                        onClick={() => onViewProfile(user.id)}
                                    >
                                        <div className="user-info-main">
                                            <div className="user-avatar-small">
                                                {user.photoURL ? <img src={user.photoURL} alt="" /> : <div className="avatar-placeholder"><User size={20} /></div>}
                                            </div>
                                            <div className="user-names">
                                                <span className="display-name">{user.displayName || user.username}</span>
                                                <span className="username">@{user.username}</span>
                                            </div>
                                        </div>
                                        <button 
                                            className={`follow-btn-mini ${followingIds.includes(user.id) ? 'following' : ''}`}
                                            onClick={(e) => handleFollowToggle(e, user.id)}
                                        >
                                            {followingIds.includes(user.id) ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="no-results">Пользователей не найдено</div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="trending-feed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="explore-section-title">В тренде</div>
                            <PulseFeed posts={posts} onViewProfile={onViewProfile} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
