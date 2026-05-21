import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Eye, CheckCircle2, MapPin, Star, ArrowLeft, Phone, Mail, Calendar } from 'lucide-react';
import { propertyService, userService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils';
import { PROPERTY_STATUS_LABELS } from '../../constants';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PropertyCard from '../../components/common/PropertyCard';
import SEOHead from '../../components/common/SEOHead';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import Footer from '../../components/layout/Footer';
import { motion } from 'framer-motion';

const SellerPortfolioPage = () => {
    const { sellerId } = useParams();

    const { data: userData, isLoading: userLoading } = useQuery({
        queryKey: ['seller-profile', sellerId],
        queryFn: () => userService.getUser(sellerId).then((r) => r.data),
        enabled: !!sellerId,
    });

    const { data: propsData, isLoading: propsLoading } = useQuery({
        queryKey: ['seller-listings-public', sellerId],
        queryFn: () => propertyService.getAll({ sellerId, limit: 50 }).then((r) => r.data),
        enabled: !!sellerId,
    });

    const seller = userData?.user;
    const allProps = propsData?.properties || [];
    const activeListings = allProps.filter((p) => p.status === 'APPROVED');
    const totalViews = allProps.reduce((s, p) => s + (p.views || 0), 0);
    const avgPrice = activeListings.length
        ? Math.round(activeListings.reduce((s, p) => s + (p.price || p.monthlyRent || p.leaseAmount || 0), 0) / activeListings.length)
        : 0;

    const isLoading = userLoading || propsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <>
            <SEOHead
                title={seller ? `${seller.name}'s Properties` : 'Seller Portfolio'}
                description={`Browse all properties listed by ${seller?.name || 'this seller'} on SquareFeet X`}
            />
            <div className="w-full">
                <div className="pt-8 pb-16">
                    <div className="page-container">
                        {/* Back */}
                        <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6">
                            <ArrowLeft className="w-4 h-4" /> Back to Browse
                        </Link>

                        {/* Seller Profile Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="mb-8 bg-gradient-to-r from-royal-900/30 to-surface-card border-royal-500/20">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                    <Avatar name={seller?.name || 'S'} size="xl" className="ring-4 ring-royal-500/30" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-2xl font-display font-bold text-text-primary">
                                                {seller?.name || 'Seller'}
                                            </h1>
                                            {activeListings.length >= 2 && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30">
                                                    <Star className="w-3 h-3 fill-current" /> Verified Seller
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-text-secondary text-sm mb-3">
                                            {seller?.activeRole === 'RENTAL_OWNER' ? 'Rental Owner' : 'Property Seller'} on SquareFeet X
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                                            {seller?.email && (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-royal-400" />
                                                    {seller.email}
                                                </span>
                                            )}
                                            {seller?.phone && (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 text-royal-400" />
                                                    {seller.phone}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-royal-400" />
                                                Member since {formatDate(seller?.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-surface-border">
                                    {[
                                        { label: 'Total Listings', value: allProps.length, icon: Building2, color: 'text-royal-400' },
                                        { label: 'Active Listings', value: activeListings.length, icon: CheckCircle2, color: 'text-emerald-400' },
                                        { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-400' },
                                        { label: 'Avg. Price', value: formatCurrency(avgPrice), icon: Star, color: 'text-amber-400' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="text-center">
                                            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                                            <p className="text-lg font-display font-bold text-text-primary">{stat.value}</p>
                                            <p className="text-xs text-text-muted">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Listings */}
                        {activeListings.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-display font-semibold text-text-primary">
                                        Active Listings ({activeListings.length})
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {activeListings.map((p) => (
                                        <PropertyCard key={p.id} property={p} showActions={false} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <Card className="text-center py-16">
                                <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
                                <h3 className="text-lg font-display font-semibold text-text-primary mb-2">No Active Listings</h3>
                                <p className="text-text-secondary text-sm">This seller has no active properties at this time.</p>
                            </Card>
                        )}
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
};

export default SellerPortfolioPage;
