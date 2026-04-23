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
    const [activePostId, setActivePostId] = useState<string | null>(null);

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

    // Filter posts for recommendation (non-anon)
    const recommendedPosts = posts.filter(p => !p.isAnonymous);

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
                            key="discovery-grid"
                            className="discovery-grid-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="explore-section-title">В тренде</div>
                            <div className="discovery-grid">
                                {recommendedPosts.map((post) => (
                                    <div 
                                        key={post.id} 
                                        className="discovery-item"
                                        onClick={() => setActivePostId(post.id)}
                                    >
                                        {post.mediaUrl ? (
                                            post.mediaUrl.includes('/video/upload/') ? (
                                                <video src={post.mediaUrl} muted playsInline />
                                            ) : (
                                                <img src={post.mediaUrl} alt="" />
                                            )
                                        ) : (
                                            <div className="discovery-text-preview" style={{ background: post.color }}>
                                                <p>{post.desc}</p>
                                            </div>
                                        )}
                                        <div className="discovery-overlay">
                                            <span>❤️ {post.likesCount || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Immersive Feed Overlay */}
                <AnimatePresence>
                    {activePostId && (
                        <motion.div 
                            className="immersive-feed-overlay"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <PulseFeed 
                                posts={recommendedPosts} 
                                onViewProfile={onViewProfile} 
                                onClose={() => setActivePostId(null)}
                                initialPostId={activePostId}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
