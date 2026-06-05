import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Send, ArrowLeft, Search, MessageSquare, Phone, MapPin, Bell, X,
    User, Mail, Building2, ChevronDown, Shield, Filter, Users
} from 'lucide-react';
import { chatService, managerService, userService, adminService } from '../../services/api';
import { useAuth } from '../../hooks';
import { useSearchParams } from 'react-router-dom';
import { formatRelativeTime } from '../../utils';
import { STATES, getDistricts } from '../../data/indiaLocations';
import { OfferMessageBubble } from '../../components/property/OfferMessageBubble';
import Avatar from '../../components/ui/Avatar';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

const isManagerRole = (role) => role === 'MANAGER' || role === 'ADMIN';

const isOwnMessage = (msg, user) => {
    if (!msg || !user) return false;
    const currentUserId = user.id || user.userId || user._id;
    const msgSender = msg.senderId || msg.sender_id || (msg.sender && (typeof msg.sender === 'object' ? (msg.sender.id || msg.sender.userId || msg.sender._id) : msg.sender)) || msg.creatorId || msg.userId;
    if (!currentUserId || !msgSender) return false;
    return String(msgSender).trim().toLowerCase() === String(currentUserId).trim().toLowerCase();
};

/* ─── Location Selector (for regular users) ─── */
const LocationSelector = ({ onContact, isPending }) => {
    const [state, setState] = useState('');

    const handleFind = () => {
        if (!state) { toast.error('Select a state first'); return; }
        onContact(state);
    };

    return (
        <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-royal-400" /> Contact Your Area Manager
            </p>
            <div className="relative">
                <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-surface-hover border border-surface-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-royal-500 appearance-none cursor-pointer"
                >
                    <option value="" className="bg-surface-dark">— Select State —</option>
                    {STATES.map((s) => (
                        <option key={s} value={s} className="bg-surface-dark">{s}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
            {state && (
                <button
                    onClick={handleFind}
                    disabled={isPending}
                    className="w-full py-2 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                >
                    {isPending ? 'Connecting...' : `Find Manager for ${state}`}
                </button>
            )}
        </div>
    );
};

/* ─── Admin Contact Button (for managers) ─── */
const AdminContactPanel = ({ onContact, isPending }) => (
    <div className="space-y-2 pt-1">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> Admin Channel
        </p>
        <button
            onClick={onContact}
            disabled={isPending}
            className="w-full py-2 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
            <Shield className="w-3.5 h-3.5" />
            {isPending ? 'Opening...' : 'Open Admin Chat'}
        </button>
    </div>
);

/* ─── Admin Start Manager Chat (for admin) ─── */
const AdminManagerPanel = ({ managersList, onContact, isPending }) => {
    const [selectedId, setSelectedId] = useState('');
    return (
        <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-royal-400" /> Message a Manager
            </p>
            <div className="relative">
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full bg-surface-hover border border-surface-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-royal-500 appearance-none cursor-pointer"
                >
                    <option value="" className="bg-surface-dark">— Select Manager —</option>
                    {managersList.map((m) => (
                        <option key={m.id} value={m.id} className="bg-surface-dark">
                            {m.name} ({m.cities?.join(', ') || 'No cities'})
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
            {selectedId && (
                <button
                    onClick={() => { onContact(selectedId, managersList); setSelectedId(''); }}
                    disabled={isPending}
                    className="w-full py-2 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                >
                    {isPending ? 'Starting...' : 'Start Chat'}
                </button>
            )}
        </div>
    );
};

/* ─── Conversation Filters (for admin) ─── */
const ConversationFilters = ({ filter, setFilter }) => (
    <div className="flex gap-1.5 flex-wrap">
        {['All', 'Buyer', 'Seller', 'Rental Owner', 'Manager'].map((f) => (
            <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${filter === f
                        ? 'bg-royal-600 text-white'
                        : 'bg-surface-hover text-text-muted hover:text-text-primary'
                    }`}
            >
                {f}
            </button>
        ))}
    </div>
);

/* ═══════════════════════════════════════════ */
const ChatPage = () => {
    const { user } = useAuth();
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const messagesEnd = useRef(null);
    const queryClient = useQueryClient();
    const canViewFullThread = isManagerRole(user?.activeRole);
    const isAdmin = user?.activeRole === 'ADMIN';
    const isManager = user?.activeRole === 'MANAGER';
    const isSeller = user?.activeRole === 'SELLER' || user?.activeRole === 'RENTAL_OWNER';

    // Support auto-selecting a conversation via URL params (e.g. ?userId=xxx)
    const [searchParams, setSearchParams] = useSearchParams();
    const userIdParam = searchParams.get('userId');

    const { data: convData } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => chatService.getConversations().then((r) => r.data),
        refetchInterval: 2000,
        staleTime: 500,
    });

    // Group conversations by otherUser.id to prevent duplicates in the list
    const rawConversations = convData?.conversations || [];
    const groupedConvsMap = new Map();
    for (const conv of rawConversations) {
        const otherId = conv.otherUser?.id;
        if (!otherId) continue;
        if (!groupedConvsMap.has(otherId)) {
            groupedConvsMap.set(otherId, {
                ...conv,
                ids: [conv.id],
                unreadCount: conv.unreadCount || 0
            });
        } else {
            const existing = groupedConvsMap.get(otherId);
            existing.ids.push(conv.id);
            existing.unreadCount += (conv.unreadCount || 0);
            if (new Date(conv.lastMessageAt) > new Date(existing.lastMessageAt)) {
                existing.lastMessage = conv.lastMessage;
                existing.lastMessageAt = conv.lastMessageAt;
                existing.propertyTitle = conv.propertyTitle;
                existing.propertyId = conv.propertyId;
                existing.id = conv.id; // use latest conversation ID for messaging
            }
        }
    }
    const conversations = Array.from(groupedConvsMap.values());

    const { data: managersData } = useQuery({
        queryKey: ['admin-managers-list'],
        queryFn: () => adminService.getManagers().then((r) => r.data),
        enabled: isAdmin,
    });
    const managersList = managersData?.managers || [];

    const { data: msgData } = useQuery({
        queryKey: ['messages', selectedChat?.ids?.join(',')],
        queryFn: async () => {
            if (!selectedChat?.ids) return { messages: [] };
            const results = await Promise.all(
                selectedChat.ids.map(id => chatService.getMessages(id).then(r => r.data?.messages || []))
            );
            const allMsgs = results.flat().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return { messages: allMsgs };
        },
        enabled: !!selectedChat,
        refetchInterval: 1000,
        staleTime: 200,
    });
    const messages = msgData?.messages || [];

    const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

    const sendMutation = useMutation({
        mutationFn: (data) => chatService.sendMessage(selectedChat.id, data),
        onMutate: async (data) => {
            const queryKey = ['messages', selectedChat.ids.join(',')];
            const prev = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (old) => ({
                ...old,
                messages: [...(old?.messages || []), {
                    id: `pending-${Date.now()}`, content: data.content,
                    senderId: user.id, createdAt: new Date().toISOString(), pending: true,
                }],
            }));
            return { prev };
        },
        onError: (_e, _d, ctx) => {
            const queryKey = ['messages', selectedChat.ids.join(',')];
            queryClient.setQueryData(queryKey, ctx.prev);
            toast.error('Failed to send');
        },
        onSuccess: () => {
            const queryKey = ['messages', selectedChat.ids.join(',')];
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });

    /* Start conversation with manager by district */
    const startConvMutation = useMutation({
        mutationFn: (data) => chatService.startConversation(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            const conv = res.data;
            setSelectedChat({ ...conv, ids: conv.ids || [conv.id] });
            toast.success('Connected to your area manager!');
        },
        onError: () => toast.error('Failed to start conversation'),
    });

    /* Manager → contact admin */
    const contactAdminMutation = useMutation({
        mutationFn: () => chatService.contactAdmin(),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            const conv = res.data;
            setSelectedChat({ ...conv, ids: conv.ids || [conv.id] });
            toast.success('Admin chat opened!');
        },
        onError: () => toast.error('Could not reach admin'),
    });

    useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => {
        if (selectedChat) {
            const updated = conversations.find(c => c.otherUser?.id === selectedChat.otherUser?.id);
            if (updated && (updated.id !== selectedChat.id || updated.ids?.length !== selectedChat.ids?.length)) {
                setSelectedChat(updated);
            }
        }
    }, [conversations, selectedChat?.id]);

    // Auto-select conversation when navigated with ?userId=
    useEffect(() => {
        if (userIdParam && conversations.length > 0) {
            const match = conversations.find(c => c.otherUser?.id === userIdParam);
            if (match) {
                setSelectedChat(match);
                // Clean URL param reactively
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('userId');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [userIdParam, conversations, searchParams, setSearchParams]);

    useEffect(() => {
        if (selectedChat && selectedChat.ids) {
            Promise.all(selectedChat.ids.map(id => chatService.markRead(id).catch(() => { })));
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['navbar-conversations'] });
        }
    }, [selectedChat?.ids, messages?.length]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        sendMutation.mutate({ content: message.trim() });
        setMessage('');
    };

    const handleContactManager = async (state) => {
        try {
            const res = await managerService.getManagerByCity(state);
            const manager = res.data?.manager;
            if (!manager) { toast.error(`No manager found for ${state}`); return; }
            const isFallback = !manager.cities?.some(
                (c) => c.toLowerCase() === state.toLowerCase()
            );
            startConvMutation.mutate({
                otherUserId: manager.id,
                propertyId: 'general',
                propertyTitle: isFallback
                    ? `Support — ${state} (via ${manager.name})`
                    : `Support — ${state}`,
                message: `Hi, I need assistance regarding properties in ${state}.`,
            });
        } catch {
            toast.error('Could not find a manager for this state');
        }
    };

    const handleContactAdmin = () => contactAdminMutation.mutate();

    const handleContactSelectedManager = (mgId, list) => {
        const mgr = list.find((m) => m.id === mgId);
        if (!mgr) return;
        startConvMutation.mutate({
            otherUserId: mgr.id,
            propertyId: 'general',
            propertyTitle: `Admin ↔ ${mgr.name}`,
            message: `Hi ${mgr.name}, admin here. Let's sync up.`,
        });
    };

    const handleUserClick = async (userId) => {
        if (!userId || !canViewFullThread) return;
        try {
            const res = await userService.getUser(userId);
            setSelectedUserDetail(res.data);
            setShowUserModal(true);
        } catch { toast.error('Failed to load user details'); }
    };

    /* Filter conversations */
    const roleFilterMap = {
        'Buyer': ['BUYER'],
        'Seller': ['SELLER'],
        'Rental Owner': ['RENTAL_OWNER'],
        'Manager': ['MANAGER'],
    };
    const filteredConvs = conversations.filter((c) => {
        // Active role based filtering to prevent personal chats from leaking into admin/manager dashboards
        if (user?.activeRole === 'ADMIN') {
            // Admin sees ALL conversations — no filtering
        } else if (user?.activeRole === 'MANAGER') {
            const isManagerRelated = c.propertyTitle?.startsWith('Support —') || c.propertyId === 'admin-support' || c.propertyTitle?.startsWith('Admin ↔');
            if (!isManagerRelated) return false;
        } else {
            // Regular user: Buyer/Seller should NOT see Admin Support Channel or Admin ↔ manager chats here
            const isAdminPrivateChat = c.propertyId === 'admin-support' || c.propertyTitle?.startsWith('Admin ↔');
            if (isAdminPrivateChat) return false;
        }

        const matchSearch = !search ||
            c.otherUser?.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.propertyTitle?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'All' || (() => {
            const roles = roleFilterMap[roleFilter] || [];
            const hasRole = roles.some(r => c.otherUser?.activeRole === r || c.otherUser?.roles?.includes(r));
            if (hasRole) return true;

            // Resilient Fallback for Managers
            if (roleFilter === 'Manager') {
                return c.propertyTitle?.startsWith('Admin ↔') ||
                    c.propertyTitle?.startsWith('Support —') ||
                    managersList.some(m => m.id === c.otherUser?.id);
            }
            return false;
        })();
        return matchSearch && matchRole;
    });

    const convPreview = (conv) => {
        const cached = queryClient.getQueryData(['messages', conv.id]);
        const thread = conv.id === selectedChat?.id ? messages : (cached?.messages || []);
        if (thread.length > 0) {
            const lastMsg = thread[thread.length - 1];
            return isOwnMessage(lastMsg, user) ? `You: ${lastMsg.content}` : lastMsg.content;
        }
        return conv.lastMessage || 'No messages yet';
    };

    return (
        <>
            <SEOHead title="Messages" noindex />
            <div className="h-[calc(100vh-8rem)]">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
                        Messages
                        {totalUnread > 0 && (
                            <span className="inline-flex items-center gap-1 bg-royal-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                <Bell className="w-3 h-3" /> {totalUnread}
                            </span>
                        )}
                    </h1>
                </div>

                <div className="glass-card h-[calc(100%-3.5rem)] flex overflow-hidden">

                    {/* ── LEFT PANEL ── */}
                    <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-surface-border`}>
                        <div className="p-4 border-b border-surface-border space-y-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search conversations..."
                                    className="w-full bg-surface-hover rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                                />
                            </div>

                            {/* Role filter for admin */}
                            {isAdmin && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                                        <Filter className="w-3.5 h-3.5" /> Filter by Role
                                    </p>
                                    <ConversationFilters filter={roleFilter} setFilter={setRoleFilter} />
                                </div>
                            )}

                            {/* State+District selector for regular users */}
                            {!canViewFullThread && (
                                <LocationSelector
                                    onContact={handleContactManager}
                                    isPending={startConvMutation.isPending}
                                />
                            )}

                            {/* Admin chat button for managers */}
                            {isManager && (
                                <AdminContactPanel
                                    onContact={handleContactAdmin}
                                    isPending={contactAdminMutation.isPending}
                                />
                            )}

                            {/* Manager picker for admin */}
                            {isAdmin && (
                                <AdminManagerPanel
                                    managersList={managersList}
                                    onContact={handleContactSelectedManager}
                                    isPending={startConvMutation.isPending}
                                />
                            )}
                        </div>

                        {/* Conversation list */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredConvs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                                    <MessageSquare className="w-10 h-10 text-text-muted mb-3" />
                                    <p className="text-sm text-text-secondary">No conversations yet</p>
                                    {!canViewFullThread && (
                                        <p className="text-xs text-text-muted mt-1">
                                            Select your state & district above to find your manager
                                        </p>
                                    )}
                                </div>
                            ) : (
                                filteredConvs.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedChat(conv)}
                                        className={`w-full flex items-center gap-3 p-4 hover:bg-surface-hover transition-all text-left ${selectedChat?.id === conv.id ? 'bg-royal-500/10 border-l-2 border-royal-500' : ''}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar name={conv.otherUser?.name || 'Unknown'} size="sm" />
                                            {conv.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-royal-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                    {conv.otherUser?.name || 'Unknown'}
                                                </p>
                                                <span className="text-[10px] text-text-muted flex-shrink-0 ml-1">
                                                    {formatRelativeTime(conv.lastMessageAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-muted truncate">{conv.propertyTitle}</p>
                                            <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-text-secondary font-medium' : 'text-text-muted'}`}>
                                                {convPreview(conv)}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL (Chat Window) ── */}
                    <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
                        {selectedChat ? (
                            <>
                                {/* Chat header */}
                                <div className="flex items-center gap-3 p-4 border-b border-surface-border bg-surface-card/50">
                                    <button onClick={() => setSelectedChat(null)} className="md:hidden p-1 text-text-secondary hover:text-text-primary">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <Avatar name={selectedChat.otherUser?.name || 'Unknown'} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm font-semibold text-text-primary ${canViewFullThread ? 'cursor-pointer hover:text-royal-400' : ''}`}
                                            onClick={() => handleUserClick(selectedChat.otherUser?.id)}
                                        >
                                            {selectedChat.otherUser?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-text-muted truncate">
                                            {selectedChat.propertyTitle}
                                            {selectedChat.otherUser?.phone && (
                                                <span className="ml-2 inline-flex items-center gap-0.5">
                                                    <Phone className="w-3 h-3" />
                                                    {selectedChat.otherUser.phone}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.map((msg) => {
                                        const isMine = isOwnMessage(msg, user);
                                        return (
                                            <div key={msg.id} className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'}`}>
                                                <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    {!isMine && (
                                                        <Avatar name={selectedChat.otherUser?.name} size="xs" className="mr-2 mt-auto flex-shrink-0" />
                                                    )}
                                                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-royal-600 text-white rounded-br-sm' : 'bg-surface-hover text-text-primary rounded-bl-sm'
                                                        } ${msg.pending ? 'opacity-70' : ''}`}>
                                                        <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                                                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60 text-right' : 'text-text-muted'}`}>
                                                            {formatRelativeTime(msg.createdAt)}{msg.pending && ' · Sending...'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Counter Offer panel — visible to seller/rental_owner only */}
                                                <div className={`${isMine ? 'pr-2' : 'pl-10'} w-full max-w-[75%] ${isMine ? 'self-end' : 'self-start'}`}>
                                                    <OfferMessageBubble
                                                        message={msg.content}
                                                        isFromMe={isMine}
                                                        isSeller={isSeller}
                                                        onRespond={async ({ type, counterPrice }) => {
                                                            const responseText =
                                                                type === 'ACCEPT'
                                                                    ? `✅ *OFFER ACCEPTED*\n\nI've accepted your offer. Let's proceed with the next steps.`
                                                                    : type === 'REJECT'
                                                                        ? `❌ *OFFER DECLINED*\n\nThank you for your interest. The offer price doesn't meet our expectations at this time.`
                                                                        : `↩️ *COUNTER OFFER*\n\nThank you for your offer. I'd like to propose a counter offer of ${counterPrice ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(counterPrice) : '—'}. Please let me know if this works for you.`;
                                                            await chatService.sendMessage(selectedChat.id, { content: responseText });
                                                            queryClient.invalidateQueries({ queryKey: ['messages', selectedChat.ids.join(',')] });
                                                            queryClient.invalidateQueries({ queryKey: ['conversations'] });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEnd} />
                                </div>

                                {/* Message input */}
                                <form onSubmit={handleSend} className="p-4 border-t border-surface-border flex gap-2">
                                    <input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={`Message ${selectedChat.otherUser?.name || 'manager'}...`}
                                        className="flex-1 bg-surface-hover rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-royal-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!message.trim() || sendMutation.isPending}
                                        className="w-10 h-10 rounded-xl bg-royal-600 hover:bg-royal-500 text-white flex items-center justify-center disabled:opacity-50 transition-all"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center px-8">
                                <div>
                                    <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                                        <MessageSquare className="w-10 h-10 text-text-muted" />
                                    </div>
                                    <h3 className="text-lg font-display font-semibold text-text-primary mb-2">Your Messages</h3>
                                    <p className="text-text-secondary text-sm max-w-xs">
                                        {!canViewFullThread
                                            ? 'Choose your state & district to connect with your area manager for property enquiries.'
                                            : isAdmin
                                                ? 'Filter conversations or start a chat with any manager.'
                                                : 'Select a conversation or open the Admin channel above.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Detail Modal */}
            {showUserModal && selectedUserDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-card rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-display font-bold text-text-primary">User Details</h3>
                            <button onClick={() => setShowUserModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
                            <Avatar name={selectedUserDetail.name} size="md" />
                            <div>
                                <p className="font-semibold text-text-primary">{selectedUserDetail.name}</p>
                                <p className="text-xs text-text-muted">{selectedUserDetail.roles?.join(', ')}</p>
                            </div>
                        </div>
                        <div className="grid gap-3 text-sm">
                            <p className="flex items-center gap-2 text-text-secondary">
                                <Mail className="w-4 h-4 text-royal-400" />
                                <span><span className="font-medium text-text-primary">Email:</span> {selectedUserDetail.email}</span>
                            </p>
                            <p className="flex items-center gap-2 text-text-secondary">
                                <Phone className="w-4 h-4 text-royal-400" />
                                <span><span className="font-medium text-text-primary">Phone:</span> {selectedUserDetail.phone || '—'}</span>
                            </p>
                            <p className="flex items-center gap-2 text-text-secondary">
                                <User className="w-4 h-4 text-royal-400" />
                                <span><span className="font-medium text-text-primary">Role:</span> {selectedUserDetail.activeRole}</span>
                            </p>
                            {(selectedUserDetail.city || selectedUserDetail.state) && (
                                <p className="flex items-center gap-2 text-text-secondary">
                                    <MapPin className="w-4 h-4 text-royal-400" />
                                    <span><span className="font-medium text-text-primary">Location:</span> {[selectedUserDetail.city, selectedUserDetail.state].filter(Boolean).join(', ')}</span>
                                </p>
                            )}
                            {selectedUserDetail.cities?.length > 0 && (
                                <p className="flex items-start gap-2 text-text-secondary">
                                    <Building2 className="w-4 h-4 text-royal-400 mt-0.5" />
                                    <span><span className="font-medium text-text-primary">Assigned Districts:</span> {selectedUserDetail.cities.join(', ')}</span>
                                </p>
                            )}
                        </div>
                        <div className="text-right pt-2">
                            <button onClick={() => setShowUserModal(false)} className="px-4 py-2 bg-royal-600 text-white rounded-xl text-sm font-medium hover:bg-royal-500 transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatPage;
