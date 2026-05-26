import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, CheckCircle2, XCircle, Eye, Inbox, Building2, FileText, ShieldCheck } from 'lucide-react';
import { managerService } from '../../services/api';
import { useAuth } from '../../hooks';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ManagerListingsPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const typeParam = searchParams.get('type');

    // Determine active tab from URL or fallback
    const isUnassigned = location.pathname.includes('unassigned');
    const [activeTab, setActiveTab] = useState(isUnassigned ? 'unassigned' : 'my-cities');
    const [propertyCategory, setPropertyCategory] = useState(typeParam === 'rent' ? 'rent' : 'seller'); // 'seller' or 'rent'

    useEffect(() => {
        if (location.pathname.includes('unassigned')) {
            setActiveTab('unassigned');
        } else {
            setActiveTab('my-cities');
        }
    }, [location.pathname]);

    useEffect(() => {
        if (typeParam === 'rent') {
            setPropertyCategory('rent');
        } else if (typeParam === 'seller') {
            setPropertyCategory('seller');
        }
    }, [typeParam]);

    const [reviewModal, setReviewModal] = useState(null);
    const [inspectListing, setInspectListing] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const queryClient = useQueryClient();

    const { data: listings, isLoading } = useQuery({
        queryKey: ['manager-listings', activeTab],
        queryFn: () =>
            activeTab === 'my-cities'
                ? managerService.getListingsForReview({}).then((r) => r.data)
                : managerService.getUnassignedListings({}).then((r) => r.data),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, action, reason }) =>
            managerService.reviewListing(id, { action, rejectionReason: reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manager-listings'] });
            setReviewModal(null);
            setRejectionReason('');
            toast.success('Listing reviewed');
        },
        onError: () => toast.error('Review failed'),
    });

    const claimMutation = useMutation({
        mutationFn: (id) => managerService.claimListing(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manager-listings'] });
            toast.success('Listing claimed');
        },
        onError: () => toast.error('Claim failed'),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => managerService.updatePropertyStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manager-listings'] });
            toast.success('Status updated');
        },
        onError: () => toast.error('Failed to update status'),
    });

    const items = listings?.properties || [];
    const filteredItems = items.filter(item => 
        propertyCategory === 'seller'
            ? item.listingType === 'SALE'
            : (item.listingType === 'RENT' || item.listingType === 'LEASE')
    );

    if (isLoading) return <DashboardSkeleton />;

    const statusVariant = { 
        APPROVED: 'success', 
        PENDING: 'warning', 
        REJECTED: 'danger', 
        DRAFT: 'default', 
        UNDER_REVIEW: 'warning', 
        SOLD: 'info', 
        RENTED: 'info' 
    };

    return (
        <>
            <SEOHead title="Manager Dashboard" noindex />
            <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-display font-bold text-text-primary">
                        Manager <span className="text-gradient-royal">Dashboard</span>
                    </h1>
                    <p className="text-text-secondary mt-1">Review and manage property listings</p>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-surface-card rounded-xl w-fit">
                    {[
                        { key: 'my-cities', label: 'My Cities', icon: MapPin },
                        { key: 'unassigned', label: 'Unassigned Pool', icon: Inbox },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setActiveTab(tab.key);
                                navigate(`/manager/${tab.key === 'unassigned' ? 'unassigned' : 'listings'}?type=${propertyCategory}`);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.key ? 'bg-royal-600 text-white' : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Property Type Sub-tabs */}
                <div className="flex gap-2 border-b border-surface-border pb-3">
                    <button
                        onClick={() => navigate(`${location.pathname}?type=seller`)}
                        className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                            propertyCategory === 'seller'
                                ? 'border-royal-500 text-royal-400'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        Seller Properties (For Sale)
                    </button>
                    <button
                        onClick={() => navigate(`${location.pathname}?type=rent`)}
                        className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                            propertyCategory === 'rent'
                                ? 'border-royal-500 text-royal-400'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        Rent Owner Properties (For Rent/Lease)
                    </button>
                </div>

                {/* Listing Cards */}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20">
                        <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-display font-semibold text-text-primary mb-2">No listings to review</h3>
                        <p className="text-text-secondary text-sm">All caught up! Check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredItems.map((item) => (
                            <Card key={item.id} hover>
                                <div className="flex gap-4">
                                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100'} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-sm font-semibold text-text-primary truncate">{item.title}</h3>
                                                <p className="text-xs text-text-muted flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {item.location?.city}</p>
                                            </div>
                                            <Badge variant={statusVariant[item.status] || 'warning'} dot>{PROPERTY_STATUS_LABELS[item.status]}</Badge>
                                        </div>
                                        <p className="text-lg font-display font-bold text-gradient mt-2">{formatCurrency(item.price || item.monthlyRent || item.leaseAmount)}</p>
                                        <div className="flex gap-2 mt-3 items-center flex-wrap">
                                            {activeTab === 'unassigned' ? (
                                                <Button size="sm" variant="gold" onClick={() => claimMutation.mutate(item.id)} isLoading={claimMutation.isPending}>
                                                    Claim
                                                </Button>
                                            ) : (
                                                <>
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => statusMutation.mutate({ id: item.id, status: e.target.value })}
                                                        className="bg-surface-dark border border-surface-border block rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-royal-500/50 text-text-primary outline-none cursor-pointer"
                                                    >
                                                        {Object.values(PROPERTY_STATUS).map(s => (
                                                            <option key={s} value={s} className="bg-surface-dark text-text-primary">{PROPERTY_STATUS_LABELS[s]}</option>
                                                        ))}
                                                    </select>
                                                    <Button size="sm" variant="primary" icon={CheckCircle2} onClick={() => reviewMutation.mutate({ id: item.id, action: 'APPROVE' })}>
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" variant="danger" icon={XCircle} onClick={() => setReviewModal(item)}>
                                                        Reject
                                                    </Button>
                                                </>
                                            )}

                                            <Button size="sm" variant="secondary" icon={Eye} onClick={() => setInspectListing(item)}>Inspect Details</Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Rejection Modal */}
                <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Reject Listing" size="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-text-secondary">Please provide a reason for rejection:</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            className="w-full bg-surface-hover border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50 resize-none"
                            placeholder="Enter rejection reason..."
                        />
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setReviewModal(null)}>Cancel</Button>
                            <Button
                                variant="danger"
                                onClick={() => reviewMutation.mutate({ id: reviewModal.id, action: 'REJECT', reason: rejectionReason })}
                                isLoading={reviewMutation.isPending}
                                disabled={!rejectionReason.trim()}
                            >
                                Reject
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Inspect Property Listing Modal */}
                <Modal isOpen={!!inspectListing} onClose={() => setInspectListing(null)} title="Inspect Property Listing" size="lg">
                    {inspectListing && (
                        <div className="space-y-6">
                            {/* Title & Status */}
                            <div className="flex justify-between items-start border-b border-surface-border pb-4">
                                <div>
                                    <h3 className="text-lg font-display font-bold text-text-primary">{inspectListing.title}</h3>
                                    <p className="text-xs text-text-muted mt-1">Submitted on {formatDate(inspectListing.createdAt)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeTab !== 'unassigned' && (
                                        <select
                                            value={inspectListing.status}
                                            onChange={(e) => {
                                                statusMutation.mutate({ id: inspectListing.id, status: e.target.value });
                                                setInspectListing(prev => ({ ...prev, status: e.target.value }));
                                            }}
                                            className="bg-surface-dark border border-surface-border block rounded-lg px-2 py-1 text-xs text-text-primary outline-none cursor-pointer"
                                        >
                                            {Object.values(PROPERTY_STATUS).map(s => (
                                                <option key={s} value={s} className="bg-surface-dark text-text-primary">{PROPERTY_STATUS_LABELS[s]}</option>
                                            ))}
                                        </select>
                                    )}
                                    <Badge variant={statusVariant[inspectListing.status] || 'warning'} dot>{PROPERTY_STATUS_LABELS[inspectListing.status]}</Badge>
                                </div>
                            </div>

                            {/* Property Images */}
                            {inspectListing.images && inspectListing.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 h-28">
                                    {inspectListing.images.map((img, idx) => (
                                        <img key={idx} src={img} alt="" className="w-full h-full object-cover rounded-xl border border-surface-border" />
                                    ))}
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gradient uppercase tracking-wider">Property Details</h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Type</span>
                                            <span className="text-text-primary font-medium capitalize">{inspectListing.propertyType}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Listing Type</span>
                                            <span className="text-text-primary font-medium uppercase">{inspectListing.listingType}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Bedrooms</span>
                                            <span className="text-text-primary font-medium">{inspectListing.bedrooms ?? 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Bathrooms</span>
                                            <span className="text-text-primary font-medium">{inspectListing.bathrooms ?? 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Area</span>
                                            <span className="text-text-primary font-medium">{inspectListing.area ? `${inspectListing.area} sqft` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Price/Rent</span>
                                            <span className="text-text-primary font-semibold">{formatCurrency(inspectListing.price || inspectListing.monthlyRent || inspectListing.leaseAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gradient uppercase tracking-wider">Seller / Applicant Contact</h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Name</span>
                                            <span className="text-text-primary font-medium">{inspectListing.sellerContact?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Email</span>
                                            <span className="text-text-primary font-medium truncate max-w-[150px]">{inspectListing.sellerContact?.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-surface-border">
                                            <span className="text-text-secondary">Phone</span>
                                            <span className="text-text-primary font-medium">{inspectListing.sellerContact?.phone || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <h4 className="text-xs font-bold text-gradient uppercase tracking-wider pt-2">Full Location</h4>
                                    <div className="space-y-2 text-xs">
                                        <p className="text-text-primary font-medium leading-relaxed">
                                            {inspectListing.location?.address},<br />
                                            {inspectListing.location?.city}, {inspectListing.location?.state} - {inspectListing.location?.pincode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gradient uppercase tracking-wider">Description</h4>
                                <p className="text-xs text-text-secondary leading-relaxed bg-surface-hover/30 p-3 rounded-xl border border-surface-border max-h-24 overflow-y-auto">
                                    {inspectListing.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Verification Documents */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gradient uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-royal-400" /> Proof of Ownership & Verification Documents
                                </h4>
                                {inspectListing.verificationDocuments && inspectListing.verificationDocuments.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {inspectListing.verificationDocuments.map((doc, idx) => (
                                            <a
                                                key={idx}
                                                href={doc}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 rounded-xl border border-royal-500/20 bg-royal-500/5 hover:bg-royal-500/10 transition-colors text-xs text-royal-400"
                                            >
                                                <span className="flex items-center gap-2 truncate">
                                                    <FileText className="w-4 h-4 shrink-0" />
                                                    <span className="truncate font-medium text-text-primary">Ownership Proof #{idx + 1}</span>
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-royal-500/20 font-semibold uppercase shrink-0">View Doc</span>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex items-start gap-2">
                                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold block">âš ï¸ No Verification Documents Uploaded</span>
                                            <span className="text-text-secondary leading-relaxed mt-0.5 block">
                                                This listing has no proof of ownership. We strongly recommend contacting the seller to request verification documents before approving this listing.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Review Actions */}
                            <div className="flex justify-between items-center pt-4 border-t border-surface-border">
                                <div className="flex gap-2">
                                    {activeTab === 'unassigned' ? (
                                        <Button
                                            variant="gold"
                                            onClick={() => {
                                                claimMutation.mutate(inspectListing.id);
                                                setInspectListing(null);
                                            }}
                                            isLoading={claimMutation.isPending}
                                        >
                                            Claim Property
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="primary"
                                                icon={CheckCircle2}
                                                onClick={() => {
                                                    reviewMutation.mutate({ id: inspectListing.id, action: 'APPROVE' });
                                                    setInspectListing(null);
                                                }}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="danger"
                                                icon={XCircle}
                                                onClick={() => {
                                                    setReviewModal(inspectListing);
                                                    setInspectListing(null);
                                                }}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <Button variant="secondary" onClick={() => setInspectListing(null)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </>
    );
};

export default ManagerListingsPage;
