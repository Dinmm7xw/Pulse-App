import React, { useState, useMemo } from 'react';
import { Settings, Grid, Bookmark, User as UserIcon, LogOut, ChevronLeft, Heart, MessageCircle, X, Shield, Trash2 } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import './ProfileView.css';

type ProfileTab = 'grid' | 'saved' | 'anonymous';

export const ProfileView: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
    const { posts, friendRequests, acceptFriendRequest, userProfile, deletePost } = usePulseStore();
    const user = auth.currentUser;
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTab>('grid');
    const [selectedPost, setSelectedPost] = useState<any | null>(null);

    // All posts by current user
    const allUserPosts = useMemo(() => posts.filter(p => p.userId === user?.uid), [posts, user]);
    
    // Public posts for counting and main grid
    const publicPosts = useMemo(() => allUserPosts.filter(p => !p.isAnonymous), [allUserPosts]);
    
    // Anonymous posts for the private tab
    const anonymousPosts = useMemo(() => allUserPosts.filter(p => p.isAnonymous), [allUserPosts]);

    const activePosts = activeTab === 'grid' ? publicPosts : activeTab === 'anonymous' ? anonymousPosts : [];

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
                    {friendRequests.length > 0 && <div className="request-dot"></div>}
                    <button className="icon-btn" onClick={() => setIsRequestsOpen(!isRequestsOpen)}><UserIcon size={22} /></button>
                    <button className="icon-btn" onClick={onOpenSettings}><Settings size={22} /></button>
                </div>
            </header>

            {isRequestsOpen && (
                <div className="friend-requests-panel glass">
                    <h4>Заявки в друзья ({friendRequests.length})</h4>
                    {friendRequests.length === 0 ? (
                        <p className="no-req">У вас пока нет новых заявок</p>
                    ) : (
                        friendRequests.map(req => (
                            <div key={req.id} className="request-item">
                                <span>{req.fromName}</span>
                                <div className="req-btns">
                                    <button className="accept-btn" onClick={() => acceptFriendRequest(req.id)}>Принять</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className="profile-main-info">
                <div className="profile-avatar-row">
                    <div className="insta-avatar-outer">
                        <div className="insta-avatar-inner">
                            {userProfile.photoURL || user?.photoURL ? (
                                <img src={userProfile.photoURL || user?.photoURL || ''} alt="avatar" />
                            ) : <span>👤</span>}
                        </div>
                    </div>
                    
                    <div className="insta-stats">
                        <div className="stat-box">
                            <span className="count">{publicPosts.length}</span>
                            <span className="label">Публикации</span>
                        </div>
                        <div className="stat-box">
                            <span className="count">302</span>
                            <span className="label">Друзья</span>
                        </div>
                        <div className="stat-box">
                            <span className="count">702</span>
                            <span className="label">Рейтинг</span>
                        </div>
                    </div>
                </div>

                <div className="profile-bio">
                    <span className="full-name">{userProfile.displayName || user?.displayName || 'User Pulse'}</span>
                    <p>{userProfile.bio || 'Карта твоего ритма. Энергия города в твоих руках. 📍 Almaty'}</p>
                </div>

                <div className="profile-actions-row">
                    <button className="insta-btn primary-pulse">Друзья</button>
                    <button className="insta-btn" onClick={onOpenSettings}>Редактировать</button>
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
                {activePosts.length === 0 ? (
                    <div className="empty-grid">
                        {activeTab === 'anonymous' ? 'У вас нет анонимных публикаций' : 'Нет публикаций. Создай первую!'}
                    </div>
                ) : (
                    activePosts.map(post => (
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
                                <span>❤️ 12</span>
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
                                        <div className="action-item"><Heart size={24} /> <span>12</span></div>
                                        <div className="action-item"><MessageCircle size={24} /> <span>0</span></div>
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
