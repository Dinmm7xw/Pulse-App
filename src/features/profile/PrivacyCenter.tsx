import React, { useState } from 'react';
import { ChevronLeft, Eye, FileText, ChevronDown, ChevronUp, Copyright } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, COPYRIGHT_INFO } from './LegalContent';
import './PrivacyCenter.css';

// Image paths
const HERO_IMAGE = '/privacy_center_hero_1776949913527.png';
const COPYRIGHT_IMAGE = '/copyright_protection_hero_1777102908683.png';

interface PrivacyCenterProps {
    onClose: () => void;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ onClose }) => {
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    return (
        <motion.div 
            className="privacy-center-overlay"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
        >
            <header className="privacy-header">
                <button className="back-btn" onClick={onClose}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Юридический центр</h2>
            </header>

            <div className="privacy-hero">
                <img src={openAccordion === 'copyright-full' ? COPYRIGHT_IMAGE : HERO_IMAGE} alt="Privacy" className="hero-img" />
                <h1>Безопасность и Право</h1>
                <p>Здесь вы найдете официальные документы, подтверждающие авторство и правила использования платформы Pulse.</p>
            </div>

            <div className="privacy-content">
                <div className="privacy-section-grid">
                    <div className="privacy-card" onClick={() => toggleAccordion('data')}>
                        <div className="card-icon-wrap"><Eye size={24} /></div>
                        <h3>Прозрачность данных</h3>
                        <p>Как мы работаем с вашей геолокацией и личной информацией.</p>
                    </div>
                    <div className="privacy-card" onClick={() => toggleAccordion('copyright-full')}>
                        <div className="card-icon-wrap"><Copyright size={24} /></div>
                        <h3>Авторские права</h3>
                        <p>Информация о владельце проекта и интеллектуальной собственности.</p>
                    </div>
                    <div className="privacy-card" onClick={() => toggleAccordion('terms-full')}>
                        <div className="card-icon-wrap"><FileText size={24} /></div>
                        <h3>Условия сервиса</h3>
                        <p>Полный текст пользовательского соглашения Pulse.</p>
                    </div>
                </div>

                <div className="detailed-section">
                    <h2>Документация</h2>
                    
                    <div className="accordion-item">
                        <div className="accordion-header" onClick={() => toggleAccordion('terms-full')}>
                            <span>Условия использования (Terms of Service)</span>
                            {openAccordion === 'terms-full' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <AnimatePresence>
                            {openAccordion === 'terms-full' && (
                                <motion.div 
                                    className="accordion-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {TERMS_OF_SERVICE}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="accordion-item">
                        <div className="accordion-header" onClick={() => toggleAccordion('data')}>
                            <span>Политика конфиденциальности</span>
                            {openAccordion === 'data' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <AnimatePresence>
                            {openAccordion === 'data' && (
                                <motion.div 
                                    className="accordion-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {PRIVACY_POLICY}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="accordion-item">
                        <div className="accordion-header" onClick={() => toggleAccordion('copyright-full')}>
                            <span>Информация об авторских правах</span>
                            {openAccordion === 'copyright-full' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <AnimatePresence>
                            {openAccordion === 'copyright-full' && (
                                <motion.div 
                                    className="accordion-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}
                                >
                                    {COPYRIGHT_INFO}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <footer className="footer-privacy">
                <p>© 2024 Pulse App. Автор и владелец: Dinmuhammed.</p>
                <p>Все права защищены законом об авторском праве РК.</p>
            </footer>
        </motion.div>
    );
};
