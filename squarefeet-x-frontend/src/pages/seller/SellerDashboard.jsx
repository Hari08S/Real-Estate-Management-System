import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, Eye, CheckCircle2, ArrowRight, Building2, TrendingUp, Edit3, Trash2, MapPin } from 'lucide-react';
import { propertyService } from '../../services/api';
import { useAuth } from '../../hooks';
import { PROPERTY_STATUS_LABELS } from '../../constants';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../utils';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const SellerDashboard = () => {
    const { user } = useAuth();
    const [deleteId, setDeleteId] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['seller-listings'],
        queryFn: () => propertyService.getMyListings({ limit: 5 }).then((r) => r.data),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => propertyService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
            toast.success('Listing deleted');
            setDeleteId(null);
        },
        onError: () => toast.error('Failed to delete'),
    });

    if (isLoading) return <DashboardSkeleton />;

    const rawListings = data?.properties || [];
    const listings = rawListings;

    const stats = {
        totalListings: listings.length,
        activeListings: listings.filter(l => l.status === 'APPROVED').length,
        totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0),
        totalInquiries: listings.reduce((sum, l) => sum + (l.unlockCount || 0), 0),
    };

    return (
        <>
            <SEOHead title="Seller Dashboard" noindex />
            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-display font-bold text-text-primary">
                        Welcome, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-text-secondary mt-1">Manage your property listings. Use public browse only if you want to research the market — your listings live under My Listings.</p>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Listings', value: stats.totalListings || 0, icon: Building2, color: 'from-royal-600 to-royal-500' },
                        { label: 'Active', value: stats.activeListings || 0, icon: CheckCircle2, color: 'from-emerald-600 to-emerald-500' },
                        { label: 'Total Views', value: stats.totalViews || 0, icon: Eye, color: 'from-blue-600 to-blue-500' },
                        { label: 'Inquiries Received', value: stats.totalInquiries || 0, icon: TrendingUp, color: 'from-emerald-600 to-emerald-500' },
                    ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card hover className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-display font-bold text-text-primary">{stat.value}</p>
                                    <p className="text-xs text-text-secondary">{stat.label}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* New Listing CTA */}
                <Card className="bg-gradient-to-r from-royal-700/30 to-gold-700/20 border-royal-500/20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-display font-semibold text-text-primary">List a New Property</h3>
                            <p className="text-sm text-text-secondary">It's completely free — zero listing fees</p>
                        </div>
                        <Link to="/seller/create">
                            <Button variant="gold" icon={PlusCircle}>Create Listing</Button>
                        </Link>
                    </div>
                </Card>

                {/* Performance Analytics Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-display font-semibold text-text-primary">Property Performance Analytics</h2>
                            <p className="text-xs text-text-secondary mt-0.5">Real-time listing views, conversion rates, and buyer engagement metrics</p>
                        </div>
                        <Link to="/seller/listings">
                            <Button variant="ghost" size="sm" iconRight={ArrowRight}>View All Listings</Button>
                        </Link>
                    </div>

                    {listings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((l) => {
                                const conversionRate = l.views > 0 ? ((l.unlockCount / l.views) * 100).toFixed(1) : '0.0';
                                return (
                                    <motion.div key={l.id} whileHover={{ y: -4 }} className="transition-all duration-200">
                                        <Card className="flex flex-col h-full bg-surface-card border border-surface-border">
                                            {/* Listing Title & Info */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant={l.status === 'APPROVED' ? 'success' : 'warning'} dot>
                                                        {PROPERTY_STATUS_LABELS[l.status]}
                                                    </Badge>
                                                    <span className="text-[10px] text-text-muted font-medium">{formatDate(l.createdAt)}</span>
                                                </div>
                                                <Link to={`/properties/${l.id}`} className="text-sm font-bold text-text-primary hover:text-royal-400 transition-colors line-clamp-1">
                                                    {l.title}
                                                </Link>
                                                <p className="text-xs text-text-muted flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-royal-400 shrink-0" />
                                                    {l.location?.city || 'N/A'}, {l.location?.state || 'N/A'}
                                                </p>
                                                <p className="text-sm text-gradient font-bold mt-1">
                                                    {formatCurrency(l.price || l.monthlyRent || l.leaseAmount)}
                                                </p>
                                            </div>

                                            {/* Analytics Section */}
                                            <div className="mt-4 pt-4 border-t border-surface-border space-y-3">
                                                <p className="text-[10px] font-bold text-gradient uppercase tracking-widest">Listing Metrics</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-surface-hover/30 rounded-xl p-2.5 border border-surface-border text-center">
                                                        <span className="text-[10px] text-text-secondary block mb-0.5">Views</span>
                                                        <span className="text-sm font-bold text-text-primary flex items-center justify-center gap-1.5">
                                                            <Eye className="w-4 h-4 text-blue-400" /> {l.views || 0}
                                                        </span>
                                                    </div>
                                                    <div className="bg-surface-hover/30 rounded-xl p-2.5 border border-surface-border text-center">
                                                        <span className="text-[10px] text-text-secondary block mb-0.5">Unlocks</span>
                                                        <span className="text-sm font-bold text-text-primary flex items-center justify-center gap-1.5">
                                                            <TrendingUp className="w-4 h-4 text-emerald-400" /> {l.unlockCount || 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Conversion progress bar */}
                                                <div className="bg-royal-500/5 rounded-xl p-3 border border-royal-500/10 space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs font-semibold text-royal-400">
                                                        <span>Buyer Interest Rate</span>
                                                        <span>{conversionRate}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden border border-surface-border">
                                                        <div className="h-full bg-royal-500 rounded-full" style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }} />
                                                    </div>
                                                </div>

                                                {/* Seeker Demographics & Time-on-page */}
                                                {(() => {
                                                    const buyersPercent = l.buyerPercent !== undefined && l.buyerPercent !== null ? l.buyerPercent : 0;
                                                    const seekersPercent = Math.max(0, 100 - buyersPercent);
                                                    const avgTimeSecs = l.avgTimeOnPage !== undefined && l.avgTimeOnPage !== null ? l.avgTimeOnPage : 0;
                                                    const avgTimeStr = `${Math.floor(avgTimeSecs / 60)}m ${avgTimeSecs % 60}s`;
                                                    return (
                                                        <div className="bg-surface-hover/20 rounded-xl p-3 border border-surface-border space-y-2">
                                                            <div className="flex justify-between items-center text-[10px] text-text-secondary">
                                                                <span>Seeker Demographics</span>
                                                                <span className="font-bold text-text-primary">{buyersPercent}% Buyers / {seekersPercent}% Seekers</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] text-text-secondary">
                                                                <span>Avg. Time on Page</span>
                                                                <span className="font-bold text-text-primary">{avgTimeStr}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Quick Actions Footer */}
                                            <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
                                                <Link to={`/properties/${l.id}`} className="text-xs font-semibold text-royal-400 hover:text-royal-300 transition-colors flex items-center gap-1">
                                                    View Page <ArrowRight className="w-3 h-3" />
                                                </Link>
                                                <div className="flex items-center gap-1">
                                                    <Link to={`/seller/edit/${l.id}`} className="p-2 rounded-lg text-text-secondary hover:text-royal-400 hover:bg-royal-500/10 transition-all">
                                                        <Edit3 className="w-4 h-4" />
                                                    </Link>
                                                    <button onClick={() => setDeleteId(l.id)} className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-surface-hover/10 rounded-2xl border border-dashed border-surface-border">
                            <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
                            <p className="text-text-secondary text-sm font-medium">No active property listings found</p>
                            <p className="text-xs text-text-muted mt-1">Start by adding a new property listing to review its analytics!</p>
                        </div>
                    )}
                </div>

                <ConfirmDialog
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={() => deleteMutation.mutate(deleteId)}
                    title="Delete Listing"
                    message="Are you sure you want to delete this listing? This action cannot be undone."
                    confirmText="Delete"
                    isLoading={deleteMutation.isPending}
                />
            </div>
        </>
    );
};

export default SellerDashboard;
