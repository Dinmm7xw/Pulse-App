import React, { useState } from 'react';
import { ChevronLeft, Shield, Lock, Eye, FileText, HelpCircle, ChevronDown, ChevronUp, Bell, Copyright } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './PrivacyCenter.css';

// Using the generated image path
const HERO_IMAGE = '/privacy_center_hero_1776949913527.png';

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
                <h2>Центр конфиденциальности</h2>
            </header>

            <div className="privacy-hero">
                <img src={HERO_IMAGE} alt="Privacy" className="hero-img" />
                <h1>Мы заботимся о вашей безопасности</h1>
                <p>Узнайте, как мы защищаем ваши данные и какие инструменты контроля доступны вам в приложении Pulse.</p>
            </div>

            <div className="privacy-content">
                <div className="privacy-section-grid">
                    <div className="privacy-card" onClick={() => toggleAccordion('data')}>
                        <div className="card-icon-wrap"><Eye size={24} /></div>
                        <h3>Прозрачность данных</h3>
                        <p>Мы используем ваши координаты только для отображения на карте. Мы не передаем их третьим лицам.</p>
                    </div>
                    <div className="privacy-card" onClick={() => toggleAccordion('security')}>
                        <div className="card-icon-wrap"><Lock size={24} /></div>
                        <h3>Защита аккаунта</h3>
                        <p>Ваши сообщения и профиль защищены шифрованием Firebase. Вы полностью контролируете доступ.</p>
                    </div>
                    <div className="privacy-card" onClick={() => toggleAccordion('copyright')}>
                        <div className="card-icon-wrap"><Copyright size={24} /></div>
                        <h3>Авторские права</h3>
                        <p>Все права на музыку предоставлены iTunes API для ознакомления. Ваш контент принадлежит вам.</p>
                    </div>
                </div>

                <div className="detailed-section">
                    <h2>Частые вопросы</h2>
                    
                    <div className="accordion-item">
                        <div className="accordion-header" onClick={() => toggleAccordion('loc')}>
                            <span>Как работает геолокация?</span>
                            {openAccordion === 'loc' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <AnimatePresence>
                            {openAccordion === 'loc' && (
                                <motion.div 
                                    className="accordion-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    Pulse использует GPS вашего устройства только тогда, когда приложение открыто. 
                                    Ваше местоположение обновляется только при публикации «Пульса» или «Шаута». 
                                    Вы можете в любой момент скрыть себя с карты в настройках профиля.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="accordion-item">
                        <div className="accordion-header" onClick={() => toggleAccordion('anon')}>
                            <span>Безопасны ли анонимные посты?</span>
                            {openAccordion === 'anon' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <AnimatePresence>
                            {openAccordion === 'anon' && (
                                <motion.div 
                                    className="accordion-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    Да. При публикации анонимного поста ваше имя и аватар скрываются от всех пользователей. 
                                    Даже модераторы видят только анонимный идентификатор, если пост не нарушает правила сообщества.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="accordion-item">
                        <div className="accordion-header" onClick={() => toggleAccordion('copy-details')}>
                            <span>Политика авторских прав на музыку</span>
                            {openAccordion === 'copy-details' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <AnimatePresence>
                            {openAccordion === 'copy-details' && (
                                <motion.div 
                                    className="accordion-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    Вся музыка в приложении Pulse транслируется через iTunes Search API. 
                                    Мы предоставляем только ознакомительные фрагменты (30 секунд). 
                                    Если вы являетесь правообладателем и хотите удалить свой трек, пожалуйста, 
                                    свяжитесь с поддержкой Pulse.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <footer className="footer-privacy">
                <p>© 2024 Pulse App. Часть экосистемы Динмухаммеда.</p>
                <p>Версия 2.4.0 (Stable)</p>
            </footer>
        </motion.div>
    );
};
