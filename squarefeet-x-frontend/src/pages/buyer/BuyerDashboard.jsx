import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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

const BuyerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { savedIds, initForUser } = useSavedStore();
    const isRentalSeeker = user?.activeRole === 'RENTAL_SEEKER';

    const statCards = [
        { key: 'totalInquiries', label: 'Inquiries Sent', icon: MessageSquare, color: 'from-emerald-600 to-emerald-500', to: '/buyer/chat' },
        { key: 'totalViewed', label: isRentalSeeker ? 'Rentals Viewed' : 'Properties Viewed', icon: Search, color: 'from-royal-600 to-royal-500', to: '/properties' },
        { key: 'totalSaved', label: isRentalSeeker ? 'Saved Rentals' : 'Saved Properties', icon: Heart, color: 'from-pink-600 to-pink-500', to: '/buyer/favorites' },
        { key: 'activeChats', label: 'Active Chats', icon: MessageSquare, color: 'from-emerald-600 to-emerald-500', to: '/buyer/chat' },
    ];

    useEffect(() => {
        if (user?.id) initForUser(user.id);
    }, [user?.id, initForUser]);

    let roleListingFilter = null;
    if (user?.activeRole === 'BUYER') {
        roleListingFilter = 'SALE';
    } else if (user?.activeRole === 'RENTAL_SEEKER') {
        roleListingFilter = 'RENT,LEASE';
    }

    const { data: chatData, refetch: refetchChats } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => chatService.getConversations().then((r) => r.data),
    });

    const { data: apiStats, isLoading, refetch } = useQuery({
        queryKey: ['buyer-stats', user?.id, user?.activeRole],
        queryFn: () => propertyService.getBuyerDashboard().then((r) => r.data),
        enabled: !!user?.id,
    });

    useEffect(() => {
        if (user?.id) {
            refetch();
            refetchChats();
        }
    }, [user?.id, user?.activeRole, refetch, refetchChats]);

    const recentlyViewed = useRecentlyViewedStore((s) => s.items);
    const clearRecentlyViewed = useRecentlyViewedStore((s) => s.clearAll);

    const backendRecentlyViewed = apiStats?.recentlyViewed || [];
    const recentlyViewedList = backendRecentlyViewed.length > 0 ? backendRecentlyViewed : recentlyViewed;

    const availableProperties = apiStats?.propertiesForYou || [];
    const savedProperties = apiStats?.properties || [];
    const activeChats = chatData?.conversations?.length || 0;
    // Use active chat conversations as the inquiry count — each conversation = one inquiry
    const inquiryCount = activeChats;

    const stats = {
        totalInquiries: apiStats?.stats?.totalInquiries ?? inquiryCount,
        totalViewed: apiStats?.stats?.totalViewed ?? recentlyViewedList.length,
        totalSaved: apiStats?.stats?.totalSaved ?? savedIds.length,
        activeChats: apiStats?.stats?.activeChats ?? activeChats,
        properties: savedProperties,
    };

    if (isLoading) return <DashboardSkeleton />;

    return (
        <>
            <SEOHead title={isRentalSeeker ? "Rental Seeker Dashboard" : "Buyer Dashboard"} noindex />
            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary">
                        Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-text-secondary mt-1">
                        {isRentalSeeker ? "Here's your rental search overview" : "Here's your property search overview"}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <motion.div key={stat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Link to={stat.to} className="block h-full">
                                <Card hover className="flex items-center gap-4 h-full">
                                    <motion.div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <p className="text-2xl font-display font-bold text-text-primary">{stats[stat.key] || 0}</p>
                                        <p className="text-xs text-text-secondary">{stat.label}</p>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="mb-8">
                    <BuyerCredibilityScore user={user} savedCount={stats.totalSaved} inquiryCount={stats.totalInquiries} precalculatedScore={apiStats?.buyerCredentialScore} precalculatedFactors={apiStats?.buyerCredentialFactors} />
                </div>

                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-display font-semibold text-text-primary">
                            {isRentalSeeker ? 'Recently Saved Rentals' : 'Recently Saved Properties'}
                        </h2>
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
                            <p className="text-text-secondary text-sm">
                                {isRentalSeeker ? 'No saved rentals yet' : 'No saved properties yet'}
                            </p>
                            <Link to="/properties">
                                <Button variant="secondary" size="sm" className="mt-3">
                                    {isRentalSeeker ? 'Browse Rentals' : 'Browse Properties'}
                                </Button>
                            </Link>
                        </div>
                    )}
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-display font-semibold text-text-primary">
                                {isRentalSeeker ? 'Rentals For You' : 'Properties For You'}
                            </h2>
                            <p className="text-xs text-text-secondary mt-0.5">
                                {isRentalSeeker 
                                    ? 'Showing results from the latest rental seeker API response.' 
                                    : 'Showing results from the latest buyer API response.'}
                            </p>
                        </div>
                        <Link to="/properties">
                            <Button variant="ghost" size="sm" iconRight={ArrowRight}>View All</Button>
                        </Link>
                    </div>
                    {availableProperties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {availableProperties.slice(0, 4).map((p) => (
                                <PropertyCard
                                    key={p.id}
                                    property={p}
                                    onUnlock={() => navigate(`/properties/${p.id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Search className="w-10 h-10 text-text-muted mx-auto mb-3" />
                            <p className="text-text-secondary text-sm">
                                {isRentalSeeker ? 'No matching rentals found' : 'No matching properties found'}
                            </p>
                            <Link to="/properties">
                                <Button variant="secondary" size="sm" className="mt-3">
                                    {isRentalSeeker ? 'Browse Rentals' : 'Browse Properties'}
                                </Button>
                            </Link>
                        </div>
                    )}
                </Card>

                {/* Recently Viewed Properties */}
                {recentlyViewedList.length > 0 && (
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
                            {recentlyViewedList.slice(0, 6).map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/properties/${item.id}`}
                                    className="group flex flex-col rounded-xl overflow-hidden border border-surface-border hover:border-royal-500/40 bg-surface-hover hover:bg-surface-card transition-all"
                                >
                                    <div className="h-20 overflow-hidden">
                                        <img
                                            src={item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300'}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs font-semibold text-text-primary truncate group-hover:text-royal-400 transition-colors">{item.title}</p>
                                        <p className="text-[10px] text-text-muted flex items-center gap-0.5 mt-0.5">
                                            <MapPin className="w-2.5 h-2.5" />{item.location?.city || item.city}
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
                            <p className="text-sm font-medium text-text-primary">
                                {isRentalSeeker ? 'Browse Rentals' : 'Browse Properties'}
                            </p>
                        </Card>
                    </Link>
                    <Link to="/buyer/favorites">
                        <Card hover className="text-center">
                            <Heart className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-text-primary">
                                {isRentalSeeker ? 'Saved Rentals' : 'Saved Properties'}
                            </p>
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
