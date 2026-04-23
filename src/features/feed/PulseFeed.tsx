import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Music, MapPin, Repeat, Volume2, VolumeX } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import type { Post } from '../../types';
import { auth } from '../../lib/firebase';
import { ThreadPost } from './ThreadPost';
import { ShareSheet } from '../../components/ShareSheet';
import { CommentsSheet } from '../../components/CommentsSheet';
import './PulseFeed.css';

interface PulseFeedProps {
    posts: Post[];
    onViewProfile?: (uid: string) => void;
}

const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

type FeedType = 'following' | 'recommend' | 'anon';

export const PulseFeed: React.FC<PulseFeedProps> = ({ posts, onViewProfile }) => {
    const { likePost, followingIds } = usePulseStore();
    const [feedType, setFeedType] = useState<FeedType>('recommend');
    const [sharePostId, setSharePostId] = useState<string | null>(null);
    const [commentPostId, setCommentPostId] = useState<string | null>(null);
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const feedRef = useRef<HTMLDivElement>(null);

    const filteredPosts = posts.filter(post => {
        if (feedType === 'anon') return post.isAnonymous;
        if (feedType === 'following') return !post.isAnonymous && followingIds.includes(post.userId || '');
        return !post.isAnonymous;
    });

    // Set up Intersection Observer for auto-play
    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const postId = entry.target.getAttribute('data-post-id');
                    setActivePostId(postId);
                }
            });
        }, {
            threshold: 0.7, // Must be 70% visible to count as "active"
            rootMargin: '0px'
        });

        return () => observerRef.current?.disconnect();
    }, []);

    // Observe all feed items
    useEffect(() => {
        const items = document.querySelectorAll('.feed-item');
        items.forEach(item => observerRef.current?.observe(item));
    }, [filteredPosts, feedType]);

    // Handle audio playback for active post
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }

        const activePost = filteredPosts.find(p => p.id === activePostId);
        
        if (activePost?.audioUrl && !isMuted) {
            audioRef.current.src = activePost.audioUrl;
            audioRef.current.play().catch(e => console.log("Audio play blocked by browser", e));
        } else {
            audioRef.current.pause();
        }

        // Also handle video playback sync
        const videos = document.querySelectorAll('video.post-media-bg');
        videos.forEach(v => {
            const video = v as HTMLVideoElement;
            const parent = video.closest('.feed-item');
            if (parent?.getAttribute('data-post-id') === activePostId) {
                video.muted = isMuted;
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });

    }, [activePostId, isMuted, filteredPosts]);

    return (
        <div className="feed-container" ref={feedRef}>
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
                <button className="mute-toggle glass" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
            </div>

            <div className={`feed-scroll-content ${feedType === 'anon' ? 'threads-layout' : 'full-layout'}`}>
                {filteredPosts.length === 0 ? (
                    <div className="empty-feed">
                        <div className="empty-icon">{feedType === 'anon' ? '👻' : '📱'}</div>
                        <p>{feedType === 'anon' ? 'Анонимных пульсов пока нет. Будь первым!' : 'Нет новых публикаций. Будьте первым!'}</p>
                    </div>
                ) : (
                    <div className="feed-scroll-container">
                    {(filteredPosts || []).map((post) => (
                        feedType === 'anon' ? (
                            <ThreadPost key={post.id} post={post} />
                        ) : (
                            <div 
                                key={post.id} 
                                className="feed-item" 
                                style={{ background: post.color }}
                                data-post-id={post.id}
                            >
                                {post.mediaUrl && (
                                    post.mediaUrl.includes('/video/upload/') ? (
                                        <video 
                                            src={post.mediaUrl} 
                                            className="post-media-bg" 
                                            loop 
                                            muted={isMuted}
                                            playsInline 
                                        />
                                    ) : (
                                        <img src={post.mediaUrl} className="post-media-bg" alt="Post content" />
                                    )
                                )}
                                {post.repostedByNames && post.repostedByNames.length > 0 && (
                                    <div className="repost-header-tag glass">
                                        <Repeat size={14} color="#ffcc00" />
                                        <span>{post.repostedByNames[0]} репостнул(а)</span>
                                    </div>
                                )}
                                <div className="feed-overlay">
                                    <div className="post-info">
                                        <div className="post-header-author" onClick={() => post.userId && onViewProfile?.(post.userId)}>
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
                                                <span>{post.audioName || `Оригинальный звук — ${post.user || 'Pulse'}`} — </span>
                                                <span>{post.audioName || `Оригинальный звук — ${post.user || 'Pulse'}`}</span>
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
                                        <div className="action-item" onClick={() => setCommentPostId(post.id)}>
                                            <div className="icon-circle glass">
                                                <MessageCircle size={28} />
                                            </div>
                                            <span>{post.commentsCount || 0}</span>
                                        </div>
                                        <div className="action-item" onClick={() => setSharePostId(post.id)}>
                                            <div className="icon-circle glass">
                                                <Share2 size={28} />
                                            </div>
                                            <span>Поделиться</span>
                                        </div>
                                        <div className="action-item" onClick={() => alert('Опции пульса')}>
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

            <ShareSheet 
                isOpen={!!sharePostId} 
                onClose={() => setSharePostId(null)} 
                postId={sharePostId || ''} 
            />

            <CommentsSheet
                isOpen={!!commentPostId}
                onClose={() => setCommentPostId(null)}
                postId={commentPostId || ''}
            />
        </div>
    );
};
