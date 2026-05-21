import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, Eye, CheckCircle2, ArrowRight, Building2, TrendingUp, Edit3, Trash2 } from 'lucide-react';
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
    const listings = rawListings.filter((l) => {
        if (user?.activeRole === 'SELLER') {
            return l.listingType === 'SALE';
        } else if (user?.activeRole === 'RENTAL_OWNER') {
            return l.listingType === 'RENT' || l.listingType === 'LEASE';
        }
        return true;
    });

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

                {/* Recent Listings */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-display font-semibold text-text-primary">Recent Listings</h2>
                        <Link to="/seller/listings"><Button variant="ghost" size="sm" iconRight={ArrowRight}>View All</Button></Link>
                    </div>
                    {listings.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-surface-border">
                                        <th className="text-left text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Property</th>
                                        <th className="text-left text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Price</th>
                                        <th className="text-left text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Status</th>
                                        <th className="text-left text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Date</th>
                                        <th className="text-right text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {listings.map((l) => (
                                        <tr key={l.id} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="py-3">
                                                <Link to={`/properties/${l.id}`} className="text-sm text-text-primary hover:text-royal-400 transition-colors font-medium">{l.title}</Link>
                                                <p className="text-xs text-text-muted">{l.location?.city}</p>
                                            </td>
                                            <td className="py-3 text-sm text-gradient font-semibold">{formatCurrency(l.price || l.monthlyRent || l.leaseAmount)}</td>
                                            <td className="py-3"><Badge variant={l.status === 'APPROVED' ? 'success' : 'warning'} dot>{PROPERTY_STATUS_LABELS[l.status]}</Badge></td>
                                            <td className="py-3 text-xs text-text-muted">{formatDate(l.createdAt)}</td>
                                            <td className="py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link to={`/properties/${l.id}`} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"><Eye className="w-4 h-4" /></Link>
                                                    <Link to={`/seller/edit/${l.id}`} className="p-2 rounded-lg text-text-secondary hover:text-royal-400 hover:bg-royal-500/10 transition-all"><Edit3 className="w-4 h-4" /></Link>
                                                    <button onClick={() => setDeleteId(l.id)} className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Building2 className="w-10 h-10 text-text-muted mx-auto mb-3" />
                            <p className="text-text-secondary text-sm">No listings yet. Create your first listing!</p>
                        </div>
                    )}
                </Card>

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
