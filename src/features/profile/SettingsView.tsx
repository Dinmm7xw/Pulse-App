import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, HelpCircle, X, ChevronRight, 
  Camera, Lock, LogOut, FileText, ChevronLeft, Eye, EyeOff
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { updateProfile, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { usePulseStore } from '../../store/useStore';
import { uploadMedia } from '../../lib/upload';
import './SettingsView.css';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy?: () => void;
}

type SettingsTab = 'main' | 'profile' | 'account' | 'security' | 'notifications' | 'privacy' | 'terms' | 'about';

// Standard neutral avatar SVG for consistency and professional look
export const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

export const SettingsView: React.FC<SettingsViewProps> = ({ isOpen, onClose, onOpenPrivacy }) => {
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
  
  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Notifications
  const [pushEnabled, setPushEnabled] = useState((userProfile as any).pushEnabled ?? true);
  const [msgNotif, setMsgNotif] = useState((userProfile as any).msgNotif ?? true);
  const [likeNotif, setLikeNotif] = useState((userProfile as any).likeNotif ?? true);
  
  // Privacy
  const [hideLocation, setHideLocation] = useState(userProfile.hideLocation || false);

  const handleComingSoon = () => alert("В разработке. Ожидайте в будущих обновлениях!");

  const handleDeleteAccount = async () => {
    if(window.confirm("Удалить аккаунт навсегда? Это действие необратимо.")) {
        try {
            if (user) {
                await deleteUser(user);
                alert("Ваш аккаунт был успешно удален.");
            }
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                alert("Для удаления аккаунта необходимо авторизоваться заново. Пожалуйста, выйдите и войдите снова.");
            } else {
                alert("Ошибка: " + error.message);
            }
        }
    }
  };

  useEffect(() => {
    if (isOpen) {
        setFormData({
            displayName: user?.displayName || '',
            bio: userProfile.bio || '',
            username: userProfile.username || user?.email?.split('@')[0] || ''
        });
        setHideLocation(userProfile.hideLocation || false);
        setErrorMsg('');
        setSaveSuccess(false);
        if (window.innerWidth > 768) {
            setActiveTab('main');
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
        displayName: formData.displayName,
        isProfileComplete: true
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (newPassword.length < 6) {
      setErrorMsg('Пароль должен быть минимум 6 символов');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSaveSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setErrorMsg('Неверный текущий пароль');
      } else {
        setErrorMsg(error.message);
      }
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
        await updateUserProfile({ photoURL: url });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
        setErrorMsg('Ошибка загрузки: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const navItems = [
    { id: 'main', icon: <User size={18} />, label: 'Главная' },
    { id: 'profile', icon: <User size={18} />, label: 'Мой профиль' },
    { id: 'account', icon: <FileText size={18} />, label: 'Учётная запись' },
    { id: 'security', icon: <Lock size={18} />, label: 'Безопасность' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Уведомления' },
    { id: 'privacy', icon: <Shield size={18} />, label: 'Приватность' },
    { id: 'terms', icon: <FileText size={18} />, label: 'Правила и условия' },
    { id: 'about', icon: <HelpCircle size={18} />, label: 'О программе' },
  ];

  const handleSelectTab = (tabId: SettingsTab) => {
    setActiveTab(tabId);
    setErrorMsg('');
    setSaveSuccess(false);
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
            <div className="sidebar-header-mobile">
              <h2>Настройки</h2>
              <button className="close-settings" onClick={onClose}><X size={24} /></button>
            </div>

            <div className="sidebar-profile-box desktop-only">
              <div className="sidebar-avatar">
                {userProfile.photoURL || user?.photoURL ? (
                  <img src={userProfile.photoURL || user?.photoURL || ''} alt="avatar" />
                ) : <img src={NEUTRAL_AVATAR} alt="avatar" />}
              </div>
              <div className="sidebar-profile-info">
                <span className="name">{userProfile.displayName || user?.displayName || 'Пользователь'}</span>
                <span className="email">{user?.email}</span>
              </div>
            </div>
            
            <nav className="settings-nav">
              {navItems.map((item) => (
                <button 
                  key={item.id} 
                  className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`} 
                  onClick={() => handleSelectTab(item.id as SettingsTab)}
                >
                  <div className="nav-item-left">
                    {item.icon} <span>{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="mobile-chevron" />
                </button>
              ))}
            </nav>

            <button className="sidebar-logout" onClick={() => signOut(auth)}>
              <LogOut size={18} /> <span>Выйти из аккаунта</span>
            </button>
          </aside>

          {/* Content View */}
          <main className={`settings-content ${!showCategoryList ? 'v-active' : 'v-hidden'}`}>
            <header className="content-header-top">
              <div className="header-left-group">
                {window.innerWidth <= 900 && (
                  <button className="back-btn-modern" onClick={() => setShowCategoryList(true)}>
                    <ChevronLeft size={24} />
                  </button>
                )}
                <h2 className="content-title">{navItems.find(i => i.id === activeTab)?.label}</h2>
              </div>
              <div className="search-container">
                <span className="search-icon"><Eye size={16} /></span>
                <input type="text" placeholder="Найти параметр" />
              </div>
              <button className="close-settings" onClick={onClose}><X size={20} /></button>
            </header>

            <div className="content-body">

              {/* ====== ГЛАВНАЯ (MAIN) ====== */}
              {activeTab === 'main' && (
                <>
                  <div className="settings-hero-card">
                    <div className="hero-img">
                      {userProfile.photoURL || user?.photoURL ? (
                        <img src={userProfile.photoURL || user?.photoURL || ''} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                      ) : <div style={{width:'100%', height:'100%', background:'var(--primary-color)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '32px', fontWeight: '900'}}>P</div>}
                    </div>
                    <div className="hero-info">
                      <div className="title">{userProfile.username || 'PULSE-USER'}</div>
                      <div className="subtitle">Учетная запись подключена и защищена</div>
                      <button className="insta-btn" style={{marginTop: '12px', padding: '4px 12px', fontSize: '12px'}} onClick={() => setActiveTab('profile')}>Переименовать</button>
                    </div>
                  </div>

                  <div className="settings-group-card">
                    <div className="settings-list-item" onClick={() => setActiveTab('notifications')}>
                      <div className="item-icon"><Bell size={20} /></div>
                      <div className="item-info">
                        <span className="label">Звук и уведомления</span>
                        <span className="sublabel">Громкость, системные звуки, push-уведомления</span>
                      </div>
                      <ChevronRight size={16} />
                    </div>
                    <div className="settings-list-item" onClick={() => setActiveTab('privacy')}>
                      <div className="item-icon"><Shield size={20} /></div>
                      <div className="item-info">
                        <span className="label">Конфиденциальность и безопасность</span>
                        <span className="sublabel">Разрешения камеры, местоположение, права доступа</span>
                      </div>
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  <div className="settings-hero-card" style={{padding: '0', overflow: 'hidden', height: 'auto', flexDirection: 'column', alignItems: 'stretch'}}>
                    <div style={{padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                      <div className="title" style={{fontSize: '16px'}}>Облачное хранилище Pulse</div>
                      <div className="subtitle">У вас осталось 15 ГБ свободного места из 50 ГБ</div>
                    </div>
                    <div style={{padding: '16px 20px'}}>
                        <div style={{height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden'}}>
                            <div style={{width: '30%', height: '100%', background: 'var(--primary-color)'}} />
                        </div>
                        <button className="insta-btn" style={{marginTop: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white'}} onClick={handleComingSoon}>Управление хранилищем</button>
                    </div>
                  </div>

                  <div className="settings-hero-card" style={{background: 'rgba(112, 0, 255, 0.05)', border: '1px solid rgba(112, 0, 255, 0.2)'}}>
                    <div className="hero-info">
                      <div className="title" style={{color: 'var(--primary-color)'}}>Pulse Premium</div>
                      <div className="subtitle">Попробуйте классические возможности Pulse с расширенной аналитикой и эксклюзивными темами.</div>
                      <button className="save-btn" style={{marginTop: '16px', padding: '8px 20px', width: 'auto'}} onClick={handleComingSoon}>Попробовать бесплатно</button>
                    </div>
                  </div>
                </>
              )}

              {/* ====== ПРОФИЛЬ ====== */}
              {activeTab === 'profile' && (
                <div className="profile-edit-form">
                  <div className="settings-group-card" style={{padding: '24px', marginBottom: '24px'}}>
                      <div className="large-avatar-circle">
                        {userProfile.photoURL || user?.photoURL ? (
                          <img src={userProfile.photoURL || user?.photoURL || ''} alt="pfp" />
                        ) : <img src={NEUTRAL_AVATAR} alt="pfp" className="neutral-pfp-img" />}
                        <button className="photo-upload-btn" onClick={() => fileInputRef.current?.click()}>
                            <Camera size={16} />
                        </button>
                      </div>
                      <div className="avatar-info-texts">
                        <h3>{userProfile.displayName || user?.displayName || 'Пользователь'}</h3>
                        <p>Нажмите на камеру чтобы сменить фото</p>
                      </div>
                    </div>

                    <div className="input-group-pulse">
                      <label>Имя</label>
                      <input type="text" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} placeholder="Ваше имя" />
                    </div>
                    <div className="input-group-pulse">
                      <label>Имя пользователя (@)</label>
                      <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} placeholder="username" />
                    </div>
                    <div className="input-group-pulse">
                      <label>О себе</label>
                      <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} placeholder="Расскажите о себе..." maxLength={300} />
                      <span className="char-count">{formData.bio.length}/300</span>
                    </div>

                    <button className={`save-btn ${saveSuccess ? 'success' : ''}`} onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Сохранение...' : saveSuccess ? '✓ Сохранено!' : 'Сохранить профиль'}
                    </button>
                    {errorMsg && <p className="error-msg">{errorMsg}</p>}
                </div>
              )}

              {/* ====== УЧЁТНАЯ ЗАПИСЬ ====== */}
              {activeTab === 'account' && (
                <div className="account-settings-form">
                  <div className="settings-group-card">
                    <div className="account-info-box">
                        <div className="account-info-row">
                            <label>Email</label>
                            <span>{user?.email}</span>
                        </div>
                        <div className="account-info-row">
                            <label>Статус аккаунта</label>
                            <span className="premium-status">Стандартный</span>
                        </div>
                    </div>

                    <div className="account-actions-list" style={{padding: '12px'}}>
                        <button className="account-action-btn-row" onClick={handleComingSoon}>
                            <span>Верификация аккаунта</span>
                            <ChevronRight size={18} />
                        </button>
                        <button className="account-action-btn-row" onClick={handleComingSoon}>
                            <span>Скачать мои данные</span>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="danger-zone-pulse" style={{margin: '12px', background: 'rgba(255, 77, 86, 0.05)'}}>
                        <h4>Управление аккаунтом</h4>
                        <button className="delete-pulse-btn" onClick={handleDeleteAccount}>
                             Удалить учетную запись
                        </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== БЕЗОПАСНОСТЬ ====== */}
              {activeTab === 'security' && (
                <div className="security-edit-form">
                  <div className="settings-group-card" style={{padding: '24px'}}>
                    <div className="security-info-card" style={{marginBottom: '24px'}}>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p className="hint">Аккаунт создан через {user?.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email/Пароль'}</p>
                    </div>

                    {user?.providerData[0]?.providerId !== 'google.com' && (
                      <>
                        <div className="input-group-pulse">
                            <label>Текущий пароль</label>
                            <div className="password-row">
                              <input type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Введите текущий пароль" />
                              <button className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                        </div>
                        <div className="input-group-pulse">
                            <label>Новый пароль</label>
                            <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" />
                        </div>
                        <button className={`save-btn ${saveSuccess ? 'success' : ''}`} onClick={handleChangePassword} disabled={isSaving || !currentPassword || !newPassword}>
                          {isSaving ? 'Обновление...' : saveSuccess ? '✓ Пароль обновлён!' : 'Обновить пароль'}
                        </button>
                      </>
                    )}
                    {errorMsg && <p className="error-msg">{errorMsg}</p>}
                  </div>
                </div>
              )}

              {/* ====== УВЕДОМЛЕНИЯ ====== */}
              {activeTab === 'notifications' && (
                <div className="notifications-form">
                  <div className="settings-group-card" style={{padding: '0 24px'}}>
                    <div className="toggle-setting">
                      <div>
                        <span className="toggle-label">Push-уведомления</span>
                        <p className="toggle-desc">Получать уведомления о новых событиях</p>
                      </div>
                      <div className={`toggle-switch ${pushEnabled ? 'active' : ''}`} onClick={() => {
                        const val = !pushEnabled;
                        setPushEnabled(val);
                        updateUserProfile({ pushEnabled: val } as any);
                      }}>
                        <div className="toggle-knob" />
                      </div>
                    </div>
                    <div className="toggle-setting">
                      <div>
                        <span className="toggle-label">Сообщения</span>
                        <p className="toggle-desc">Уведомлять о новых сообщениях в чатах</p>
                      </div>
                      <div className={`toggle-switch ${msgNotif ? 'active' : ''}`} onClick={() => {
                        const val = !msgNotif;
                        setMsgNotif(val);
                        updateUserProfile({ msgNotif: val } as any);
                      }}>
                        <div className="toggle-knob" />
                      </div>
                    </div>
                    <div className="toggle-setting" style={{borderBottom: 'none'}}>
                      <div>
                        <span className="toggle-label">Лайки</span>
                        <p className="toggle-desc">Уведомлять когда кто-то лайкнул ваш пост</p>
                      </div>
                      <div className={`toggle-switch ${likeNotif ? 'active' : ''}`} onClick={() => {
                        const val = !likeNotif;
                        setLikeNotif(val);
                        updateUserProfile({ likeNotif: val } as any);
                      }}>
                        <div className="toggle-knob" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== ПРИВАТНОСТЬ ====== */}
              {activeTab === 'privacy' && (
                <div className="privacy-form">
                    <div className="settings-group-card" style={{padding: '0 24px'}}>
                        <div className="toggle-setting" style={{borderBottom: 'none'}}>
                          <div>
                            <span className="toggle-label">Скрыть местоположение</span>
                            <p className="toggle-desc">Другие пользователи не увидят вас на карте</p>
                          </div>
                          <div className={`toggle-switch ${hideLocation ? 'active' : ''}`} onClick={() => {
                            const val = !hideLocation;
                            setHideLocation(val);
                            updateUserProfile({ hideLocation: val });
                          }}>
                            <div className="toggle-knob" />
                          </div>
                        </div>
                    </div>
                    <div className="settings-group-card" style={{padding: '24px', background: 'linear-gradient(135deg, rgba(0, 100, 224, 0.1), transparent)', border: '1px solid rgba(0, 100, 224, 0.2)', marginTop: '20px'}}>
                        <div style={{display: 'flex', alignItems: 'center', marginBottom: '16px'}}>
                            <Shield size={32} color="var(--privacy-accent)" style={{marginRight: '16px'}} />
                            <div>
                                <h4 style={{margin: 0, fontSize: '16px'}}>Центр конфиденциальности</h4>
                                <p style={{margin: 0, fontSize: '13px', opacity: 0.7}}>Управляйте своими данными как в Instagram</p>
                            </div>
                        </div>
                        <button className="go-home-btn" style={{width: '100%', padding: '12px'}} onClick={onOpenPrivacy}>
                            Открыть Центр конфиденциальности
                        </button>
                    </div>
                </div>
              )}

              {/* ====== ПРАВИЛА И УСЛОВИЯ ====== */}
              {activeTab === 'terms' && (
                <div className="legal-content">
                    <div className="legal-nav-local">
                        <button className="legal-pill active">Полный кодекс Pulse</button>
                    </div>

                    <div className="legal-section-box">
                        <h3>1. Условия использования (Terms of Service)</h3>
                        <p className="legal-date">Версия 1.1 — Обновлено 21.04.2026</p>
                        
                        <div className="legal-block">
                            <h4>1.1. Принятие условий</h4>
                            <p>Используя приложение Pulse, вы подтверждаете, что прочитали, поняли и согласны соблюдать данные правила. Приложение предназначено для обмена контентом и доброжелательной коммуникации.</p>
                        </div>

                        <div className="legal-block">
                            <h4>1.2. Регистрация и безопасность</h4>
                            <p>Пользователь несёт единоличную ответственность за все действия, совершённые под его учётной записью. Запрещено использование чужих персональных данных или создание фейковых аккаунтов известных личностей.</p>
                        </div>
                    </div>

                    <div className="legal-section-box">
                        <h3>2. Политика конфиденциальности (Privacy Policy)</h3>
                        <div className="legal-block">
                            <h4>2.1. Сбор данных</h4>
                            <p>Pulse собирает данные о геолокации (для отображения на карте), метаданные контента и информацию о взаимодействиях (лайки, друзья). Мы используем эти данные исключительно для улучшения функциональности приложения.</p>
                        </div>
                        <div className="legal-block">
                            <h4>2.2. Защита информации</h4>
                            <p>Все сообщения и персональные данные хранятся в зашифрованном виде на серверах Google Firebase. Мы никогда не передаём и не продаём ваши данные третьим лицам или рекламным агентствам.</p>
                        </div>
                    </div>

                    <div className="legal-section-box">
                        <h3>3. Авторские права и контент (Copyright Rules)</h3>
                        <div className="legal-block">
                            <h4>3.1. Права на контент пользователя</h4>
                            <p>Вы сохраняете полное право собственности на любой контент (фото, видео, текст), который вы создаёте и публикуете в Pulse. Размещая контент, вы предоставляете Pulse ограниченную лицензию на техническое отображение и распространение вашего контента внутри платформы.</p>
                        </div>
                        <div className="legal-block">
                            <h4>3.2. Собственность Pulse</h4>
                            <p>Дизайн, программный код, логотип и бренд Pulse являются интеллектуальной собственностью разработчика (Dinmuhammed). Любое копирование или реверс-инжиниринг платформы без письменного разрешения запрещены.</p>
                        </div>
                        <div className="legal-block">
                            <h4>3.3. Нарушение авторских прав</h4>
                            <p>Публикация чужого контента без разрешения автора запрещена. Система Pulse автоматически удаляет материалы по жалобе правообладателя после проверки.</p>
                        </div>
                    </div>

                    <div className="copyright-block" style={{ marginTop: '30px', opacity: 0.5 }}>
                        <p>© 2026 Pulse App Ecosystem. All rights reserved.</p>
                        <p>Designed and Built by Dinmuhammed</p>
                    </div>
                </div>
              )}

              {/* ====== О ПРОГРАММЕ ====== */}
              {activeTab === 'about' && (
                <div className="about-section">
                    <div className="settings-group-card" style={{padding: '32px', width: '100%', alignItems: 'center', textAlign: 'center'}}>
                        <div className="about-logo-block">
                          <div className="about-logo">P</div>
                          <h3>Pulse</h3>
                          <p className="version-text">Версия 1.0.0</p>
                        </div>
                        
                        <div className="about-info-list">
                          <div className="about-info-item">
                            <span>Платформа</span>
                            <span className="value">Progressive Web App</span>
                          </div>
                          <div className="about-info-item">
                            <span>Технологии</span>
                            <span className="value">React, Firebase, Vite</span>
                          </div>
                          <div className="about-info-item">
                            <span>Разработчик</span>
                            <span className="value">Dinmuhammed</span>
                          </div>
                          <div className="about-info-item" style={{borderBottom: 'none'}}>
                            <span>Год</span>
                            <span className="value">2026</span>
                          </div>
                        </div>

                        <div className="copyright-block" style={{borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '24px', paddingTop: '16px'}}>
                          <p>© 2026 Pulse App. Все права защищены.</p>
                          <p style={{fontSize: '11px', marginTop: '8px', opacity: 0.6}}>Использование данного приложения регулируется условиями, изложенными в разделе «Правила и условия».</p>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </main>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
