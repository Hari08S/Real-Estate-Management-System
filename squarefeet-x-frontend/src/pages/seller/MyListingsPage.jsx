import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit3, Trash2, Eye, MoreVertical, PlusCircle, Search } from 'lucide-react';
import { propertyService } from '../../services/api';
import { PROPERTY_STATUS_LABELS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

import { useAuth } from '../../hooks';

const MyListingsPage = () => {
    const { user } = useAuth();
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['my-listings'],
        queryFn: () => propertyService.getMyListings({}).then((r) => r.data),
    });

    const deleteMutation = useMutation({
        //@ts-ignore
        mutationFn: (id) => propertyService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-listings'] });
            toast.success('Listing deleted');
            setDeleteId(null);
        },
        onError: () => toast.error('Failed to delete'),
    });

    const rawListings = data?.properties || [];
    const roleFiltered = rawListings.filter((l) => {
        if (user?.activeRole === 'SELLER') {
            return l.listingType === 'SALE';
        } else if (user?.activeRole === 'RENTAL_OWNER') {
            return l.listingType === 'RENT' || l.listingType === 'LEASE';
        }
        return true;
    });

    const listings = roleFiltered.filter((l) =>
        l.title?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <DashboardSkeleton />;

    const statusVariant = { APPROVED: 'success', PENDING: 'warning', REJECTED: 'danger', DRAFT: 'default', UNDER_REVIEW: 'warning', SOLD: 'info', RENTED: 'info' };

    return (
        <>
            <SEOHead title="My Listings" noindex />
            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-text-primary">My Listings</h1>
                        <p className="text-text-secondary text-sm">{listings.length} properties listed</p>
                    </div>
                    <Link to="/seller/create">
                        <Button icon={PlusCircle} variant="gold">New Listing</Button>
                    </Link>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search listings..."
                        className="w-full sm:w-80 bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                    />
                </div>

                <Card padding={false}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-border">
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Property</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Type</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Price</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Status</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Created</th>
                                    <th className="text-right text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {listings.map((l) => (
                                    <tr key={l.id} className="hover:bg-surface-hover/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={l.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">{l.title}</p>
                                                    <p className="text-xs text-text-muted">{l.location?.city}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4"><Badge variant="royal">{l.listingType}</Badge></td>
                                        <td className="p-4 text-sm font-semibold text-gradient">{formatCurrency(l.price || l.monthlyRent || l.leaseAmount)}</td>
                                        <td className="p-4"><Badge variant={statusVariant[l.status] || 'default'} dot>{PROPERTY_STATUS_LABELS[l.status]}</Badge></td>
                                        <td className="p-4 text-xs text-text-muted">{formatDate(l.createdAt)}</td>
                                        <td className="p-4">
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

export default MyListingsPage;
