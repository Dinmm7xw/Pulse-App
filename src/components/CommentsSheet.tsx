import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { usePulseStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { Comment } from '../types';
import './CommentsSheet.css';

interface CommentsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({ isOpen, onClose, postId }) => {
    const { addComment, listenToComments, setViewingUserId } = usePulseStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && postId) {
            const unsubscribe = listenToComments(postId, (data) => {
                setComments(data);
            });
            return () => unsubscribe();
        }
    }, [isOpen, postId, listenToComments]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        await addComment(postId, newComment);
        setNewComment('');
        setIsSubmitting(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        className="comments-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div 
                        className="comments-sheet glass"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <header className="comments-header">
                            <h3>Комментарии ({comments.length})</h3>
                            <button className="close-btn" onClick={onClose}><X size={24} /></button>
                        </header>

                        <div className="comments-list" ref={scrollRef}>
                            {comments.length === 0 ? (
                                <div className="no-comments">Станьте первым, кто оставит комментарий!</div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="comment-item">
                                        <div 
                                            className="comment-avatar" 
                                            onClick={() => { setViewingUserId(comment.userId); onClose(); }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {comment.userAvatar ? <img src={comment.userAvatar} alt="" /> : <div className="avatar-placeholder"><User size={16} /></div>}
                                        </div>
                                        <div className="comment-content">
                                            <div 
                                                className="comment-user"
                                                onClick={() => { setViewingUserId(comment.userId); onClose(); }}
                                                style={{ cursor: 'pointer' }}
                                            >@{comment.user}</div>
                                            <div className="comment-text">{comment.text}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form className="comment-form" onSubmit={handleSubmit}>
                            <input 
                                type="text" 
                                placeholder="Добавить комментарий..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button type="submit" disabled={!newComment.trim() || isSubmitting}>
                                <Send size={20} />
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
