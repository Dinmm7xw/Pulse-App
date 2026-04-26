import React, { useEffect, useState } from 'react';
import { X, Trash2, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import type { Post } from '../../types';
import './CloudArchiveModal.css';

interface CloudArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CloudArchiveModal: React.FC<CloudArchiveModalProps> = ({ isOpen, onClose }) => {
    const { fetchUserPosts, deletePost } = usePulseStore();
    const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setSelectedPostId(null);
            return;
        }
        const loadArchive = async () => {
            setIsLoading(true);
            const uid = auth.currentUser?.uid;
            if (uid) {
                const posts = await fetchUserPosts(uid);
                // Keep only posts with media
                setMediaPosts(posts.filter(p => !!p.mediaUrl));
            }
            setIsLoading(false);
        };
        loadArchive();
    }, [isOpen, fetchUserPosts]);

    const handleDelete = async (postId: string) => {
        if (window.confirm("Удалить этот файл из архива (он пропадет и из ленты)?")) {
            await deletePost(postId);
            setMediaPosts(prev => prev.filter(p => p.id !== postId));
            setSelectedPostId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="cloud-archive-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    className="cloud-archive-container"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    <div className="archive-header">
                        <h2>Облачный Архив</h2>
                        <button className="close-archive-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="archive-content">
                        {isLoading ? (
                            <div className="archive-loading">
                                <Loader2 className="spin" size={32} />
                                <p>Загрузка файлов...</p>
                            </div>
                        ) : mediaPosts.length === 0 ? (
                            <div className="archive-empty">
                                <ImageIcon size={48} />
                                <h3>Архив пуст</h3>
                                <p>Ваши загруженные фото и видео появятся здесь.</p>
                            </div>
                        ) : (
                            <div className="archive-grid">
                                {mediaPosts.map(post => {
                                    const isVideo = post.mediaUrl?.includes('/video/upload/');
                                    return (
                                        <div 
                                            key={post.id} 
                                            className={`archive-item ${selectedPostId === post.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                                        >
                                            {isVideo ? (
                                                <video src={post.mediaUrl} className="archive-media" muted />
                                            ) : (
                                                <img src={post.mediaUrl} className="archive-media" alt="" />
                                            )}
                                            {isVideo && <div className="video-indicator"><Video size={16} /></div>}
                                            
                                            {selectedPostId === post.id && (
                                                <div className="archive-item-overlay">
                                                    <button 
                                                        className="delete-media-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(post.id);
                                                        }}
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
