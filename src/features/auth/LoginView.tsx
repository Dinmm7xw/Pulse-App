import React, { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { Phone, Mail, Search as Google, ArrowLeft, Loader2 } from 'lucide-react';
import './LoginView.css';

interface LoginViewProps {
    onLogin: () => void;
}

type AuthMode = 'options' | 'phone' | 'otp' | 'email' | 'reset';

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<AuthMode>('options');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    useEffect(() => {
        // Initialize Recaptcha when switching to phone mode
        if (mode === 'phone' && !(window as any).recaptchaVerifier) {
            try {
                (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                    'callback': () => {}
                });
            } catch (e) {
                console.error("Recaptcha init error:", e);
            }
        }
    }, [mode]);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login error:", error);
            alert("Ошибка входа с Google.");
        }
    };

    const requestOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            alert("Введите корректный номер телефона (например, +77012345678)");
            return;
        }
        
        setIsLoading(true);
        try {
            const appVerifier = (window as any).recaptchaVerifier;
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(result);
            setMode('otp');
        } catch (error: any) {
            console.error("SMS error:", error);
            alert("Ошибка отправки SMS. Убедитесь, что номер верный и Phone Auth включен в Firebase.");
            // Reset recaptcha on error so user can try again
            if ((window as any).recaptchaVerifier && (window as any).grecaptcha) {
                (window as any).recaptchaVerifier.render().then((widgetId: any) => {
                    (window as any).grecaptcha.reset(widgetId);
                }).catch((e: any) => console.error("Recaptcha reset error", e));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async () => {
        if (!otp || otp.length < 6 || !confirmationResult) return;
        
        setIsLoading(true);
        try {
            await confirmationResult.confirm(otp);
        } catch (error) {
            console.error("OTP Error:", error);
            alert("Неверный код подтверждения.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async () => {
        if (!email || password.length < 6) {
            alert("Пожалуйста, введите корректный email и пароль (минимум 6 символов).");
            return;
        }
        setIsLoading(true);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error: any) {
            console.error("Email auth error:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("Этот Email уже зарегистрирован. Попробуйте войти.");
            } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                alert("Неверный Email или пароль.");
            } else {
                alert("Ошибка аутентификации. Проверьте данные.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            alert("Пожалуйста, введите ваш Email для восстановления.");
            return;
        }
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Ссылка для сброса пароля отправлена на " + email);
            setMode('options'); // Возвращаем в начальное меню
        } catch (error: any) {
            console.error("Reset error:", error);
            if (error.code === 'auth/user-not-found') {
                alert("Пользователь с таким Email не найден.");
            } else {
                alert("Ошибка при отправке письма для сброса пароля.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                {mode === 'options' && (
                    <div className="logo-section">
                        <div className="pulse-logo-large"></div>
                        <h1>Pulse</h1>
                        <p>Карта твоего ритма. Энергия города в твоих руках.</p>
                    </div>
                )}

                {mode === 'options' && (
                    <div className="auth-methods">
                        <button className="auth-btn google" onClick={loginWithGoogle}>
                            <Google size={20} />
                            <span>Продолжить с Google</span>
                        </button>
                        
                        <div className="divider">
                            <span>или</span>
                        </div>

                        <button className="auth-btn phone" onClick={() => setMode('phone')}>
                            <Phone size={20} />
                            <span>По номеру телефона</span>
                        </button>

                        <button className="auth-btn mail" onClick={() => setMode('email')}>
                            <Mail size={20} />
                            <span>Электронная почта</span>
                        </button>
                    </div>
                )}

                {mode === 'phone' && (
                    <div className="auth-step-container">
                        <button className="back-btn" onClick={() => setMode('options')}><ArrowLeft size={24} /></button>
                        <h2>Ваш телефон</h2>
                        <p>Мы отправим вам SMS с кодом подтверждения.</p>
                        
                        <input 
                            type="tel" 
                            className="auth-input" 
                            placeholder="+7 777 000 00 00" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            autoFocus
                        />
                        
                        <button className="auth-submit-btn" onClick={requestOtp} disabled={isLoading}>
                            {isLoading ? <Loader2 className="spin" size={20} /> : 'Получить код'}
                        </button>
                        <div id="recaptcha-container"></div>
                    </div>
                )}

                {mode === 'otp' && (
                    <div className="auth-step-container">
                         <button className="back-btn" onClick={() => setMode('phone')}><ArrowLeft size={24} /></button>
                        <h2>Код из SMS</h2>
                        <p>Введите 6-значный код, отправленный на {phoneNumber}</p>
                        
                        <input 
                            type="number" 
                            className="auth-input otp-input" 
                            placeholder="000000" 
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            autoFocus
                        />
                        
                        <button className="auth-submit-btn" onClick={verifyOtp} disabled={isLoading || otp.length < 6}>
                            {isLoading ? <Loader2 className="spin" size={20} /> : 'Подтвердить'}
                        </button>
                    </div>
                )}

                {mode === 'email' && (
                    <div className="auth-step-container">
                        <button className="back-btn" onClick={() => setMode('options')}><ArrowLeft size={24} /></button>
                        <h2>{isSignUp ? 'Регистрация' : 'Вход по Email'}</h2>
                        <p>{isSignUp ? 'Создайте новый аккаунт' : 'С возвращением в Pulse!'}</p>
                        
                        <input 
                            type="email" 
                            className="auth-input" 
                            placeholder="Ваш Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input 
                            type="password" 
                            className="auth-input" 
                            placeholder="Пароль (от 6 символов)" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        
                        <button className="auth-submit-btn" onClick={handleEmailAuth} disabled={isLoading}>
                            {isLoading ? <Loader2 className="spin" size={20} /> : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
                        </button>

                        <div style={{ marginTop: '15px', fontSize: '14px' }}>
                            <span 
                                style={{ color: 'white', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => setMode('reset')}
                            >
                                Забыли пароль?
                            </span>
                        </div>

                        <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-dim)' }}>
                            {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
                            <span 
                                style={{ color: 'white', marginLeft: '5px', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => setIsSignUp(!isSignUp)}
                            >
                                {isSignUp ? 'Войти' : 'Создать'}
                            </span>
                        </div>
                    </div>
                )}

                {mode === 'reset' && (
                    <div className="auth-step-container">
                        <button className="back-btn" onClick={() => setMode('options')}><ArrowLeft size={24} /></button>
                        <h2>Сброс пароля</h2>
                        <p>Введите Email, который вы указывали при регистрации.</p>
                        
                        <input 
                            type="email" 
                            className="auth-input" 
                            placeholder="Ваш Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        
                        <button className="auth-submit-btn" onClick={handleResetPassword} disabled={isLoading}>
                            {isLoading ? <Loader2 className="spin" size={20} /> : 'Восстановить пароль'}
                        </button>
                    </div>
                )}

                {mode === 'options' && (
                    <footer className="login-footer">
                        <p>Нажимая «Продолжить», вы соглашаетесь с нашими <br /> <span>Условиями использования</span> и <span>Политикой конфиденциальности</span></p>
                    </footer>
                )}
            </div>
        </div>
    );
};
