import React, { useState, useMemo } from 'react';
import { Settings, Grid, Bookmark, User as UserIcon, LogOut, ChevronLeft, Heart, MessageCircle, X, Shield, Trash2 } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import './ProfileView.css';

type ProfileTab = 'grid' | 'saved' | 'anonymous';

const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

export const ProfileView: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
    const { posts, userProfile, deletePost, followersIds, followingIds } = usePulseStore();
    const user = auth.currentUser;
    const [activeTab, setActiveTab] = useState<ProfileTab>('grid');
    const [selectedPost, setSelectedPost] = useState<any | null>(null);

    // All posts by current user
    const allUserPosts = useMemo(() => posts.filter(p => p.userId === user?.uid), [posts, user]);
    
    // Public posts for counting and main grid
    const publicPosts = useMemo(() => allUserPosts.filter(p => !p.isAnonymous), [allUserPosts]);
    
    // Anonymous posts for the private tab
    const anonymousPosts = useMemo(() => allUserPosts.filter(p => p.isAnonymous), [allUserPosts]);

    const activePosts = activeTab === 'grid' ? publicPosts : activeTab === 'anonymous' ? anonymousPosts : [];

    // Calculate dynamic rating
    const totalLikes = useMemo(() => {
        return allUserPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
    }, [allUserPosts]);

    const dynamicRating = useMemo(() => {
        return (followersIds.length * 10) + totalLikes + (publicPosts.length * 5);
    }, [followersIds, totalLikes, publicPosts]);

    const handleDelete = async (postId: string) => {
        if (window.confirm("Вы уверены, что хотите удалить эту публикацию?")) {
            await deletePost(postId);
            setSelectedPost(null);
        }
    };

    return (
        <div className="profile-view-insta">
            <header className="insta-header">
                <button className="icon-btn" onClick={() => window.location.reload()}><ChevronLeft size={24} /></button>
                <h3>{userProfile.username || user?.displayName || user?.email?.split('@')[0]}</h3>
                <div className="header-actions">
                    <button className="icon-btn" onClick={onOpenSettings}><Settings size={22} /></button>
                </div>
            </header>



            <div className="profile-main-info">
                <div className="profile-avatar-row">
                    <div className="insta-avatar-outer">
                        <div className="insta-avatar-inner">
                            {userProfile.photoURL || user?.photoURL ? (
                                <img src={userProfile.photoURL || user?.photoURL || ''} alt="avatar" />
                            ) : <img src={NEUTRAL_AVATAR} alt="avatar" />}
                        </div>
                    </div>
                    
                    <div className="insta-stats">
                        <div className="stat-box">
                            <span className="count">{publicPosts.length}</span>
                            <span className="label">Публикации</span>
                        </div>
                        <div className="stat-box">
                            <span className="count">{userProfile.followersCount || 0}</span>
                            <span className="label">Подписчики</span>
                        </div>
                        <div className="stat-box">
                            <span className="count">{userProfile.followingCount || 0}</span>
                            <span className="label">Подписки</span>
                        </div>
                    </div>
                </div>

                <div className="profile-bio">
                    <span className="full-name">{userProfile.displayName || user?.displayName || 'User Pulse'}</span>
                    <p>{userProfile.bio || 'Карта твоего ритма. Энергия города в твоих руках. 📍 Almaty'}</p>
                </div>

                <div className="profile-actions-row">
                    <button className="insta-btn" onClick={onOpenSettings}>Редактировать профиль</button>
                    <div className="stat-rating-mini">Рейтинг: {dynamicRating}</div>
                </div>
            </div>

            <div className="insta-tabs">
                <div 
                    className={`insta-tab ${activeTab === 'grid' ? 'active' : ''}`}
                    onClick={() => setActiveTab('grid')}
                >
                    <Grid size={22} />
                </div>
                <div 
                    className={`insta-tab ${activeTab === 'anonymous' ? 'active' : ''}`}
                    onClick={() => setActiveTab('anonymous')}
                >
                    <Shield size={22} />
                </div>
                <div className="insta-tab"><Bookmark size={22} /></div>
            </div>

            <div className="insta-post-grid">
                {(activePosts || []).length === 0 ? (
                    <div className="empty-grid">
                        {activeTab === 'anonymous' ? 'У вас нет анонимных публикаций' : 'Нет публикаций. Создай первую!'}
                    </div>
                ) : (
                    (activePosts || []).map(post => (
                        <div 
                            key={post.id} 
                            className="grid-item" 
                            style={{ background: post.color }}
                            onClick={() => setSelectedPost(post)}
                        >
                            {post.mediaUrl ? (
                                <img src={post.mediaUrl} alt="post" />
                            ) : (
                                <div className="text-post-preview">
                                    <p>{post.desc}</p>
                                </div>
                            )}
                            <div className="grid-overlay">
                                <span>❤️ {post.likesCount || 0}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {selectedPost && (
                    <motion.div 
                        className="post-detail-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="post-detail-modal glass">
                            <header className="post-modal-header">
                                <button className="close-post-btn" onClick={() => setSelectedPost(null)}><X size={24} /></button>
                                <button className="delete-post-btn" onClick={() => handleDelete(selectedPost.id)}><Trash2 size={22} /></button>
                            </header>
                            
                            <div className="post-detail-content">
                                {selectedPost.mediaUrl ? (
                                    selectedPost.mediaUrl.includes('/video/upload/') ? (
                                        <video src={selectedPost.mediaUrl} controls autoPlay />
                                    ) : (
                                        <img src={selectedPost.mediaUrl} alt="Post" />
                                    )
                                ) : (
                                    <div className="post-typography-card" style={{ background: selectedPost.color || 'linear-gradient(45deg, #121217, #000)' }}>
                                        <p>{selectedPost.text || selectedPost.desc}</p>
                                    </div>
                                )}
                                <div className="post-detail-info">
                                    <div className="post-header-mini">
                                        <strong>{selectedPost.isAnonymous ? 'Анонимно' : (userProfile.username || 'user')}</strong>
                                        <p>{selectedPost.desc || selectedPost.text}</p>
                                    </div>
                                    <div className="post-footer-actions">
                                        <div className="action-item"><Heart size={24} color={(selectedPost.likedBy || []).includes(user?.uid) ? "#ff4d56" : "white"} fill={(selectedPost.likedBy || []).includes(user?.uid) ? "#ff4d56" : "none"} /> <span>{selectedPost.likesCount || 0}</span></div>
                                        <div className="action-item"><MessageCircle size={24} /> <span>{selectedPost.commentsCount || 0}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button className="logout-insta-btn" onClick={() => auth.signOut()}>
                <LogOut size={18} /> Выйти из аккаунта
            </button>
        </div>
    );
};
