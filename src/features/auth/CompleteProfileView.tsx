import React, { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle } from 'lucide-react';
import { uploadMedia } from '../../lib/upload';
import { usePulseStore } from '../../store/useStore';
import './CompleteProfileView.css';

interface CompleteProfileViewProps {
    onComplete: () => void;
    initialEmail?: string;
}

export const CompleteProfileView: React.FC<CompleteProfileViewProps> = ({ onComplete, initialEmail }) => {
    const defaultUsername = initialEmail ? initialEmail.split('@')[0] : '';
    
    const [username, setUsername] = useState(defaultUsername);
    const [bio, setBio] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { updateUserProfile } = usePulseStore();
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleComplete = async () => {
        if (!username.trim() || username.length < 3) {
            alert("Имя пользователя должно содержать минимум 3 символа.");
            return;
        }

        setIsUploading(true);
        try {
            let avatarUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0a0a0'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
            if (avatarFile) {
                avatarUrl = await uploadMedia(avatarFile);
            }

            await updateUserProfile({
                username: username.trim(),
                bio: bio.trim(),
                photoURL: avatarUrl,
                isProfileComplete: true // Flag to check if they finished onboarding
            });
            
            onComplete();
        } catch (error) {
            console.error("Profile complete error:", error);
            alert("Произошла ошибка при сохранении профиля.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="complete-profile-container">
            <div className="complete-profile-card">
                <h1>Настройка профиля</h1>
                <p>Как вас будут видеть другие пользователи?</p>
                
                <div className="avatar-upload-section" onClick={() => fileInputRef.current?.click()}>
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="avatar-preview" />
                    ) : (
                        <div className="avatar-placeholder">
                            <Camera size={32} />
                        </div>
                    )}
                    <div className="avatar-upload-icon">
                        <Camera size={16} />
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />
                </div>

                <div className="profile-input-group">
                    <label>Имя пользователя (Никнейм)</label>
                    <input 
                        type="text" 
                        className="profile-input" 
                        placeholder="@username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} // No spaces allowed
                    />
                </div>

                <div className="profile-input-group">
                    <label>О себе (Опционально)</label>
                    <textarea 
                        className="profile-input" 
                        placeholder="Расскажите немного о себе..." 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={150}
                    />
                </div>

                <button 
                    className="profile-submit-btn" 
                    onClick={handleComplete} 
                    disabled={isUploading || username.length < 3}
                >
                    {isUploading ? <Loader2 className="spin" size={20} /> : (
                        <>
                            <span>Сохранить и войти</span>
                            <CheckCircle size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
