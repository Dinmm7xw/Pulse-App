import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Grid, Shield, Heart, MessageCircle, X, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { ConnectionsSheet } from '../../components/ConnectionsSheet';
import type { Post, UserProfile } from '../../types';
import './OtherProfileView.css';

interface OtherProfileViewProps {
    uid: string;
    onClose: () => void;
}

export const OtherProfileView: React.FC<OtherProfileViewProps> = ({ uid, onClose }) => {
    const { fetchUserProfile, fetchUserPosts, followUser, unfollowUser, followingIds, createDirectChat } = usePulseStore();
    const [profile, setProfile] = useState<(UserProfile & { id: string }) | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'grid' | 'anonymous'>('grid');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [connectionsModal, setConnectionsModal] = useState<{isOpen: boolean, type: 'followers' | 'following'}>({isOpen: false, type: 'followers'});

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const userProfile = await fetchUserProfile(uid);
            const userPosts = await fetchUserPosts(uid);
            setProfile(userProfile as any);
            setPosts(userPosts);
            setIsLoading(false);
        };
        loadData();
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
                // We'd ideally navigate to chats tab and select this chat.
                // For now, let's just close this view or alert.
                alert("Чат создан! Перейдите в раздел сообщений.");
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
                                <span className="count">{posts.length}</span>
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
                        <span className="full-name">{profile.displayName || profile.username}</span>
                        <p>{profile.bio || 'Пользователь Pulse'}</p>
                    </div>

                    <div className="profile-actions-row">
                        <button 
                            className={`insta-btn ${isFollowing ? 'secondary' : 'primary-pulse'}`}
                            onClick={handleFollow}
                        >
                            {isFollowing ? 'Отписаться' : 'Подписаться'}
                        </button>
                        <button className="insta-btn" onClick={handleMessage}>
                            <MessageSquare size={18} /> Сообщение
                        </button>
                    </div>
                </div>

                <div className="insta-tabs">
                    <div 
                        className={`insta-tab ${activeTab === 'grid' ? 'active' : ''}`}
                        onClick={() => setActiveTab('grid')}
                    >
                        <Grid size={22} />
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
                                style={{ background: post.color }}
                                onClick={() => setSelectedPost(post)}
                            >
                                {post.mediaUrl ? (
                                    <img src={post.mediaUrl} alt="" />
                                ) : (
                                    <div className="text-post-preview">
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
                        className="post-detail-overlay-other"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <div className="post-detail-modal glass">
                            <header className="post-modal-header">
                                <button className="close-post-btn" onClick={() => setSelectedPost(null)}><X size={24} /></button>
                                <h3>Публикация</h3>
                            </header>
                            <div className="post-detail-content">
                                {selectedPost.mediaUrl ? (
                                    <img src={selectedPost.mediaUrl} alt="" />
                                ) : (
                                    <div className="post-typography-card" style={{ background: selectedPost.color }}>
                                        <p>{selectedPost.desc}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConnectionsSheet 
                isOpen={connectionsModal.isOpen}
                type={connectionsModal.type}
                userId={uid}
                onClose={() => setConnectionsModal({...connectionsModal, isOpen: false})}
            />
        </motion.div>
    );
};
