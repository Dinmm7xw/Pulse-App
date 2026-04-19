import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, HelpCircle, X, ChevronRight, 
  Camera, Lock, LogOut, AppWindow, ChevronLeft
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { usePulseStore } from '../../store/useStore';
import { uploadMedia } from '../../lib/upload';
import './SettingsView.css';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'profile' | 'account' | 'security' | 'notifications' | 'privacy' | 'about';

export const SettingsView: React.FC<SettingsViewProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab | null>(null);
  const [showCategoryList, setShowCategoryList] = useState(true);
  const { userProfile, updateUserProfile } = usePulseStore();
  const user = auth.currentUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: userProfile.bio || '',
    username: userProfile.username || user?.email?.split('@')[0] || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
        setFormData({
            displayName: user?.displayName || '',
            bio: userProfile.bio || '',
            username: userProfile.username || user?.email?.split('@')[0] || ''
        });
        // On desktop, auto-select profile
        if (window.innerWidth > 768) {
            setActiveTab('profile');
            setShowCategoryList(true);
        } else {
            setActiveTab(null);
            setShowCategoryList(true);
        }
    }
  }, [isOpen, userProfile, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateProfile(user, { displayName: formData.displayName });
      await updateUserProfile({ 
        bio: formData.bio, 
        username: formData.username,
        displayName: formData.displayName 
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsSaving(true);
    try {
        const url = await uploadMedia(file);
        await updateProfile(user, { photoURL: url });
        await updateUserProfile({ 
          photoURL: url,
          // Сразу обновляем и displayName, чтобы данные были синхронны
          displayName: user.displayName || undefined
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
        setErrorMsg('Ошибка загрузки: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const navItems = [
    { id: 'profile', icon: <User size={20} />, label: 'Профиль' },
    { id: 'account', icon: <AppWindow size={20} />, label: 'Аккаунт' },
    { id: 'security', icon: <Lock size={20} />, label: 'Безопасность' },
    { id: 'notifications', icon: <Bell size={20} />, label: 'Уведомления' },
    { id: 'privacy', icon: <Shield size={20} />, label: 'Приватность' },
    { id: 'about', icon: <HelpCircle size={20} />, label: 'О программе' },
  ];

  const handleSelectTab = (tabId: SettingsTab) => {
    setActiveTab(tabId);
    if (window.innerWidth <= 768) {
        setShowCategoryList(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="settings-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="settings-window" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
          
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />

          {/* Sidebar / List View */}
          <aside className={`settings-sidebar ${showCategoryList ? 'v-active' : 'v-hidden'}`}>
            <header className="sidebar-header-mobile">
                <h2>Настройки</h2>
                <button onClick={onClose} className="close-btn"><X /></button>
            </header>
            
            <nav className="settings-nav">
              {navItems.map((item) => (
                <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => handleSelectTab(item.id as SettingsTab)}>
                  <div className="nav-item-left">
                    {item.icon} <span>{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="mobile-chevron" />
                </button>
              ))}
            </nav>

            <button className="sidebar-logout" onClick={() => signOut(auth)}>
              <LogOut size={18} /> <span>Выйти из аккаунта</span>
            </button>
          </aside>

          {/* Content View */}
          <main className={`settings-content ${!showCategoryList ? 'v-active' : 'v-hidden'}`}>
            <header className="content-header">
              <div className="header-left">
                {window.innerWidth <= 768 && <button className="back-btn" onClick={() => setShowCategoryList(true)}><ChevronLeft /> Назад</button>}
                <h2>{navItems.find(i => i.id === activeTab)?.label}</h2>
              </div>
              <button className="close-settings" onClick={onClose}><X size={24} /></button>
            </header>

            <div className="content-body">
              {activeTab === 'profile' && (
                <div className="profile-edit-form">
                    <div className="avatar-edit-section">
                      <div className="large-avatar-circle">
                        {userProfile.photoURL || user?.photoURL ? (
                          <img src={userProfile.photoURL || user?.photoURL || ''} alt="pfp" />
                        ) : <span>👤</span>}
                        <button className="photo-upload-btn" onClick={() => fileInputRef.current?.click()}>
                            <Camera size={20} />
                        </button>
                      </div>
                      <div className="avatar-info-texts">
                        <h3>{userProfile.displayName || user?.displayName || 'Пользователь'}</h3>
                        <p>Нажмите на иконку камеры, чтобы загрузить новое фото профиля.</p>
                      </div>
                    </div>

                    <div className="input-group-pulse">
                      <label>Имя</label>
                      <input type="text" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} placeholder="Ваше имя" />
                    </div>
                    <div className="input-group-pulse">
                      <label>Имя пользователя (@)</label>
                      <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="username" />
                    </div>
                    <div className="input-group-pulse">
                      <label>О себе</label>
                      <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} placeholder="Расскажите о себе..." />
                    </div>

                    <button className={`save-btn ${saveSuccess ? 'success' : ''}`} onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Сохранение...' : saveSuccess ? 'Изменения сохранены!' : 'Сохранить профиль'}
                    </button>
                    {errorMsg && <p className="error-msg">{errorMsg}</p>}
                </div>
              )}

              {activeTab === 'account' && (
                <div className="account-info-section">
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p style={{ marginTop: '10px', color: '#666', fontSize: '13px' }}>Для смены почты обратитесь в поддержку.</p>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="security-edit-form">
                    <div className="input-group-pulse">
                        <label>Новый пароль</label>
                        <input type="password" placeholder="Введите новый пароль" />
                    </div>
                    <button className="save-btn">Обновить пароль</button>
                </div>
              )}
            </div>
          </main>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
