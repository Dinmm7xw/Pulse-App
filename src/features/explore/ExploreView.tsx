import React, { useState, useEffect } from 'react';
import { Search, User, UserPlus, UserCheck, Loader2, Bell, MapPin, Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCommentsModal } from '../feed/PostCommentsModal';
import { StoryViewer } from './StoryViewer';
import { NotificationsModal } from './NotificationsModal';
import './ExploreView.css';

interface ExploreViewProps {
    onViewProfile: (uid: string) => void;
    onViewMap?: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onViewProfile, onViewMap }) => {
    const { searchUsers, followUser, unfollowUser, followingIds, posts, likePost } = usePulseStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'following' | 'near' | 'interests'>('near');
    const [commentPostId, setCommentPostId] = useState<string | null>(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

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

    const handleLike = async (postId: string) => {
        await likePost(postId);
    };

    // Filter posts for recommendation (non-anon)
    const recommendedPosts = posts.filter(p => !p.isAnonymous);
    
    // Fake trending stories from posts with media
    const trendingStories = recommendedPosts.filter(p => p.mediaUrl).slice(0, 6);

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Только что';
        if (hours < 24) return `${hours} ч. назад`;
        return `${Math.floor(hours/24)} д. назад`;
    };

    // Filter posts based on active tab
    const displayedPosts = recommendedPosts.filter(post => {
        if (activeTab === 'following') {
            return followingIds.includes(post.userId || '');
        }
        if (activeTab === 'near') {
            return !!(post.location || post.city);
        }
        // interests
        return true;
    });

    return (
        <div className="explore-view">
            <header className="explore-header">
                <div className="header-top-row">
                    <div className="header-title">Pulse</div>
                    <div className="header-actions">
                        <button className="action-btn" onClick={() => setIsNotifOpen(true)}>
                            <Bell size={24} />
                            <div className="notification-dot"></div>
                        </button>
                    </div>
                </div>
                
                <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Ищете что-то?..." 
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
                                        className="user-search-card"
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
                            key="main-feed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Trending Stories */}
                            <div className="trending-section">
                                <div className="section-header">
                                    <h3>✨ В тренде</h3>
                                    <span className="see-all">Все</span>
                                </div>
                                <div className="trending-scroll">
                                    {trendingStories.map((story, idx) => (
                                        <div className="story-card" key={`story-${story.id}`} onClick={() => setActiveStoryIndex(idx)}>
                                            {story.mediaUrl?.includes('/video/upload/') ? (
                                                <video src={story.mediaUrl} className="story-media" muted playsInline />
                                            ) : (
                                                <img src={story.mediaUrl} className="story-media" alt="" />
                                            )}
                                            <div className="story-overlay">
                                                <img src={story.userAvatar || '/default-avatar.png'} className="story-avatar" alt="" />
                                                <span className="story-username">{story.user}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {trendingStories.length === 0 && (
                                        <div className="no-results" style={{padding: '20px'}}>Пока нет историй</div>
                                    )}
                                </div>
                            </div>

                            {/* Feed Tabs */}
                            <div className="feed-tabs">
                                <button 
                                    className={`feed-tab ${activeTab === 'following' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('following')}
                                >
                                    Подписки
                                </button>
                                <button 
                                    className={`feed-tab ${activeTab === 'near' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('near')}
                                >
                                    Рядом
                                </button>
                                <button 
                                    className={`feed-tab ${activeTab === 'interests' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('interests')}
                                >
                                    Интересное
                                </button>
                            </div>

                            {/* Classic Feed Cards */}
                            <div className="classic-feed-container">
                                {displayedPosts.length === 0 && (
                                    <div className="no-results">Здесь пока ничего нет. Подпишитесь на кого-нибудь!</div>
                                )}
                                {displayedPosts.map(post => (
                                    <div className="post-card" key={`feed-${post.id}`}>
                                        <div className="post-card-header">
                                            <div className="post-user-info" onClick={() => onViewProfile(post.userId || '')}>
                                                <img src={post.userAvatar || '/default-avatar.png'} className="post-avatar" alt="" />
                                                <div className="post-user-details">
                                                    <span className="post-display-name">
                                                        {post.user}
                                                        {post.likesCount > 100 && <span style={{color:'var(--primary-color)'}}>✓</span>}
                                                    </span>
                                                    <span className="post-meta">{post.location || post.city || 'Город'} • {formatTime(post.timestamp)}</span>
                                                </div>
                                            </div>
                                            <button className="action-btn">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>

                                        <div className="post-media-container">
                                            {post.mediaUrl ? (
                                                post.mediaUrl.includes('/video/upload/') ? (
                                                    <video src={post.mediaUrl} className="post-media" controls playsInline />
                                                ) : (
                                                    <img src={post.mediaUrl} className="post-media" alt="" />
                                                )
                                            ) : (
                                                <div className="post-text-content" style={{ background: post.color || '#222' }}>
                                                    <p>{post.desc}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="post-card-footer">
                                            {post.mediaUrl && (
                                                <div className="post-description">
                                                    <strong>{post.user}</strong> {post.desc}
                                                </div>
                                            )}
                                            
                                            <div className="post-tags">
                                                <span className="post-tag">#{post.location || post.city || 'Pulse'}</span>
                                                {post.likesCount > 50 && <span className="post-tag">#Популярное</span>}
                                            </div>

                                            <div className="post-actions-row">
                                                <div style={{display: 'flex', gap: '15px'}}>
                                                    <button className="post-action-btn" onClick={() => handleLike(post.id)}>
                                                        <Heart size={20} />
                                                        <span>{post.likesCount || 0}</span>
                                                    </button>
                                                    <button className="post-action-btn" onClick={() => setCommentPostId(post.id)}>
                                                        <MessageCircle size={20} />
                                                        <span>{post.commentsCount || 0}</span>
                                                    </button>
                                                </div>
                                                <button className="post-view-map-btn" onClick={() => onViewMap && onViewMap()}>
                                                    <MapPin size={14} style={{marginRight: '4px'}} />
                                                    На карте
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <PostCommentsModal 
                    postId={commentPostId} 
                    onClose={() => setCommentPostId(null)} 
                />

                {activeStoryIndex !== null && (
                    <StoryViewer 
                        stories={trendingStories} 
                        initialIndex={activeStoryIndex} 
                        onClose={() => setActiveStoryIndex(null)} 
                    />
                )}

                <NotificationsModal 
                    isOpen={isNotifOpen} 
                    onClose={() => setIsNotifOpen(false)} 
                />
            </div>
        </div>
    );
};

