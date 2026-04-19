import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Star, Phone, Globe, Clock, MessageSquare } from 'lucide-react';
import './PlaceDetails.css';

interface PlaceDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    place: {
        name: string;
        category: string;
        rating: number;
        reviews: number;
        address: string;
        status: string;
    } | null;
}

export const PlaceDetails: React.FC<PlaceDetailsProps> = ({ isOpen, onClose, place }) => {
    if (!place) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="place-details-sheet glass"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                >
                    <div className="handle" onClick={onClose} />

                    <header className="place-header">
                        <div className="place-titles">
                            <h3>{place.name}</h3>
                            <p>{place.category}</p>
                        </div>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </header>

                    <div className="place-info-grid">
                        <div className="rating-box">
                            <Star size={16} fill="#FFD700" color="#FFD700" />
                            <span>{place.rating}</span>
                            <span className="review-count">({place.reviews} отзывов)</span>
                        </div>
                        <div className="status-badge">{place.status}</div>
                    </div>

                    <div className="action-buttons">
                        <button className="primary-action">
                            <Navigation size={20} />
                            В путь
                        </button>
                        <button className="secondary-action glass">
                            <MessageSquare size={20} />
                            Отзыв
                        </button>
                    </div>

                    <div className="contact-list">
                        <div className="contact-item">
                            <Clock size={18} color="var(--text-dim)" />
                            <span>Открыто до 22:00</span>
                        </div>
                        <div className="contact-item">
                            <Phone size={18} color="var(--text-dim)" />
                            <span>+7 (777) 123-45-67</span>
                        </div>
                        <div className="contact-item">
                            <Globe size={18} color="var(--text-dim)" />
                            <span>www.restplace.kz</span>
                        </div>
                    </div>

                    <div className="photos-preview">
                        <h4>Фотографии</h4>
                        <div className="photo-grid">
                            <div className="photo-placeholder glass">🖼️</div>
                            <div className="photo-placeholder glass">🖼️</div>
                            <div className="photo-placeholder glass">🖼️</div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
