import React, { useState, useEffect } from 'react';
import { Search, User, UserPlus, UserCheck, Loader2, Bell, MapPin, Heart, MessageCircle, MoreHorizontal, Share2, Repeat } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCommentsModal } from '../feed/PostCommentsModal';
import { StoryViewer } from '../feed/StoryViewer';
import { NotificationsModal } from './NotificationsModal';
import { CreatorBadge } from '../../components/CreatorBadge';
import { ShareSheet } from '../../components/ShareSheet';
import './ExploreView.css';

interface ExploreViewProps {
    onViewProfile: (uid: string) => void;
    onViewMap?: () => void;
}

const ANON_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

const AutoPlayMedia: React.FC<{ post: any }> = ({ post }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        videoRef.current?.play().catch(() => {});
                        audioRef.current?.play().catch(() => {});
                    } else {
                        videoRef.current?.pause();
                        audioRef.current?.pause();
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const isVideo = post.mediaUrl?.includes('/video/upload/');

    return (
        <div ref={containerRef} className="post-media-container">
            {post.mediaUrl ? (
                isVideo ? (
                    <video 
                        ref={videoRef} 
                        src={post.mediaUrl} 
                        className="post-media" 
                        playsInline 
                        loop 
                        muted={post.muteVideoAudio ?? false} // Respect user preference
                    />
                ) : (
                    <img src={post.mediaUrl} className="post-media" alt="" />
                )
            ) : (
                <div className="post-text-content" style={{ background: post.color || '#222' }}>
                    <p>{post.desc}</p>
                </div>
            )}
            {post.audioUrl && <audio ref={audioRef} src={post.audioUrl} loop />}
        </div>
    );
};

export const ExploreView: React.FC<ExploreViewProps> = ({ onViewProfile, onViewMap }) => {
    const { searchUsers, followUser, unfollowUser, followingIds, posts, likePost, repostPost, notifications } = usePulseStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'following' | 'near' | 'interests'>('near');
    const [commentPostId, setCommentPostId] = useState<string | null>(null);
    const [sharePostId, setSharePostId] = useState<string | null>(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

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

    // Filter posts for recommendation (non-anon and privacy rules)
    const recommendedPosts = posts.filter(p => {
        const myId = auth.currentUser?.uid;
        
        // Basic privacy logic applies to both anon and non-anon
        if (p.privacy === 'friends') {
            if (p.userId === myId) return true;
            return followingIds.includes(p.userId || '');
        }
        if (p.privacy === 'private') {
            return p.userId === myId;
        }
        
        return true; // public
    });
    
    // Curated trending stories:
    // 1. Filter out anonymous posts (to show real creators)
    // 2. Filter posts with media
    // 3. Ensure unique users (one story per person)
    // 4. Sort by likesCount (popular first) then timestamp
    const trendingStories = React.useMemo(() => {
        const uniqueUsers = new Set();
        return recommendedPosts
            .filter(p => !p.isAnonymous && p.mediaUrl)
            .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0) || (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
            .filter(p => {
                if (uniqueUsers.has(p.userId)) return false;
                uniqueUsers.add(p.userId);
                return true;
            })
            .slice(0, 10); // Show up to 10 unique top creators
    }, [recommendedPosts]);

    const formatTime = (ts: any) => {
        if (!ts) return 'Только что';
        const ms = ts.seconds ? ts.seconds * 1000 : (typeof ts === 'number' ? ts : (ts.toMillis ? ts.toMillis() : Date.now()));
        const diff = Date.now() - ms;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) {
            const mins = Math.floor(diff / (1000 * 60));
            if (mins < 1) return 'Только что';
            return `${mins} м. назад`;
        }
        if (hours < 24) return `${hours} ч. назад`;
        return `${Math.floor(hours/24)} д. назад`;
    };

    // Filter posts based on active tab
    const displayedPosts = recommendedPosts.filter(post => {
        if (post.isRepost) return false; // Never show duplicate repost docs

        if (activeTab === 'following') {
            const isFromFollowing = followingIds.includes(post.userId || '');
            const isRepostedByFollowing = post.repostedBy?.some((uid: string) => followingIds.includes(uid));
            return isFromFollowing || isRepostedByFollowing;
        }
        if (activeTab === 'near') {
            return !!(post.location || post.city);
        }
        // interests
        return true;
    });

    // Function to get repost attribution text
    const getRepostAttribution = (post: any) => {
        if (!post.repostedBy) return null;
        const followedReposters = post.repostedBy.filter((uid: string) => followingIds.includes(uid));
        if (followedReposters.length === 0) return null;
        
        // This is a bit simplified - ideally we'd have names, but for now we'll say 'Друг' or similar
        return "Ваши подписки репостнули";
    };

    return (
        <div className="explore-view">
            <header className="explore-header">
                <div className="header-top-row">
                    <div className="header-title">Pulse</div>
                    <div className="header-actions">
                        <button className="action-btn" onClick={() => setIsNotifOpen(true)}>
                            <Bell size={24} />
                            {unreadCount > 0 && <div className="notification-dot">{unreadCount}</div>}
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
                                    <span className="see-all" onClick={() => alert("Все истории временно отображаются в ленте ниже.")}>Все</span>
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
                                                <img 
                                                    src={story.isAnonymous ? ANON_AVATAR : (story.userAvatar || '/default-avatar.png')} 
                                                    className="story-avatar" 
                                                    alt="" 
                                                />
                                                <span className="story-username">{story.isAnonymous ? 'Аноним' : story.user}</span>
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
                                        {getRepostAttribution(post) && (
                                            <div className="repost-header">
                                                <Repeat size={14} />
                                                <span>{getRepostAttribution(post)}</span>
                                            </div>
                                        )}
                                        <div className="post-card-header">
                                            <div className="post-user-info" onClick={() => !post.isAnonymous && onViewProfile(post.userId || '')}>
                                                <img 
                                                    src={post.isAnonymous ? ANON_AVATAR : (post.userAvatar || '/default-avatar.png')} 
                                                    className={`post-avatar ${post.isAnonymous ? 'anon-avatar' : ''}`} 
                                                    alt="" 
                                                />
                                                <div className="post-user-details">
                                                    <span className="post-display-name">
                                                        {post.isAnonymous ? 'Аноним' : post.user}
                                                        {!post.isAnonymous && <CreatorBadge username={post.userUsername} size={18} />}
                                                        {!post.isAnonymous && post.likesCount > 100 && !post.userUsername?.toLowerCase().startsWith('dplus01') && <span style={{color:'var(--primary-color)'}}>✓</span>}
                                                    </span>
                                                    <span className="post-meta">
                                                        {post.location || post.city || 'Город'} • {formatTime(post.timestamp)}
                                                        {post.audioName && <span> • 🎵 {post.audioName}</span>}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="action-btn" onClick={() => alert("Опции поста:\n- Скопировать ссылку\n- Пожаловаться")}>
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>

                                        <AutoPlayMedia post={post} />

                                        <div className="post-card-footer">
                                            {post.mediaUrl && (
                                                <div className="post-description">
                                                    <strong>{post.isAnonymous ? 'Аноним' : post.user}</strong> {post.desc}
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
                                                    <button className="post-action-btn" onClick={() => setSharePostId(post.id)}>
                                                        <Share2 size={20} />
                                                    </button>
                                                    <button className="post-action-btn" onClick={() => repostPost(post.id)}>
                                                        <Repeat size={20} />
                                                        <span>{post.repostCount || 0}</span>
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

                <ShareSheet 
                    isOpen={!!sharePostId} 
                    onClose={() => setSharePostId(null)} 
                    postId={sharePostId || ''} 
                />
            </div>
        </div>
    );
};

