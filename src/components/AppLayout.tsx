import React from 'react';
import { Map, Compass, Plus, MessageCircle, User } from 'lucide-react';
import './AppLayout.css';

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick }) => (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        <span>{label}</span>
    </button>
);

export const AppLayout: React.FC<{
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onAddClick?: () => void;
}> = ({ children, activeTab, setActiveTab, onAddClick }) => {
    return (
        <div className="app-container">
            <main className="main-content">
                {children}
            </main>

            <nav className="bottom-nav glass">
                <NavItem
                    icon={Map}
                    label="Карта"
                    active={activeTab === 'map'}
                    onClick={() => setActiveTab('map')}
                />
                <NavItem
                    icon={Compass}
                    label="Рекомендации"
                    active={activeTab === 'feed'}
                    onClick={() => setActiveTab('feed')}
                />
                <div className="nav-add-btn" onClick={onAddClick}>
                    <Plus size={28} color="white" strokeWidth={3} />
                </div>
                <NavItem
                    icon={MessageCircle}
                    label="Чаты"
                    active={activeTab === 'chats'}
                    onClick={() => setActiveTab('chats')}
                />
                <NavItem
                    icon={User}
                    label="Профиль"
                    active={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                />
            </nav>
        </div>
    );
};
