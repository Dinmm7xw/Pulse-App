import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, User } from 'lucide-react';
import type { Comment } from '../../types';
import { usePulseStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import './ThreadPost.css';

interface ThreadPostProps {
    post: any;
}

import { auth } from '../../lib/firebase';

interface ThreadPostProps {
    post: any;
}

export const ThreadPost: React.FC<ThreadPostProps> = ({ post }) => {
    const { addComment, listenToComments, likePost } = usePulseStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (showComments) {
            const unsub = listenToComments(post.id, (data) => setComments(data));
            return () => unsub();
        }
    }, [showComments, post.id, listenToComments]);

    const handleSendComment = () => {
        if (!newComment.trim()) return;
        addComment(post.id, newComment);
        setNewComment('');
    };

    return (
        <div className="thread-post-card glass">
            <div className="thread-main">
                <div className="thread-avatar-side">
                    <div className="ghost-avatar">
                        <User size={20} color="var(--primary-color)" />
                    </div>
                    <div className="thread-line"></div>
                </div>
                
                <div className="thread-content-side">
                    <div className="thread-header">
                        <span className="thread-author">{post.isAnonymous ? 'Анонимный Пульс' : (post.user || 'Пользователь')}</span>
                        <span className="thread-time">{post.city || post.location || 'Алматы'}</span>
                        <MoreHorizontal size={16} className="thread-more" />
                    </div>
                    
                    <p className="thread-text">{post.desc}</p>
                    
                    {post.mediaUrl && (
                        <div className="thread-media">
                            {post.mediaUrl.includes('/video/upload/') ? (
                                <video 
                                    src={post.mediaUrl} 
                                    controls 
                                    className="thread-video"
                                    style={{ width: '100%', borderRadius: '12px' }}
                                />
                            ) : (
                                <img src={post.mediaUrl} alt="Post content" />
                            )}
                        </div>
                    )}

                    <div className="thread-actions">
                        <button 
                            className={`thread-action-btn ${post.likedBy?.includes(auth.currentUser?.uid || '') ? 'liked' : ''}`}
                            onClick={() => likePost(post.id)}
                        >
                            <Heart size={20} fill={post.likedBy?.includes(auth.currentUser?.uid || '') ? "#ff4d56" : "none"} color={post.likedBy?.includes(auth.currentUser?.uid || '') ? "#ff4d56" : "currentColor"} />
                            <span>{post.likesCount || 0}</span>
                        </button>
                        <button className="thread-action-btn" onClick={() => setShowComments(!showComments)}>
                            <MessageCircle size={20} /> <span>{comments.length || post.commentsCount || 0}</span>
                        </button>
                        <button className="thread-action-btn"><Share2 size={20} /></button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showComments && (
                    <motion.div 
                        className="thread-comments-section"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <div className="comments-list">
                            {comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-avatar">
                                        <User size={14} />
                                    </div>
                                    <div className="comment-body">
                                        <span className="comment-user">{comment.user}</span>
                                        <p>{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="comment-input-area">
                            <input 
                                type="text" 
                                placeholder="Ответить..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                            />
                            <button onClick={handleSendComment}>Отправить</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
