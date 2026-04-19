import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, ChevronLeft, Send, Camera, Mic, MoreVertical } from 'lucide-react';
import { usePulseStore } from '../../store/useStore';
import type { Message } from '../../types';
import { auth } from '../../lib/firebase';
import './ChatView.css';

interface Chat {
    id: string;
    name: string;
    lastMsg: string;
    lastTime: any;
    avatar: string;
    type: 'community' | 'direct';
    unread?: number;
}

type ChatFilter = 'all' | 'direct' | 'community';

export const ChatView: React.FC = () => {
    const { sendMessage, listenToMessages } = usePulseStore();
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [filter, setFilter] = useState<ChatFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const chats: Chat[] = [
        { 
            id: 'global_almaty', 
            name: 'Almaty Community', 
            lastMsg: 'Добро пожаловать в Pulse! 🚀', 
            lastTime: '12:45', 
            avatar: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=200&h=200&fit=crop',
            type: 'community',
            unread: 3
        },
        { 
            id: 'direct_pulse_team', 
            name: 'Pulse Support', 
            lastMsg: 'Как вам наше обновление?', 
            lastTime: 'Вчера', 
            avatar: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=200&h=200&fit=crop',
            type: 'direct' 
        }
    ];

    const filteredChats = useMemo(() => {
        return chats.filter(chat => {
            const matchesFilter = filter === 'all' || chat.type === filter;
            const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [filter, searchQuery]);

    useEffect(() => {
        if (activeChat) {
            const unsub = listenToMessages(activeChat.id, (msgs: Message[]) => {
                setMessages(msgs);
            });
            return () => unsub();
        }
    }, [activeChat, listenToMessages]);

    const handleSend = () => {
        if (!inputText.trim() || !activeChat) return;
        sendMessage(activeChat.id, inputText);
        setInputText('');
    };

    if (activeChat) {
        return (
            <div className="chat-detail-view glass-main">
                <header className="chat-header-detailed">
                    <button className="back-btn" onClick={() => setActiveChat(null)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div className="header-info">
                        <img src={activeChat.avatar} className="header-avatar" alt="" />
                        <div className="text-info">
                            <span className="name">{activeChat.name}</span>
                            <span className="status">{activeChat.type === 'community' ? '2.4k участников' : 'В сети'}</span>
                        </div>
                    </div>
                    <button className="more-btn"><MoreVertical size={20} /></button>
                </header>

                <div className="messages-area-detailed">
                    <div className="system-msg">Сегодня</div>
                    {messages.map((m) => (
                        <div key={m.id} className={`msg-bubble-wrap ${m.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`}>
                            <div className="msg-bubble">
                                {m.senderId !== auth.currentUser?.uid && activeChat.type === 'community' && (
                                    <span className="sender-name">{m.senderName}</span>
                                )}
                                <p>{m.text}</p>
                                <span className="msg-time-small">12:30</span>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="empty-chat-placeholder">
                            <p>Начните общение в {activeChat.name}</p>
                        </div>
                    )}
                </div>

                <div className="chat-input-row">
                    <button className="action-btn" onClick={() => alert("Прикрепление файлов скоро появится!")}><Plus size={22} /></button>
                    <input 
                        type="text" 
                        placeholder="Напишите сообщение..." 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    {inputText.trim() ? (
                        <button className="send-btn" onClick={handleSend}><Send size={18} /></button>
                    ) : (
                        <div className="input-tools">
                            <button className="action-btn" onClick={() => alert("Камера в чате скоро появится!")}><Camera size={22} /></button>
                            <button className="action-btn"><Mic size={22} /></button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <header className="chat-list-header">
                <h1>Чаты</h1>
                <div className="header-tools">
                    <div className={`search-input-wrap ${searchQuery ? 'active' : ''}`}>
                        <input 
                            type="text" 
                            placeholder="Поиск..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="tool-btn"><Search size={22} /></button>
                    </div>
                    <button className="tool-btn" onClick={() => alert("Создание новых групп скоро появится!")}><Plus size={22} /></button>
                </div>
            </header>

            <div className="chat-pills">
                <button 
                    className={`pill ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Все
                </button>
                <button 
                    className={`pill ${filter === 'direct' ? 'active' : ''}`}
                    onClick={() => setFilter('direct')}
                >
                    Личные
                </button>
                <button 
                    className={`pill ${filter === 'community' ? 'active' : ''}`}
                    onClick={() => setFilter('community')}
                >
                    Группы
                </button>
                <button className="pill">Каналы</button>
            </div>

            <div className="chats-list-scroll">
                {filteredChats.length === 0 ? (
                    <div className="empty-chat-list">Чаты не найдены</div>
                ) : (
                    filteredChats.map(chat => (
                        <div key={chat.id} className="chat-item-premium" onClick={() => setActiveChat(chat)}>
                            <div className="avatar-wrapper">
                                <img src={chat.avatar} className="avatar-img" alt={chat.name} />
                                {chat.type === 'community' && <div className="community-badge">P</div>}
                            </div>
                            <div className="chat-info">
                                <div className="chat-top">
                                    <span className="chat-name">{chat.name}</span>
                                    <span className="chat-time">{chat.lastTime}</span>
                                </div>
                                <div className="chat-bottom">
                                    <p className="chat-msg">{chat.lastMsg}</p>
                                    {chat.unread && <div className="unread-count">{chat.unread}</div>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
