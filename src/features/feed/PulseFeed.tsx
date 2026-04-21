import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Music, MapPin } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import type { Post } from '../../types';
import { auth } from '../../lib/firebase';
import { ThreadPost } from './ThreadPost';
import './PulseFeed.css';

interface PulseFeedProps {
    posts: Post[];
}

interface PulseFeedProps {
    posts: Post[];
}

const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

type FeedType = 'following' | 'recommend' | 'anon';

export const PulseFeed: React.FC<PulseFeedProps> = ({ posts }) => {
    const { likePost } = usePulseStore();
    const [feedType, setFeedType] = useState<FeedType>('recommend');

    const filteredPosts = posts.filter(post => {
        if (feedType === 'anon') return post.isAnonymous;
        return !post.isAnonymous;
    });

    return (
        <div className="feed-container">
            <div className="feed-header-tabs glass">
                <span
                    className={feedType === 'following' ? 'active' : ''}
                    onClick={() => setFeedType('following')}
                >
                    Подписки
                </span>
                <span
                    className={feedType === 'recommend' ? 'active' : ''}
                    onClick={() => setFeedType('recommend')}
                >
                    Для вас
                </span>
                <span
                    className={feedType === 'anon' ? 'active' : ''}
                    onClick={() => setFeedType('anon')}
                >
                    Анон
                </span>
            </div>

            <div className={`feed-scroll-content ${feedType === 'anon' ? 'threads-layout' : 'full-layout'}`}>
                {filteredPosts.length === 0 ? (
                    <div className="empty-feed">
                        <div className="empty-icon">{feedType === 'anon' ? '👻' : '📱'}</div>
                        <p>{feedType === 'anon' ? 'Анонимных пульсов пока нет. Будь первым!' : 'Нет новых публикаций. Будьте первым!'}</p>
                    </div>
                ) : (
                    filteredPosts.map((post) => (
                        feedType === 'anon' ? (
                            <ThreadPost key={post.id} post={post} />
                        ) : (
                            <div key={post.id} className="feed-item" style={{ background: post.color }}>
                                {post.mediaUrl && (
                                    post.mediaUrl.includes('/video/upload/') ? (
                                        <video 
                                            src={post.mediaUrl} 
                                            className="post-media-bg" 
                                            autoPlay 
                                            loop 
                                            muted 
                                            playsInline 
                                        />
                                    ) : (
                                        <img src={post.mediaUrl} className="post-media-bg" alt="Post content" />
                                    )
                                )}
                                <div className="feed-overlay">
                                    <div className="post-info">
                                        <div className="post-header-author">
                                            <img src={post.userAvatar || NEUTRAL_AVATAR} className="author-avatar-small" alt="" />
                                            <h3>{post.user || 'Анонимный пользователь'}</h3>
                                        </div>
                                        <p>{post.desc}</p>
                                        <div className="location-tag glass">
                                            <MapPin size={12} />
                                            <span>{post.city || post.location || 'Алматы'}</span>
                                        </div>
                                        <div className="music-info">
                                            <Music size={14} />
                                            <div className="music-scroll">
                                                <span>Оригинальный звук — {post.user || 'Pulse'} — </span>
                                                <span>Оригинальный звук — {post.user || 'Pulse'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="post-actions">
                                        <div className="action-item" onClick={() => likePost(post.id)}>
                                            <div className={`icon-circle glass ${post.likedBy?.includes(auth.currentUser?.uid || '') ? 'liked' : ''}`}>
                                                <Heart size={28} fill={post.likedBy?.includes(auth.currentUser?.uid || '') ? "#ff4d56" : "none"} color={post.likedBy?.includes(auth.currentUser?.uid || '') ? "#ff4d56" : "white"} />
                                            </div>
                                            <span>{post.likesCount || 0}</span>
                                        </div>
                                        <div className="action-item">
                                            <div className="icon-circle glass">
                                                <MessageCircle size={28} />
                                            </div>
                                            <span>{post.commentsCount || 0}</span>
                                        </div>
                                        <div className="action-item">
                                            <div className="icon-circle glass">
                                                <Share2 size={28} />
                                            </div>
                                            <span>Поделиться</span>
                                        </div>
                                        <div className="action-item">
                                            <div className="icon-circle glass">
                                                <MoreVertical size={28} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>
        </div>
    );
};
