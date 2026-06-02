import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/api';
import { Building2, Search, Edit3, Trash2, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS } from '../../constants';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

const AdminPropertiesPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const typeParam = searchParams.get('type');
    const [activeTab, setActiveTab] = useState(typeParam === 'rent' ? 'RENT' : typeParam === 'sale' ? 'SALE' : 'ALL');
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (typeParam === 'rent') {
            setActiveTab('RENT');
        } else if (typeParam === 'sale') {
            setActiveTab('SALE');
        } else {
            setActiveTab('ALL');
        }
    }, [typeParam]);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-properties'],
        queryFn: () => adminService.getProperties().then(r => r.data)
    });

    const deleteMutation = useMutation({
        //@ts-ignore
        mutationFn: (id) => adminService.deleteProperty(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
            toast.success('Property deleted');
            setDeleteId(null);
        },
        onError: () => toast.error('Failed to delete property'),
    });

    const statusMutation = useMutation({
        //@ts-ignore
        mutationFn: ({ id, status }) => adminService.updatePropertyStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
            toast.success('Status updated');
        },
        onError: () => toast.error('Failed to update status'),
    });

    if (isLoading) return <DashboardSkeleton />;

    const allFilteredProperties = (data?.properties || []).filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.city?.toLowerCase().includes(search.toLowerCase())
    );

    const properties = allFilteredProperties.filter(p => {
        if (activeTab === 'SALE') return p.listingType === 'SALE';
        if (activeTab === 'RENT') return p.listingType === 'RENT' || p.listingType === 'LEASE';
        return true;
    });

    const statusVariant = { APPROVED: 'success', PENDING: 'warning', REJECTED: 'danger', DRAFT: 'default', UNDER_REVIEW: 'warning', SOLD: 'info', RENTED: 'info' };

    return (
        <>
            <SEOHead title="Manage Properties" noindex />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-display font-bold text-text-primary">Manage Properties</h1>
                    <p className="text-text-secondary mt-1">Full CRUD access to all properties on the platform</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search properties by title or city..."
                        className="w-full sm:w-80 bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                    />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-surface-border gap-2">
                    {[
                        { id: 'ALL', label: 'All Listings' },
                        { id: 'SALE', label: 'Seller Properties (For Sale)' },
                        { id: 'RENT', label: 'Rent/Lease Properties' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                const q = tab.id === 'ALL' ? '' : tab.id === 'SALE' ? '?type=sale' : '?type=rent';
                                navigate(`/admin/properties${q}`);
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-royal-500 text-royal-400 font-semibold'
                                    : 'border-transparent text-text-muted hover:text-text-secondary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <Card padding={false}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-border">
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase">Property</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase">Type / List</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase">Price</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase">Status</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase">Created</th>
                                    <th className="text-right text-xs font-medium text-text-muted p-4 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {properties.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-text-secondary">
                                            <Building2 className="w-10 h-10 text-text-muted mx-auto mb-3" />
                                            No properties found
                                        </td>
                                    </tr>
                                ) : properties.map((p) => (
                                    <tr key={p.id} onClick={() => navigate(`/properties/${p.id}`)} className="hover:bg-surface-hover/50 transition-colors cursor-pointer">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">{p.title}</p>
                                                    <p className="text-xs text-text-muted">{p.location?.city}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-text-secondary capitalize">{p.propertyType}</span>
                                            <Badge variant="royal" className="ml-2">{p.listingType}</Badge>
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-gradient">{formatCurrency(p.price || p.monthlyRent || p.leaseAmount)}</td>
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={p.status}
                                                onChange={(e) => statusMutation.mutate({ id: p.id, status: e.target.value })}
                                                className="bg-surface-dark border border-surface-border block rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-royal-500/50 text-text-primary outline-none cursor-pointer"
                                            >
                                                {Object.values(PROPERTY_STATUS).map(s => (
                                                    <option key={s} value={s} className="bg-surface-dark text-text-primary">{PROPERTY_STATUS_LABELS[s]}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-4 text-xs text-text-muted">{formatDate(p.createdAt)}</td>
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/properties/${p.id}`} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link to={`/admin/properties/edit/${p.id}`} className="p-2 rounded-lg text-text-secondary hover:text-royal-400 hover:bg-royal-500/10 transition-all">
                                                    <Edit3 className="w-4 h-4" />
                                                </Link>
                                                <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
                    title="Delete Property"
                    message="Are you sure you want to delete this property completely?"
                    confirmText="Delete"
                    isLoading={deleteMutation.isPending}
                />
            </div>
        </>
    );
};

export default AdminPropertiesPage;
