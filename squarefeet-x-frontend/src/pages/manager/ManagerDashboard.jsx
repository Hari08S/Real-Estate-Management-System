import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Inbox, CheckCircle2, Clock, XCircle, Building2, List, ArrowRight } from 'lucide-react';
import { managerService } from '../../services/api';
import { useAuth } from '../../hooks';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { PROPERTY_STATUS_LABELS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';

const ManagerDashboard = () => {
    const { user } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['manager-stats'],
        queryFn: () => managerService.getDashboardStats().then((r) => r.data),
    });

    if (isLoading) return <DashboardSkeleton />;

    const statCards = [
        { key: 'totalPending', label: 'Unassigned Pending', value: stats?.totalPending || 0, icon: Inbox, color: 'from-amber-600 to-amber-500' },
        { key: 'totalReviewing', label: 'Under Review', value: stats?.totalReviewing || 0, icon: Clock, color: 'from-royal-600 to-royal-500' },
        { key: 'totalApproved', label: 'Total Approved', value: stats?.totalApproved || 0, icon: CheckCircle2, color: 'from-emerald-600 to-emerald-500' },
        { key: 'totalRejected', label: 'Total Rejected', value: stats?.totalRejected || 0, icon: XCircle, color: 'from-red-600 to-red-500' },
    ];

    return (
        <>
            <SEOHead title="Manager Dashboard" noindex />
            <div className="space-y-8">
                {/* Welcome */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary">
                        Manager Workspace, <span className="text-gradient-royal">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-text-secondary mt-1">Here is the current overview of the property pipeline</p>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <motion.div key={stat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
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

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link to="/properties">
                        <Card hover className="text-center bg-gradient-to-br hover:from-royal-500/10 hover:to-transparent border-surface-border transition-colors">
                            <Search className="w-8 h-8 text-royal-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-text-primary">Browse All Properties</p>
                            <p className="text-xs text-text-muted mt-1">View the live property catalog</p>
                        </Card>
                    </Link>
                    <Link to="/manager/unassigned">
                        <Card hover className="text-center bg-gradient-to-br hover:from-amber-500/10 hover:to-transparent border-surface-border transition-colors">
                            <Inbox className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm font-medium text-text-primary">Unassigned Pool</p>
                            <p className="text-xs text-text-muted mt-1">Claim properties for review</p>
                        </Card>
                    </Link>
                    <Link to="/manager/listings">
                        <Card hover className="text-center bg-gradient-to-br hover:from-emerald-500/10 hover:to-transparent border-surface-border transition-colors">
                            <List className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm font-medium text-text-primary">Review Listings</p>
                            <p className="text-xs text-text-muted mt-1">Review claimed properties</p>
                        </Card>
                    </Link>
                </div>

                {/* Recent Activity Table */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-display font-semibold text-text-primary">System Property Feed</h2>
                    </div>
                    {stats?.recentActivity?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-surface-border">
                                        <th className="text-left text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Property</th>
                                        <th className="text-left text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Price</th>
                                        <th className="text-left text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Status</th>
                                        <th className="text-left text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Date Created</th>
                                        <th className="text-right text-xs font-medium text-text-muted pb-3 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {stats.recentActivity.map((l) => (
                                        <tr key={l.id} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={l.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                    <div>
                                                        <Link to={`/properties/${l.id}`} className="text-sm text-text-primary hover:text-royal-400 transition-colors font-medium">{l.title}</Link>
                                                        <p className="text-xs text-text-muted">{l.location?.city}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-sm text-gradient font-semibold">{formatCurrency(l.price || l.monthlyRent || l.leaseAmount)}</td>
                                            <td className="py-3">
                                                <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'} dot>
                                                    {PROPERTY_STATUS_LABELS[l.status] || l.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-xs text-text-muted">{formatDate(l.createdAt)}</td>
                                            <td className="py-3 text-right">
                                                <Link to={`/properties/${l.id}`}>
                                                    <Button variant="ghost" size="sm" iconRight={ArrowRight}>View Live</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Building2 className="w-10 h-10 text-text-muted mx-auto mb-3" />
                            <p className="text-text-secondary text-sm">No activity recorded yet.</p>
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
};

export default ManagerDashboard;
