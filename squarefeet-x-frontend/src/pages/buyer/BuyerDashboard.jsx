import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Heart, MessageSquare, ArrowRight, Clock, MapPin, IndianRupee } from 'lucide-react';
import { propertyService, chatService } from '../../services/api';
import { useAuth } from '../../hooks';
import { useSavedStore } from '../../store/savedStore';
import { useRecentlyViewedStore } from '../../store/recentlyViewedStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PropertyCard from '../../components/common/PropertyCard';
import { BuyerCredibilityScore } from '../../components/buyer/BuyerCredibilityScore';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import SEOHead from '../../components/common/SEOHead';
import { formatCurrency } from '../../utils';
import { motion } from 'framer-motion';

const statCards = [
    { key: 'totalInquiries', label: 'Inquiries Sent', icon: MessageSquare, color: 'from-emerald-600 to-emerald-500' },
    { key: 'totalViewed', label: 'Properties Viewed', icon: Search, color: 'from-royal-600 to-royal-500' },
    { key: 'totalSaved', label: 'Saved Properties', icon: Heart, color: 'from-pink-600 to-pink-500' },
    { key: 'activeChats', label: 'Active Chats', icon: MessageSquare, color: 'from-emerald-600 to-emerald-500' },
];

const BuyerDashboard = () => {
    const { user } = useAuth();
    const { savedIds, initForUser } = useSavedStore();

    useEffect(() => {
        if (user?.id) initForUser(user.id);
    }, [user?.id, initForUser]);

    let roleListingFilter = null;
    if (user?.activeRole === 'BUYER') {
        roleListingFilter = 'SALE';
    } else if (user?.activeRole === 'RENTAL_SEEKER') {
        roleListingFilter = 'RENT,LEASE';
    }

    const { data: allProperties } = useQuery({
        queryKey: ['properties-browse', roleListingFilter],
        queryFn: () => {
            const queryParams = {};
            if (roleListingFilter) {
                queryParams.listingType = roleListingFilter;
            }
            return propertyService.getAll(queryParams).then((r) => r.data);
        },
    });

    const { data: chatData } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => chatService.getConversations().then((r) => r.data),
    });

    const { data: apiStats, isLoading } = useQuery({
        queryKey: ['buyer-stats', user?.id],
        queryFn: () => propertyService.getSavedProperties().then((r) => r.data),
        enabled: !!user?.id,
    });

    const recentlyViewed = useRecentlyViewedStore((s) => s.items);
    const clearRecentlyViewed = useRecentlyViewedStore((s) => s.clearAll);

    const savedProperties = (allProperties?.properties || []).filter((p) => savedIds.includes(p.id));
    const activeChats = chatData?.conversations?.length || 0;
    // Use active chat conversations as the inquiry count — each conversation = one inquiry
    const inquiryCount = activeChats;

    const stats = {
        totalInquiries: apiStats?.totalInquiries ?? inquiryCount,
        totalViewed: recentlyViewed.length || (apiStats?.totalViewed ?? Math.max(savedProperties.length * 2, 0)),
        totalSaved: apiStats?.totalSaved ?? savedIds.length,
        activeChats: apiStats?.activeChats ?? activeChats,
        properties: apiStats?.properties || savedProperties,
    };

    if (isLoading && !allProperties) return <DashboardSkeleton />;

    return (
        <>
            <SEOHead title="Buyer Dashboard" noindex />
            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary">
                        Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-text-secondary mt-1">Here&apos;s your property search overview</p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <motion.div key={stat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card hover className="flex items-center gap-4">
                                <motion.div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </motion.div>
                                <div>
                                    <p className="text-2xl font-display font-bold text-text-primary">{stats[stat.key] || 0}</p>
                                    <p className="text-xs text-text-secondary">{stat.label}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="mb-8">
                    <BuyerCredibilityScore user={user} savedCount={stats.totalSaved} inquiryCount={inquiryCount} />
                </div>

                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-display font-semibold text-text-primary">Recently Saved Properties</h2>
                        <Link to="/buyer/favorites">
                            <Button variant="ghost" size="sm" iconRight={ArrowRight}>View All</Button>
                        </Link>
                    </div>
                    {stats.properties?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {stats.properties.slice(0, 4).map((p) => (
                                <PropertyCard key={p.id} property={p} showActions={false} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Heart className="w-10 h-10 text-text-muted mx-auto mb-3" />
                            <p className="text-text-secondary text-sm">No saved properties yet</p>
                            <Link to="/properties">
                                <Button variant="secondary" size="sm" className="mt-3">Browse Properties</Button>
                            </Link>
                        </div>
                    )}
                </Card>

                {/* Recently Viewed Properties */}
                {recentlyViewed.length > 0 && (
                    <Card>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-display font-semibold text-text-primary flex items-center gap-2">
                                <Clock className="w-4 h-4 text-royal-400" />
                                Recently Viewed
                            </h2>
                            <button
                                onClick={clearRecentlyViewed}
                                className="text-xs text-text-muted hover:text-red-400 transition-colors"
                            >
                                Clear History
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {recentlyViewed.slice(0, 6).map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/properties/${item.id}`}
                                    className="group flex flex-col rounded-xl overflow-hidden border border-surface-border hover:border-royal-500/40 bg-surface-hover hover:bg-surface-card transition-all"
                                >
                                    <div className="h-20 overflow-hidden">
                                        <img
                                            src={item.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300'}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs font-semibold text-text-primary truncate group-hover:text-royal-400 transition-colors">{item.title}</p>
                                        <p className="text-[10px] text-text-muted flex items-center gap-0.5 mt-0.5">
                                            <MapPin className="w-2.5 h-2.5" />{item.city}
                                        </p>
                                        <p className="text-xs font-bold text-gradient mt-1">
                                            {formatCurrency(item.price)}
                                            {item.listingType === 'RENT' && <span className="text-[9px] font-normal text-text-muted">/mo</span>}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link to="/properties">
                        <Card hover className="text-center">
                            <Search className="w-8 h-8 text-royal-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-text-primary">Browse Properties</p>
                        </Card>
                    </Link>
                    <Link to="/buyer/favorites">
                        <Card hover className="text-center">
                            <Heart className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-text-primary">Saved Properties</p>
                        </Card>
                    </Link>
                    <Link to="/buyer/chat">
                        <Card hover className="text-center">
                            <MessageSquare className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-text-primary">Messages</p>
                        </Card>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default BuyerDashboard;
