import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import type { Comment } from '../../types';
import './PostCommentsModal.css';

interface PostCommentsModalProps {
    postId: string | null;
    onClose: () => void;
}

export const PostCommentsModal: React.FC<PostCommentsModalProps> = ({ postId, onClose }) => {
    const { listenToComments, addComment } = usePulseStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newText, setNewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!postId) return;
        const unsubscribe = listenToComments(postId, (fetchedComments) => {
            setComments(fetchedComments);
        });
        return () => unsubscribe();
    }, [postId, listenToComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim() || !postId || isSubmitting) return;

        setIsSubmitting(true);
        await addComment(postId, newText.trim());
        setNewText('');
        setIsSubmitting(false);
    };

    if (!postId) return null;

    const formatTime = (ts: any) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes < 1) return 'Только что';
        if (minutes < 60) return `${minutes} м. назад`;
        return `${Math.floor(minutes / 60)} ч. назад`;
    };

    return (
        <AnimatePresence>
            <div className="comments-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="comments-modal-content"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    <div className="comments-header">
                        <h3>Комментарии</h3>
                        <button className="close-btn" onClick={onClose}><X size={24} /></button>
                    </div>

                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <div className="no-comments">Пока нет комментариев. Будьте первым!</div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-avatar">
                                        {(comment as any).userAvatar ? (
                                            <img src={(comment as any).userAvatar} alt="" />
                                        ) : (
                                            <div className="avatar-placeholder">{comment.user.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="comment-body">
                                        <div className="comment-user">
                                            <span className="username">{comment.user}</span>
                                            <span className="time">{formatTime(comment.timestamp)}</span>
                                        </div>
                                        <div className="comment-text">{comment.text}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="comments-input-area">
                        <form onSubmit={handleSubmit}>
                            <input 
                                type="text" 
                                placeholder="Оставьте комментарий..." 
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <button type="submit" disabled={!newText.trim() || isSubmitting} className="send-btn">
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
