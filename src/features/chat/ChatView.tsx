import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, ChevronLeft, Send, Phone, Video, X, Mic, MicOff, Volume2 } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import type { Message, Chat } from '../../types';
import { auth } from '../../lib/firebase';
import './ChatView.css';

type ChatFilter = 'all' | 'direct' | 'community';

const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

export const ChatView: React.FC = () => {
    const { sendMessage, listenToMessages, chats, createDirectChat, searchUsers } = usePulseStore();
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [filter, setFilter] = useState<ChatFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video'; name: string; avatar: string } | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const callTimerRef = useRef<any>(null);

    const myId = auth.currentUser?.uid || '';

    const filteredChats = useMemo(() => {
        return chats.filter(chat => {
            const matchesFilter = filter === 'all' || chat.type === filter;
            const otherUserId = chat.participants?.find((p: string) => p !== myId) || '';
            const chatName = chat.participantNames?.[otherUserId] || 'Чат';
            const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [chats, filter, searchQuery, myId]);

    useEffect(() => {
        if (activeChat) {
            const unsub = listenToMessages(activeChat.id, (msgs: Message[]) => {
                setMessages(msgs);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            });
            return () => unsub();
        }
    }, [activeChat, listenToMessages]);

    // Search users for new chat
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (userSearchQuery.trim().length >= 2) {
                setSearching(true);
                const results = await searchUsers(userSearchQuery);
                setSearchResults(results);
                setSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [userSearchQuery, searchUsers]);

    // Call timer
    useEffect(() => {
        if (activeCall) {
            setCallDuration(0);
            callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
        }
        return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
    }, [activeCall]);

    const handleSend = () => {
        if (!inputText.trim() || !activeChat) return;
        sendMessage(activeChat.id, inputText);
        setInputText('');
    };

    const handleStartChat = async (user: any) => {
        const chat = await createDirectChat(user.id, user.username || user.displayName || 'User', user.photoURL || '');
        if (chat) {
            setActiveChat(chat);
            setShowNewChat(false);
            setUserSearchQuery('');
            setSearchResults([]);
        }
    };

    const startCall = (type: 'audio' | 'video') => {
        alert("Звонки находятся в разработке. Ожидайте в будущих обновлениях!");
    };

    const endCall = () => {
        setActiveCall(null);
        setIsMuted(false);
    };

    const formatTime = (ts: any) => {
        if (!ts?.seconds) return '';
        const d = new Date(ts.seconds * 1000);
        return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    };

    const formatCallDuration = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    // ====== CALL UI ======
    if (activeCall) {
        return (
            <div className="call-overlay">
                <img src={activeCall.avatar || 'data:image/svg+xml,...'} className="call-avatar" alt="" />
                <div className="call-status">
                    <h2>{activeCall.name}</h2>
                    <p>{activeCall.type === 'video' ? '📹 Видеозвонок' : '📞 Аудиозвонок'} — {formatCallDuration(callDuration)}</p>
                </div>
                <div className="call-actions">
                    <button className={`call-action-btn mute-btn ${isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)}>
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button className="call-action-btn end-call" onClick={endCall}>
                        <Phone size={24} style={{ transform: 'rotate(135deg)' }} />
                    </button>
                    <button className="call-action-btn speaker-btn">
                        <Volume2 size={24} />
                    </button>
                </div>
            </div>
        );
    }

    // ====== NEW CHAT MODAL ======
    if (showNewChat) {
        return (
            <div className="new-chat-modal">
                <div className="new-chat-header">
                    <button className="back-btn" onClick={() => { setShowNewChat(false); setUserSearchQuery(''); setSearchResults([]); }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h2>Новый чат</h2>
                </div>
                <input
                    className="new-chat-search"
                    type="text"
                    placeholder="Поиск по имени пользователя..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    autoFocus
                />
                <div className="users-list">
                    {searching && <p style={{ color: '#555', padding: '20px', textAlign: 'center' }}>Ищем...</p>}
                    {!searching && searchResults.length === 0 && userSearchQuery.length >= 2 && (
                        <p style={{ color: '#555', padding: '20px', textAlign: 'center' }}>Пользователи не найдены</p>
                    )}
                    {(searchResults || []).map((user: any) => (
                        <div key={user.id} className="user-item" onClick={() => handleStartChat(user)}>
                            <img src={user.photoURL || NEUTRAL_AVATAR} alt="" />
                            <div className="user-item-info">
                                <span className="username">@{user.username}</span>
                                <span className="bio">{user.bio || 'Пользователь Pulse'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ====== CHAT DETAIL VIEW ======
    if (activeChat) {
        const otherUserId = activeChat.participants?.find((p: string) => p !== myId) || '';
        const chatName = activeChat.participantNames?.[otherUserId] || 'Чат';
        const chatAvatar = activeChat.participantAvatars?.[otherUserId] || '';

        return (
            <div className="chat-detail-view">
                <header className="chat-header-detailed">
                    <button className="back-btn" onClick={() => setActiveChat(null)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div className="header-info">
                        <img src={chatAvatar || NEUTRAL_AVATAR} className="header-avatar" alt="" />
                        <div className="text-info">
                            <span className="name">{chatName}</span>
                            <span className="status">{activeChat.type === 'community' ? 'Сообщество' : 'В сети'}</span>
                        </div>
                    </div>
                    <div className="header-actions-right">
                        <button className="call-btn" onClick={() => startCall('audio')}>
                            <Phone size={20} />
                        </button>
                        <button className="call-btn" onClick={() => startCall('video')}>
                            <Video size={20} />
                        </button>
                    </div>
                </header>

                <div className="messages-area-detailed">
                    <div className="system-msg">Сегодня</div>
                    {(messages || []).map((m) => (
                        <div key={m.id} className={`msg-bubble-wrap ${m.senderId === myId ? 'sent' : 'received'}`}>
                            <div className="msg-bubble">
                                {m.senderId !== myId && activeChat.type === 'community' && (
                                    <span className="sender-name">{m.senderName}</span>
                                )}
                                <p>{m.text}</p>
                                <span className="msg-time-small">{formatTime(m.timestamp)}</span>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="empty-chat-placeholder">
                            <p>Начните общение! 💬</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-row">
                    <input 
                        type="text" 
                        placeholder="Сообщение..." 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    {inputText.trim() ? (
                        <button className="send-btn" onClick={handleSend}><Send size={18} /></button>
                    ) : (
                        <button className="action-btn"><Mic size={22} /></button>
                    )}
                </div>
            </div>
        );
    }

    // ====== CHAT LIST VIEW ======
    return (
        <div className="chat-container">
            <header className="chat-list-header">
                <h1>Чаты</h1>
                <div className="header-tools">
                    <button className="tool-btn" onClick={() => setShowNewChat(true)}><Plus size={22} /></button>
                </div>
            </header>

            <div className="chat-pills">
                <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Все</button>
                <button className={`pill ${filter === 'direct' ? 'active' : ''}`} onClick={() => setFilter('direct')}>Личные</button>
                <button className={`pill ${filter === 'community' ? 'active' : ''}`} onClick={() => setFilter('community')}>Группы</button>
            </div>

            <div className="chats-list-scroll">
                {filteredChats.length === 0 ? (
                    <div className="empty-chat-list">
                        {chats.length === 0 ? (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '40px', marginBottom: '12px' }}>💬</p>
                                <p>У вас пока нет чатов</p>
                                <p style={{ fontSize: '13px', color: '#444', marginTop: '8px' }}>Нажмите + чтобы начать общение</p>
                            </div>
                        ) : 'Чаты не найдены'}
                    </div>
                ) : (
                    (filteredChats || []).map(chat => {
                        const otherUserId = (chat.participants || []).find((p: string) => p !== myId) || '';
                        const chatName = chat.participantNames?.[otherUserId] || 'Чат';
                        const chatAvatar = chat.participantAvatars?.[otherUserId] || '';

                        return (
                            <div key={chat.id} className="chat-item-premium" onClick={() => setActiveChat(chat)}>
                                <div className="avatar-wrapper">
                                    <img src={chatAvatar || NEUTRAL_AVATAR} className="avatar-img" alt={chatName} />
                                    {chat.type === 'community' && <div className="community-badge">P</div>}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-top">
                                        <span className="chat-name">{chatName}</span>
                                        <span className="chat-time">{formatTime(chat.lastTime)}</span>
                                    </div>
                                    <div className="chat-bottom">
                                        <p className="chat-msg">{chat.lastMsg || 'Нет сообщений'}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
