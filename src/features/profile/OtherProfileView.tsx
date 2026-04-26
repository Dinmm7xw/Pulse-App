import React, { useState, useEffect } from 'react';
import { ChevronLeft, Grid, Shield, Heart, MessageCircle, X, UserPlus, UserCheck, MessageSquare, Share2 } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectionsSheet } from '../../components/ConnectionsSheet';
import { ShareSheet } from '../../components/ShareSheet';
import { CommentsSheet } from '../../components/CommentsSheet';
import type { Post, UserProfile } from '../../types';
import { CreatorBadge } from '../../components/CreatorBadge';
import './OtherProfileView.css';

interface OtherProfileViewProps {
    uid: string;
    onClose: () => void;
}

export const OtherProfileView: React.FC<OtherProfileViewProps> = ({ uid, onClose }) => {
    const { fetchUserProfile, fetchUserPosts, followUser, unfollowUser, followingIds, createDirectChat, likePost, setActiveTab, setActiveChatId, setViewingUserId } = usePulseStore();
    const [profile, setProfile] = useState<(UserProfile & { id: string }) | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profileTab, setProfileTab] = useState<'grid' | 'anonymous'>('grid');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [connectionsModal, setConnectionsModal] = useState<{isOpen: boolean, type: 'followers' | 'following'}>({isOpen: false, type: 'followers'});
    const [commentPostId, setCommentPostId] = useState<string | null>(null);
    const [sharePostId, setSharePostId] = useState<string | null>(null);

    const audioInstanceRef = React.useRef<HTMLAudioElement | null>(null);
    const [nowPlayingName, setNowPlayingName] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const userProfile = await fetchUserProfile(uid);
            const userPosts = await fetchUserPosts(uid);
            setProfile(userProfile as any);
            setPosts(userPosts);
            setIsLoading(false);

            // Autoplay profile music if set
            if ((userProfile as any)?.profileMusicUrl) {
                const audio = new Audio((userProfile as any).profileMusicUrl);
                audio.volume = 0.4;
                audio.loop = true;
                audio.play().catch(() => {});
                audioInstanceRef.current = audio;
                setNowPlayingName((userProfile as any)?.profileMusicName || '🎵 Трек');
            }
        };
        loadData();

        return () => {
            audioInstanceRef.current?.pause();
            audioInstanceRef.current = null;
            setNowPlayingName(null);
        };
    }, [uid, fetchUserProfile, fetchUserPosts]);

    const isFollowing = followingIds.includes(uid);

    const handleFollow = async () => {
        if (isFollowing) {
            await unfollowUser(uid);
        } else {
            await followUser(uid);
        }
    };

    const handleMessage = async () => {
        if (profile) {
            const chat = await createDirectChat(profile.id, profile.displayName || profile.username, profile.photoURL || '');
            if (chat) {
                setActiveTab('chats');
                setActiveChatId(chat.id);
                setViewingUserId(null);
                onClose();
            }
        }
    };

    if (isLoading) {
        return (
            <div className="other-profile-overlay glass">
                <div className="loading-state">Загрузка профиля...</div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <motion.div 
            className="other-profile-overlay glass"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
            <header className="other-header">
                <button className="icon-btn" onClick={onClose}><ChevronLeft size={24} /></button>
                <h3>@{profile.username}</h3>
                <div style={{ width: 40 }} />
            </header>

            {nowPlayingName && (
                <div style={{
                    background: 'linear-gradient(90deg, rgba(112,0,255,0.2), rgba(112,0,255,0.05))',
                    borderBottom: '1px solid rgba(112,0,255,0.2)',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px'
                }}>
                    <span style={{animation: 'pulse 1.5s infinite', display:'inline-block'}}>🎵</span>
                    <span style={{opacity:0.9}}>{nowPlayingName}</span>
                    <button
                        onClick={() => { audioInstanceRef.current?.pause(); setNowPlayingName(null); }}
                        style={{marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'16px'}}
                    >✕</button>
                </div>
            )}

            <div className="other-profile-scroll">
                <div className="profile-main-info">
                    <div className="profile-avatar-row">
                        <div className="insta-avatar-outer">
                            <div className="insta-avatar-inner">
                                {profile.photoURL ? <img src={profile.photoURL} alt="" /> : <div className="avatar-placeholder-big">?</div>}
                            </div>
                        </div>
                        
                        <div className="insta-stats">
                            <div className="stat-box">
                                <span className="count">{(posts || []).length}</span>
                                <span className="label">Посты</span>
                            </div>
                            <div className="stat-box" onClick={() => setConnectionsModal({isOpen: true, type: 'followers'})}>
                                <span className="count">{profile.followersCount || 0}</span>
                                <span className="label">Подписчики</span>
                            </div>
                            <div className="stat-box" onClick={() => setConnectionsModal({isOpen: true, type: 'following'})}>
                                <span className="count">{profile.followingCount || 0}</span>
                                <span className="label">Подписки</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-bio">
                        <span className="full-name" style={{display:'flex', alignItems:'center', gap:'6px'}}>
                            {profile.displayName || profile.username}
                            <CreatorBadge username={profile.username} size={22} />
                        </span>
                        <p>{profile.bio || 'Пользователь Pulse'}</p>
                    </div>

                    <div className="profile-actions-row">
                        <button className={`insta-btn ${isFollowing ? 'following' : 'primary'}`} onClick={handleFollow}>
                            {isFollowing ? <><UserCheck size={18} /> Подписки</> : <><UserPlus size={18} /> Подписаться</>}
                        </button>
                        <button className="insta-btn secondary" onClick={handleMessage}>
                            <MessageSquare size={18} /> Сообщение
                        </button>
                    </div>
                </div>

                <div className="insta-tabs">
                    <div className={`insta-tab ${profileTab === 'grid' ? 'active' : ''}`} onClick={() => setProfileTab('grid')}>
                        <Grid size={20} />
                    </div>
                    <div className={`insta-tab ${profileTab === 'anonymous' ? 'active' : ''}`} onClick={() => setProfileTab('anonymous')}>
                        <Shield size={20} />
                    </div>
                </div>

                <div className="insta-post-grid">
                    {(posts || []).length === 0 ? (
                        <div className="empty-grid">У пользователя нет публичных постов</div>
                    ) : (
                        (posts || []).map(post => (
                            <div 
                                key={post.id} 
                                className="grid-item" 
                                onClick={() => setSelectedPost(post)}
                            >
                                {post.mediaUrl ? (
                                    <img src={post.mediaUrl} alt="" loading="lazy" />
                                ) : (
                                    <div className="grid-text-preview" style={{ background: post.color }}>
                                        <p>{post.desc}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedPost && (
                    <motion.div 
                        className="post-detail-overlay glass"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setSelectedPost(null)}
                    >
                        <div className="post-detail-modal-modern glass" onClick={e => e.stopPropagation()}>
                            <div className="detail-header">
                                <button className="icon-btn" onClick={() => setSelectedPost(null)}><X size={24} /></button>
                                <h3>Публикация</h3>
                                <div style={{ width: 40 }} />
                            </div>
                            <div className="detail-content">
                                <div className="detail-media-wrap">
                                    {selectedPost.mediaUrl ? (
                                        selectedPost.mediaUrl.includes('/video/upload/') ? (
                                            <video src={selectedPost.mediaUrl} controls autoPlay loop />
                                        ) : (
                                            <img src={selectedPost.mediaUrl} alt="" className="detail-img" />
                                        )
                                    ) : (
                                        <div className="detail-text" style={{ background: selectedPost.color }}>
                                            <p>{selectedPost.desc}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="detail-actions">
                                    <div className="action-btn" onClick={() => likePost(selectedPost.id)}>
                                        <Heart size={24} color={(selectedPost.likedBy || []).includes(auth.currentUser?.uid) ? "#ff4d56" : "white"} fill={(selectedPost.likedBy || []).includes(auth.currentUser?.uid) ? "#ff4d56" : "none"} /> 
                                        <span>{selectedPost.likesCount || 0}</span>
                                    </div>
                                    <div className="action-btn" onClick={() => setCommentPostId(selectedPost.id)}>
                                        <MessageCircle size={24} /> 
                                        <span>{selectedPost.commentsCount || 0}</span>
                                    </div>
                                    <div className="action-btn" onClick={() => setSharePostId(selectedPost.id)}>
                                        <Share2 size={24} />
                                        <span>Share</span>
                                    </div>
                                </div>
                                <div className="detail-info">
                                    <p><strong>{profile.username}</strong> {selectedPost.desc}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            <ConnectionsSheet 
                isOpen={connectionsModal.isOpen}
                type={connectionsModal.type}
                userId={uid}
                onClose={() => setConnectionsModal({...connectionsModal, isOpen: false})}
            />
        </motion.div>
    );
};
