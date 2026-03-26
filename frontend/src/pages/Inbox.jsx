import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const Inbox = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [echoInstance, setEchoInstance] = useState(null);
    const messagesEndRef = React.useRef(null);

    // Initialize Echo with Tenant Settings
    useEffect(() => {
        const initEcho = async () => {
            try {
                const { data: tenant } = await api.get('/tenant/settings');
                
                if (tenant.pusher_app_key && tenant.pusher_app_cluster) {
                    window.Echo = new Echo({
                        broadcaster: 'pusher',
                        key: tenant.pusher_app_key, // Kept 'tenant' as it's defined above
                        cluster: tenant.pusher_app_cluster, // Kept 'tenant' as it's defined above
                        forceTLS: true,
                        authEndpoint: 'http://127.0.0.1:8001/api/broadcasting/auth', // Standard Laravel
                        auth: {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    });

                    setEchoInstance(echo);

                    echo.private(`tenant.${tenant.id}`)
                        .listen('MessageReceived', (e) => {
                            console.log('Real-time message received:', e.message);
                            handleIncomingMessage(e.message);
                        });
                }
            } catch (err) {
                console.error('Failed to initialize real-time sync', err);
            }
        };

        initEcho();
        return () => echoInstance?.disconnect();
    }, []);

    const handleIncomingMessage = (newMsg) => {
        // Update messages if this chat is selected
        setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
        });

        // Update chats list (move to top and update snippet)
        setChats(prev => {
            const index = prev.findIndex(c => c.id === newMsg.chat_id);
            if (index === -1) {
                // Fetch chats again if it's a new contact
                return prev;
            }
            const updatedChats = [...prev];
            updatedChats[index] = {
                ...updatedChats[index],
                messages: [...(updatedChats[index].messages || []), newMsg],
                updated_at: new Date().toISOString()
            };
            return updatedChats.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await api.get('/chats');
                setChats(res.data);
                
                // If a chat is selected, update it too
                if (selectedChat) {
                    const updatedSelected = res.data.find(c => c.id === selectedChat.id);
                    if (updatedSelected) {
                        setSelectedChat(updatedSelected);
                    }
                } else if (res.data.length > 0) {
                    setSelectedChat(res.data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch chats', err);
            }
        };

        fetchChats();
    }, []);

    useEffect(() => {
        if (selectedChat) {
            setMessages(selectedChat.messages || []);
        }
    }, [selectedChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedChat) return;

        try {
            const res = await api.post(`/chats/${selectedChat.id}/send`, {
                message_body: inputText
            });
            setMessages([...messages, res.data]);
            setInputText('');
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    return (
        <div className="flex bg-surface-container h-[calc(100vh-100px)] -mt-6 -mx-8 overflow-hidden">
            {/* Left Column: Chat List (25%) */}
            <section className="w-1/4 bg-surface-container-low flex flex-col h-full border-r border-outline-variant/10">
                <div className="p-6 space-y-4">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                        <input className="w-full bg-surface-container-highest border-none rounded-xl py-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Search conversations..." type="text"/>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pb-6">
                    {chats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale px-6 text-center">
                             <span className="material-symbols-outlined text-5xl mb-2">forum</span>
                             <p className="text-xs font-bold uppercase tracking-widest">No conversations yet</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div 
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`mx-3 mb-2 p-4 rounded-2xl flex gap-3 cursor-pointer transition-all group ${
                                    selectedChat?.id === chat.id 
                                    ? 'bg-surface-container-lowest shadow-sm ring-1 ring-primary/5' 
                                    : 'hover:bg-surface-container-highest/50'
                                }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                        {chat.contact?.first_name?.[0] || chat.contact?.phone_number?.[1] || '?'}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary-container border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className="font-semibold text-sm truncate">{chat.contact?.first_name || chat.contact?.phone_number}</h3>
                                        <span className="text-[10px] text-on-surface-variant font-medium">
                                            {chat.messages?.length > 0 ? new Date(chat.messages[chat.messages.length - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant truncate">
                                        {chat.messages?.[chat.messages.length - 1]?.message_body || 'No messages yet'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Middle Column: Chat Window (50%) */}
            <section className="w-1/2 bg-surface-container flex flex-col h-full shadow-[inset_0_0_20px_rgba(20,29,36,0.02)]">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <header className="px-8 h-20 bg-surface/40 backdrop-blur-md flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center">
                                     <span className="material-symbols-outlined text-on-surface-variant">person</span>
                                </div>
                                <div>
                                    <h2 className="font-headline font-bold text-base leading-tight">
                                        {selectedChat.contact?.first_name ? `${selectedChat.contact.first_name} ${selectedChat.contact.last_name || ''}` : selectedChat.contact?.phone_number}
                                    </h2>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                                        <span className="text-[10px] font-medium text-on-surface-variant tracking-wide uppercase">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors">
                                    <span className="material-symbols-outlined">search</span>
                                </button>
                                <button className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 hover:shadow-lg transition-all active:scale-95">
                                    Resolve
                                </button>
                            </div>
                        </header>

                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col">
                            <div className="self-center py-1 px-4 bg-surface-container-high/50 rounded-full text-[10px] font-semibold text-on-surface-variant tracking-widest uppercase mb-4">Today</div>
                            
                            {messages.map((msg, i) => (
                                <div 
                                    key={i} 
                                    className={`max-w-[80%] flex flex-col gap-1 ${msg.sender_type === 'contact' ? 'items-start' : 'items-end self-end'}`}
                                >
                                    <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                        msg.sender_type === 'contact' 
                                            ? 'bg-surface-container-lowest text-on-surface rounded-tl-none' 
                                            : 'bg-primary/5 border border-primary/10 text-on-surface rounded-tr-none'
                                    }`}>
                                        {msg.message_body}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-1 font-medium opacity-60">
                                        <span className="text-[10px] text-on-surface-variant">
                                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                        </span>
                                        {msg.sender_type !== 'contact' && (
                                            <span className="material-symbols-outlined text-sm text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input Area */}
                        <footer className="p-6 bg-surface/60 backdrop-blur-md border-t border-outline-variant/10">
                            <form onSubmit={handleSendMessage} className="bg-surface-container-lowest rounded-2xl shadow-xl shadow-on-surface/5 p-2">
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-outline-variant/10">
                                    <button type="button" className="p-1.5 text-on-surface-variant hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined">attachment</span>
                                    </button>
                                    <button type="button" className="p-1.5 text-on-surface-variant hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined">mood</span>
                                    </button>
                                </div>
                                <div className="flex items-end gap-3 p-3">
                                    <textarea 
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-2 placeholder:text-on-surface-variant/50" 
                                        placeholder="Type a message..." 
                                        rows="1"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                    ></textarea>
                                    <button 
                                        type="submit"
                                        className="w-10 h-10 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/20 active:scale-90 transition-transform"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                                    </button>
                                </div>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-on-surface-variant">
                        <div className="text-center space-y-2">
                            <span className="material-symbols-outlined text-6xl opacity-20">chat_bubble</span>
                            <p className="font-medium">Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </section>

            {/* Right Column: Contact Info (25%) */}
            <section className="w-1/4 bg-surface-container-low flex flex-col h-full overflow-y-auto border-l border-outline-variant/10">
                <header className="p-6 h-20 flex items-center flex-shrink-0">
                    <h2 className="font-headline font-bold text-lg text-on-surface">Contact Info</h2>
                </header>
                {selectedChat ? (
                    <div className="px-6 pb-8 space-y-8">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-2xl relative bg-surface-container-highest flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
                                <div className="absolute bottom-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                    <span className="material-symbols-outlined text-[#25D366] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{selectedChat.contact?.first_name} {selectedChat.contact?.last_name}</h3>
                                <p className="text-sm text-on-surface-variant">{selectedChat.contact?.phone_number}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {selectedChat.contact?.tags?.length > 0 ? (
                                    selectedChat.contact.tags.split(',').map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold rounded-full">{tag}</span>
                                    ))
                                ) : (
                                    <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[11px] font-bold rounded-full">No tags</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-surface-container-highest rounded-xl flex items-center justify-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-xl">mail</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Email</p>
                                    <p className="text-sm font-medium">{selectedChat.contact?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-surface-container-highest rounded-xl flex items-center justify-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-xl">calendar_month</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Created At</p>
                                    <p className="text-sm font-medium">{new Date(selectedChat.contact?.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center text-on-surface-variant italic">Select a contact to see details</div>
                )}
            </section>
        </div>
    );
};

export default Inbox;
