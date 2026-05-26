// ── Mock API interceptor — provides fallback data when backend is unavailable ──
import { MOCK_USERS, MOCK_MANAGERS, MOCK_PROPERTIES, MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../data/mockData';

// In-memory state for mutations
let managers = JSON.parse(JSON.stringify(MOCK_MANAGERS));
let properties = JSON.parse(JSON.stringify(MOCK_PROPERTIES));
let conversations = JSON.parse(JSON.stringify(MOCK_CONVERSATIONS));
let messages = JSON.parse(JSON.stringify(MOCK_MESSAGES));
let currentUser = null;
if (typeof window !== 'undefined') {
    try {
        const savedUserId = localStorage.getItem('sfx_mock_user_id');
        if (savedUserId) {
            currentUser = MOCK_USERS.find(u => u.id === savedUserId) || null;
        }
    } catch (e) {}
    if (!currentUser) {
        currentUser = MOCK_USERS[0];
        try {
            localStorage.setItem('sfx_mock_user_id', currentUser.id);
        } catch (e) {}
    }
}

const delay = (ms = 30) => new Promise((r) => setTimeout(r, ms));

const mockResponse = (data, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
});

const routeHandlers = {
    // ── Auth ──
    'POST /auth/login': async (body) => {
        const user = MOCK_USERS.find((u) => u.email === body.email && u.password === body.password);
        if (!user) throw { response: { status: 401, data: { message: 'Invalid email or password' } } };
        currentUser = user;
        if (typeof window !== 'undefined') {
            try { localStorage.setItem('sfx_mock_user_id', user.id); } catch (e) {}
        }
        return mockResponse({ user: { ...user, password: undefined } });
    },
    'POST /auth/register': async (body) => {
        const newUser = {
            id: 'u' + Date.now(),
            ...body,
            activeRole: 'BUYER',
            roles: ['BUYER', 'SELLER', 'RENTAL_OWNER', 'RENTAL_SEEKER'],
            avatar: null,
            createdAt: new Date().toISOString(),
        };
        MOCK_USERS.push(newUser);
        currentUser = newUser;
        if (typeof window !== 'undefined') {
            try { localStorage.setItem('sfx_mock_user_id', newUser.id); } catch (e) {}
        }
        return mockResponse({ user: { ...newUser, password: undefined }, message: 'Account created' });
    },
    'POST /auth/logout': async () => {
        currentUser = null;
        if (typeof window !== 'undefined') {
            try { localStorage.removeItem('sfx_mock_user_id'); } catch (e) {}
        }
        return mockResponse({ message: 'Logged out' });
    },
    'GET /auth/me': async () => {
        if (!currentUser) throw { response: { status: 401, data: { message: 'Not authenticated' } } };
        const fresh = MOCK_USERS.find((u) => u.id === currentUser.id);
        if (fresh) currentUser = fresh;
        return mockResponse({ user: { ...currentUser, password: undefined } });
    },
    'POST /auth/refresh-token': async () => {
        if (!currentUser) throw { response: { status: 401, data: { message: 'Token expired' } } };
        const fresh = MOCK_USERS.find((u) => u.id === currentUser.id);
        if (fresh) currentUser = fresh;
        return mockResponse({ user: { ...currentUser, password: undefined } });
    },

    // ── Users ──
    'GET /users/profile': async () => {
        if (!currentUser) throw { response: { status: 401 } };
        return mockResponse({ ...currentUser, password: undefined });
    },
    'GET /users/admin-info': async () => {
        const admin = MOCK_USERS.find((u) => u.activeRole === 'ADMIN' || u.roles?.includes('ADMIN'));
        if (!admin) throw { response: { status: 404, data: { message: 'Admin not found' } } };
        return mockResponse({ id: admin.id, name: admin.name, email: admin.email, activeRole: admin.activeRole });
    },
    'PUT /users/switch-role': async (body) => {
        if (!currentUser) throw { response: { status: 401, data: { message: 'Not authenticated' } } };
        if (!currentUser.roles?.includes(body.role)) {
            throw { response: { status: 403, data: { message: 'Role not assigned to this account' } } };
        }
        currentUser.activeRole = body.role;
        const stored = MOCK_USERS.find((u) => u.id === currentUser.id);
        if (stored) stored.activeRole = body.role;
        if (typeof window !== 'undefined') {
            try { localStorage.setItem('sfx_mock_user_id', currentUser.id); } catch (e) {}
        }
        return mockResponse({ user: { ...currentUser, password: undefined } });
    },
    'GET /users/:id': async (_, params) => {
        const u = MOCK_USERS.find(x => x.id === params.id);
        if (!u) throw { response: { status: 404, data: { message: 'User not found' } } };
        return mockResponse({ ...u, password: undefined });
    },

    // ── Properties ──
    'GET /properties': async (body, params, url) => {
        const queryParams = new URLSearchParams(url.split('?')[1] || '');
        const listingType = queryParams.get('listingType') || '';
        const search = queryParams.get('search') || '';
        const propertyType = queryParams.get('propertyType') || '';
        const minPrice = queryParams.get('minPrice') || queryParams.get('priceMin') || '';
        const maxPrice = queryParams.get('maxPrice') || queryParams.get('priceMax') || '';
        const bedrooms = queryParams.get('bedrooms') || '';
        const city = queryParams.get('city') || '';
        
        let filtered = properties.filter((p) => p.status === 'APPROVED');
        
        if (listingType) {
            const types = listingType.split(',').map(t => t.toUpperCase());
            filtered = filtered.filter((p) => types.includes(p.listingType?.toUpperCase()));
        }
        
        if (propertyType) {
            filtered = filtered.filter((p) => p.propertyType === propertyType);
        }

        if (minPrice) {
            const min = parseFloat(minPrice);
            filtered = filtered.filter((p) => {
                const price = p.price || p.monthlyRent || p.leaseAmount || 0;
                return price >= min;
            });
        }

        if (maxPrice) {
            const max = parseFloat(maxPrice);
            filtered = filtered.filter((p) => {
                const price = p.price || p.monthlyRent || p.leaseAmount || 0;
                return price <= max;
            });
        }

        if (bedrooms) {
            const beds = parseInt(bedrooms, 10);
            filtered = filtered.filter((p) => p.bedrooms >= beds);
        }

        if (city) {
            const cityLower = city.toLowerCase();
            filtered = filtered.filter((p) => p.location?.city?.toLowerCase().includes(cityLower));
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (p) => p.title?.toLowerCase().includes(searchLower) ||
                       p.location?.city?.toLowerCase().includes(searchLower) ||
                       p.location?.address?.toLowerCase().includes(searchLower) ||
                       p.location?.district?.toLowerCase().includes(searchLower) ||
                       p.location?.state?.toLowerCase().includes(searchLower)
            );
        }
        
        return mockResponse({ properties: filtered, total: filtered.length });
    },
    'GET /properties/:id': async (_, params) => {
        const p = properties.find((x) => x.id === params.id);
        if (!p) throw { response: { status: 404, data: { message: 'Not found' } } };
        return mockResponse(p);
    },
    'POST /properties': async (body) => {
        const { address, city, state, pincode, district, ...rest } = body;
        const np = {
            id: 'p' + Date.now(),
            ...rest,
            location: body.location || { address, city, state, pincode, district: district || city },
            images: Array.isArray(body.images) && body.images.length > 0 ? body.images : [],
            verificationDocuments: Array.isArray(body.verificationDocuments) && body.verificationDocuments.length > 0 ? body.verificationDocuments : [],
            reviews: Array.isArray(body.reviews) ? body.reviews : [],
            sellerId: currentUser?.id,
            status: 'PENDING',
            views: 0,
            unlockCount: 0,
            sellerContact: currentUser
                ? { name: currentUser.name, phone: currentUser.phone, email: currentUser.email }
                : undefined,
            createdAt: new Date().toISOString(),
        };
        properties.unshift(np);
        return mockResponse(np);
    },
    'PUT /properties/:id': async (body, params) => {
        const idx = properties.findIndex((x) => x.id === params.id);
        if (idx < 0) throw { response: { status: 404, data: { message: 'Property not found' } } };
        const merged = { ...properties[idx], ...body };
        if (body.location) merged.location = { ...properties[idx].location, ...body.location };
        if (Array.isArray(body.images)) merged.images = body.images;
        if (Array.isArray(body.verificationDocuments)) merged.verificationDocuments = body.verificationDocuments;
        if (Array.isArray(body.reviews)) merged.reviews = body.reviews;
        properties[idx] = merged;
        return mockResponse(properties[idx]);
    },
    'POST /properties/:id/images': async (body, params) => {
        const idx = properties.findIndex((x) => x.id === params.id);
        if (idx < 0) throw { response: { status: 404, data: { message: 'Not found' } } };
        const urls = body?.imageUrls || body?.images;
        if (Array.isArray(urls) && urls.length > 0) {
            properties[idx].images = [...(properties[idx].images || []), ...urls];
        }
        return mockResponse({ message: 'Images uploaded', images: properties[idx].images });
    },
    'POST /properties/:id/reviews': async (body, params) => {
        const idx = properties.findIndex((x) => x.id === params.id);
        if (idx < 0) throw { response: { status: 404, data: { message: 'Property not found' } } };
        const review = {
            id: 'r' + Date.now(),
            buyerId: currentUser?.id || 'anonymous',
            buyerName: currentUser?.name || 'Verified Buyer',
            rating: body.rating || 5,
            comment: body.comment || '',
            createdAt: new Date().toISOString()
        };
        if (!Array.isArray(properties[idx].reviews)) {
            properties[idx].reviews = [];
        }
        properties[idx].reviews.push(review);
        return mockResponse(properties[idx]);
    },
    'DELETE /properties/:id': async (_, params) => {
        properties = properties.filter((x) => x.id !== params.id);
        return mockResponse({ message: 'Deleted' });
    },
    'GET /properties/my-listings': async () => {
        const mine = properties.filter((x) => x.sellerId === currentUser?.id);
        const activeListings = mine.filter((p) => p.status === 'APPROVED').length;
        const totalViews = mine.reduce((s, p) => s + (p.views || 0), 0);
        const totalInquiries = mine.reduce((s, p) => s + (p.unlockCount || 0), 0);
        return mockResponse({
            properties: mine,
            total: mine.length,
            stats: {
                totalListings: mine.length,
                activeListings,
                totalViews,
                totalInquiries,
            },
        });
    },
    'GET /properties/saved': async () => {
        let savedIds = [];
        try {
            const key = currentUser?.id ? `sfx_saved_${currentUser.id}` : 'sfx_saved';
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
            savedIds = raw ? JSON.parse(raw) : [];
        } catch { savedIds = []; }
        const saved = properties.filter((p) => savedIds.includes(p.id) && p.status === 'APPROVED');
        const userConvs = conversations.filter(
            (c) => c.creatorId === currentUser?.id || c.otherUser?.id === currentUser?.id
        );
        return mockResponse({
            properties: saved,
            totalInquiries: userConvs.length,
            totalViewed: Math.max(saved.length * 2, 0),
            totalSaved: saved.length,
            activeChats: userConvs.length,
        });
    },

    // ── Chat ──
    // Helper: get unread count for the current user from per-user map
    // conversations store unreadCounts as { [userId]: count } — the sender never gets unread incremented
    'GET /chat/conversations': async () => {
        if (!currentUser) return mockResponse({ conversations: [] });
        const mine = conversations.filter(
            (c) => String(c.creatorId) === String(currentUser.id) || String(c.otherUser?.id) === String(currentUser.id)
        );
        const mapped = mine.map((c) => {
            const otherId = String(c.creatorId) === String(currentUser.id) ? c.otherUser?.id : c.creatorId;
            const otherUserObj = MOCK_USERS.find(u => String(u.id) === String(otherId)) || { id: otherId, name: 'User' };
            const myUnread = (c.unreadCounts && c.unreadCounts[currentUser.id]) || 0;
            return {
                id: c.id,
                otherUser: {
                    id: otherUserObj.id, name: otherUserObj.name,
                    phone: otherUserObj.phone, email: otherUserObj.email,
                    activeRole: otherUserObj.activeRole, roles: otherUserObj.roles
                },
                propertyId: c.propertyId, propertyTitle: c.propertyTitle,
                lastMessage: c.lastMessage, lastMessageAt: c.lastMessageAt,
                unreadCount: myUnread
            };
        });
        return mockResponse({ conversations: mapped });
    },
    'GET /chat/conversations/:id/messages': async (_, params) => mockResponse({ messages: messages[params.id] || [] }),
    'POST /chat/conversations/:id/messages': async (body, params) => {
        const msg = { id: 'm' + Date.now(), content: body.content, senderId: currentUser?.id || 'u1', createdAt: new Date().toISOString() };
        if (!messages[params.id]) messages[params.id] = [];
        messages[params.id].push(msg);
        const conv = conversations.find((c) => c.id === params.id);
        if (conv) {
            conv.lastMessage = body.content;
            conv.lastMessageAt = msg.createdAt;
            // Increment unread ONLY for the OTHER user (recipient), NOT the sender
            if (!conv.unreadCounts) conv.unreadCounts = {};
            const recipientId = String(conv.creatorId) === String(currentUser?.id) ? conv.otherUser?.id : conv.creatorId;
            if (recipientId) {
                conv.unreadCounts[recipientId] = (conv.unreadCounts[recipientId] || 0) + 1;
            }
        }
        return mockResponse(msg);
    },
    'POST /chat/conversations': async (body) => {
        const otherUserId = body.otherUserId || body.recipientId;
        const otherUser = MOCK_USERS.find(u => String(u.id) === String(otherUserId)) || { id: otherUserId, name: 'User' };

        let conv = conversations.find(
            (c) => (String(c.creatorId) === String(currentUser?.id) && String(c.otherUser?.id) === String(otherUserId)) ||
                   (String(c.creatorId) === String(otherUserId) && String(c.otherUser?.id) === String(currentUser?.id))
        );

        if (!conv) {
            const convId = 'conv' + Date.now();
            conv = {
                id: convId, creatorId: currentUser?.id,
                otherUser: { id: otherUser.id, name: otherUser.name },
                propertyTitle: body.propertyTitle || '', propertyId: body.propertyId,
                lastMessage: body.message || '', lastMessageAt: new Date().toISOString(),
                unreadCounts: {}
            };
            conversations.push(conv);
            messages[convId] = [];
        } else {
            conv.propertyTitle = body.propertyTitle || conv.propertyTitle;
            conv.propertyId = body.propertyId || conv.propertyId;
            if (body.message) { conv.lastMessage = body.message; conv.lastMessageAt = new Date().toISOString(); }
        }

        if (body.message) {
            const msg = { id: 'm' + Date.now(), content: body.message, senderId: currentUser?.id || 'u1', createdAt: new Date().toISOString() };
            if (!messages[conv.id]) messages[conv.id] = [];
            messages[conv.id].push(msg);
            // Unread for the OTHER user only
            if (!conv.unreadCounts) conv.unreadCounts = {};
            if (otherUserId) conv.unreadCounts[otherUserId] = (conv.unreadCounts[otherUserId] || 0) + 1;
        }

        return mockResponse({
            id: conv.id,
            otherUser: { id: otherUser.id, name: otherUser.name, phone: otherUser.phone, email: otherUser.email, activeRole: otherUser.activeRole, roles: otherUser.roles },
            propertyTitle: conv.propertyTitle, propertyId: conv.propertyId,
            lastMessage: conv.lastMessage, lastMessageAt: conv.lastMessageAt,
            unreadCount: 0
        });
    },
    'PUT /chat/conversations/:id/read': async (_, params) => {
        const conv = conversations.find((c) => c.id === params.id);
        if (conv && currentUser) {
            if (!conv.unreadCounts) conv.unreadCounts = {};
            conv.unreadCounts[currentUser.id] = 0;
        }
        return mockResponse({ message: 'Marked read' });
    },
    'GET /chat/unread-count': async () => {
        if (!currentUser) return mockResponse({ count: 0 });
        const mine = conversations.filter(
            (c) => String(c.creatorId) === String(currentUser.id) || String(c.otherUser?.id) === String(currentUser.id)
        );
        const count = mine.reduce((s, c) => {
            const myUnread = (c.unreadCounts && c.unreadCounts[currentUser.id]) || 0;
            return s + myUnread;
        }, 0);
        return mockResponse({ count });
    },
    'POST /chat/contact-admin': async () => {
        if (!currentUser) throw { response: { status: 401 } };
        const admin = MOCK_USERS.find((u) => u.activeRole === 'ADMIN' || u.roles?.includes('ADMIN'));
        if (!admin) throw { response: { status: 404, data: { message: 'Admin not found' } } };

        let conv = conversations.find(
            (c) => (String(c.creatorId) === String(currentUser.id) && String(c.otherUser?.id) === String(admin.id)) ||
                   (String(c.creatorId) === String(admin.id) && String(c.otherUser?.id) === String(currentUser.id))
        );

        if (conv) {
            return mockResponse({
                id: conv.id,
                otherUser: { id: admin.id, name: admin.name, email: admin.email, activeRole: admin.activeRole, roles: admin.roles },
                propertyTitle: conv.propertyTitle, propertyId: conv.propertyId,
                lastMessage: conv.lastMessage, lastMessageAt: conv.lastMessageAt, unreadCount: 0
            });
        }

        const convId = 'conv-admin-' + Date.now();
        const newConv = {
            id: convId, creatorId: currentUser.id,
            otherUser: { id: admin.id, name: admin.name },
            propertyTitle: 'Admin Support Channel',
            lastMessage: '', lastMessageAt: new Date().toISOString(),
            unreadCounts: {},
        };
        conversations.push(newConv);
        messages[convId] = [];

        return mockResponse({
            id: convId,
            otherUser: { id: admin.id, name: admin.name, email: admin.email, activeRole: admin.activeRole, roles: admin.roles },
            propertyTitle: newConv.propertyTitle, propertyId: newConv.propertyId,
            lastMessage: newConv.lastMessage, lastMessageAt: newConv.lastMessageAt, unreadCount: 0
        });
    },

    // ── Manager ──
    'GET /manager/dashboard': async () => mockResponse({
        totalListings: properties.length,
        totalPending: properties.filter((p) => p.status === 'PENDING').length,
        totalReviewing: properties.filter((p) => p.status === 'UNDER_REVIEW').length,
        totalApproved: properties.filter((p) => p.status === 'APPROVED').length,
        totalRejected: properties.filter((p) => p.status === 'REJECTED').length,
    }),
    'GET /manager/cities': async () => mockResponse({ cities: currentUser?.cities || [] }),
    'GET /manager/listings': async () => mockResponse({ properties: properties.filter((p) => ['PENDING', 'UNDER_REVIEW'].includes(p.status)) }),
    'GET /manager/unassigned': async () => mockResponse({ properties: properties.filter((p) => p.status === 'PENDING') }),

    // ── Admin ──
    'GET /admin/dashboard': async () => mockResponse({
        totalProperties: properties.length, totalUsers: MOCK_USERS.length, totalInquiries: 89,
        monthlyData: [
            { month: 'Sep', listings: 12, inquiries: 30 }, { month: 'Oct', listings: 18, inquiries: 45 },
            { month: 'Nov', listings: 25, inquiries: 60 }, { month: 'Dec', listings: 30, inquiries: 80 },
            { month: 'Jan', listings: 38, inquiries: 95 }, { month: 'Feb', listings: 45, inquiries: 120 },
        ],
        categoryData: [
            { name: 'Apartments', value: 45 }, { name: 'Villas', value: 20 },
            { name: 'Plots', value: 15 }, { name: 'Commercial', value: 12 }, { name: 'Others', value: 8 },
        ],
    }),
    'GET /admin/users': async () => mockResponse({ users: MOCK_USERS.map((u) => ({ ...u, password: undefined, status: 'active' })) }),
    'PUT /admin/users/:id': async () => mockResponse({ message: 'User updated' }),
    'GET /admin/managers': async () => mockResponse({ managers }),
    'POST /admin/managers/create': async (body) => {
        const newManagerId = 'mgr_' + Date.now();
        const citiesList = typeof body.cities === 'string' ? body.cities.split(',').map(c => c.trim()).filter(Boolean) : (body.cities || []);
        const newManager = {
            id: newManagerId,
            name: body.name,
            email: body.email,
            phone: body.phone || '+91 99999 11111',
            cities: citiesList,
            activeListings: 0,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        managers.push(newManager);

        // Also push to MOCK_USERS so they can authenticate/login!
        MOCK_USERS.push({
            id: newManagerId,
            name: body.name,
            email: body.email,
            phone: body.phone || '+91 99999 11111',
            password: body.password || 'Manager@123',
            activeRole: 'MANAGER',
            roles: ['MANAGER'],
            cities: citiesList,
            createdAt: new Date().toISOString()
        });

        return mockResponse(newManager);
    },
    'PUT /admin/managers/:id': async (body, params) => {
        const m = managers.find((x) => x.id === params.id);
        if (m) {
            m.name = body.name || m.name;
            m.email = body.email || m.email;
            m.phone = body.phone || m.phone;
            if (body.cities) {
                m.cities = typeof body.cities === 'string' ? body.cities.split(',').map(c => c.trim()).filter(Boolean) : body.cities;
            }
        }
        // Sync user in MOCK_USERS
        const u = MOCK_USERS.find((x) => x.id === params.id);
        if (u) {
            u.name = body.name || u.name;
            u.email = body.email || u.email;
            u.phone = body.phone || u.phone;
            if (body.cities) {
                u.cities = typeof body.cities === 'string' ? body.cities.split(',').map(c => c.trim()).filter(Boolean) : body.cities;
            }
        }
        return mockResponse(m || { message: 'Manager updated' });
    },
    'DELETE /admin/managers/:id': async (_, params) => {
        managers = managers.filter((x) => x.id !== params.id);
        const idx = MOCK_USERS.findIndex((x) => x.id === params.id);
        if (idx !== -1) MOCK_USERS.splice(idx, 1);
        return mockResponse({ message: 'Manager deleted' });
    },
    'POST /admin/managers/assign': async (body) => {
        const m = managers.find((x) => x.id === body.managerId);
        if (m && !m.cities.includes(body.city)) m.cities.push(body.city);
        return mockResponse({ message: 'Manager assigned' });
    },
    'POST /admin/managers/unassign': async (body) => {
        const m = managers.find((x) => x.id === body.managerId);
        if (m) m.cities = m.cities.filter((c) => c !== body.city);
        return mockResponse({ message: 'City unassigned' });
    },
    'GET /manager/by-city': async (body, params, url) => {
        const queryParams = new URLSearchParams(url.split('?')[1] || '');
        const city = queryParams.get('city') || '';
        const m = managers.find((mgr) => mgr.cities?.some(c => c.toLowerCase() === city.toLowerCase()));
        if (!m) throw { response: { status: 404, data: { message: 'No manager found for this city' } } };
        return mockResponse({ manager: m });
    },
    'GET /admin/managers/by-city': async (body, params, url) => {
        const queryParams = new URLSearchParams(url.split('?')[1] || '');
        const city = queryParams.get('city') || '';
        const m = managers.find((mgr) => mgr.cities?.some(c => c.toLowerCase() === city.toLowerCase()));
        if (!m) throw { response: { status: 404, data: { message: 'No manager found for this city' } } };
        return mockResponse({ manager: m });
    },
    'GET /admin/properties': async () => mockResponse({ properties }),
    'DELETE /admin/properties/:id': async (_, params) => {
        properties = properties.filter((x) => x.id !== params.id);
        return mockResponse({ message: 'Deleted' });
    },
    'PUT /admin/properties/:id/status': async (body, params) => {
        const p = properties.find((x) => x.id === params.id);
        if (p) p.status = body.status;
        return mockResponse({ message: 'Status updated' });
    },
    'GET /admin/audit-log': async () => mockResponse({ logs: [] }),
};

function matchRoute(method, url) {
    // Strip query params and clean up URL
    const cleanUrl = url.split('?')[0].replace(/\/$/, '');
    const requestKey = `${method} ${cleanUrl}`;

    // Try exact match first
    if (routeHandlers[requestKey]) return { handler: routeHandlers[requestKey], params: {} };

    // Try parametric match
    for (const [pattern, handler] of Object.entries(routeHandlers)) {
        const [pMethod, ...pParts] = pattern.split(' ');
        const pPath = pParts.join(' ');
        if (pMethod !== method) continue;
        const patternParts = pPath.split('/').filter(Boolean);
        const urlParts = cleanUrl.split('/').filter(Boolean);
        if (patternParts.length !== urlParts.length) continue;
        const params = {};
        let match = true;
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = urlParts[i];
            } else if (patternParts[i] !== urlParts[i]) {
                match = false; break;
            }
        }
        if (match) return { handler, params };
    }
    return null;
}

function isNetworkError(error) {
    return !error.response;
}

export function installMockInterceptor(axiosInstance) {
    axiosInstance.interceptors.response.use(
        // Success — pass through real responses
        (response) => response,
        // Error — fallback to mock ONLY on network errors (backend unreachable)
        async (error) => {
            if (!isNetworkError(error)) {
                // Real backend returned a real error (4xx, 5xx) — don't mock
                return Promise.reject(error);
            }

            const config = error.config;
            if (!config) return Promise.reject(error);

            const url = (config.url || '').replace(config.baseURL || '', '');
            const method = (config.method || 'get').toUpperCase();
            const route = matchRoute(method, url);

            if (route) {
                console.log(`[MockAPI] Fallback: ${method} ${url}`);
                await delay(30);
                try {
                    const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
                    return await route.handler(body, route.params, url);
                } catch (mockErr) {
                    return Promise.reject(mockErr);
                }
            }

            return Promise.reject(error);
        }
    );
}
