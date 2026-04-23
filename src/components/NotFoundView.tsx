import React from 'react';
import { motion } from 'framer-motion';
import './NotFoundView.css';

// Using the generated 404 image path
const ERROR_404_IMAGE = '/error_404_illustration_1776950164269.png';

export const NotFoundView: React.FC = () => {
    return (
        <div className="error-page-container">
            <motion.img 
                src={ERROR_404_IMAGE} 
                alt="404 Error" 
                className="error-img"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            />
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h1>404</h1>
                <h2>Пульс не найден</h2>
                <p>Кажется, этот ритм утих или ссылка ведет в никуда. Давайте вернемся на главную карту.</p>
                <button 
                    className="go-home-btn"
                    onClick={() => window.location.href = '/'}
                >
                    Вернуться в ритм
                </button>
            </motion.div>
        </div>
    );
};
