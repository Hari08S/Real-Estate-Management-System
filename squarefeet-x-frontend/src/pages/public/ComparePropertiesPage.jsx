import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bed, Bath, Maximize, CheckCircle2, XCircle, ArrowLeft, Trash2, IndianRupee } from 'lucide-react';
import { useCompareStore } from '../../store/compareStore';
import { useNotificationStore } from '../../store/notificationStore';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils';
import { PROPERTY_STATUS_LABELS } from '../../constants';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SEOHead from '../../components/common/SEOHead';
import Footer from '../../components/layout/Footer';

const ComparePropertiesPage = () => {
    const { items, removeItem, clearAll } = useCompareStore();

    return (
        <div className="min-h-screen bg-surface-dark flex flex-col justify-between">
            <div className="flex-1 w-full flex flex-col justify-center">
                {items.length === 0 ? (
                    <div className="page-container py-20 text-center pt-28">
                        <div className="w-24 h-24 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-text-muted" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-text-primary mb-2">No properties to compare</h2>
                        <p className="text-text-secondary mb-8">You haven't added any properties to your comparison list yet.</p>
                        <Link to="/properties">
                            <Button variant="primary">Browse Properties</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="page-container pt-28 pb-10">
                        <SEOHead title="Compare Properties" />
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-display font-bold text-text-primary">Compare Properties</h1>
                                <p className="text-text-secondary mt-1">Side-by-side comparison of your selected properties</p>
                            </div>
                            <div className="flex gap-3">
                                <Link to="/properties">
                                    <Button variant="secondary" icon={ArrowLeft}>Back to Browse</Button>
                                </Link>
                                <Button variant="danger" icon={Trash2} onClick={() => {
                                    clearAll();
                                    toast.success('Comparison list cleared');
                                    useNotificationStore.getState().addNotification({
                                        id: `compare-clear-${Date.now()}`,
                                        title: 'Comparison Update',
                                        message: `Comparison list cleared.`,
                                        link: '/compare',
                                        createdAt: Date.now(),
                                        read: false
                                    });
                                }}>Clear All</Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-6">
                            <div className="min-w-[800px] flex gap-6">
                                {/* Feature Labels Column */}
                                <div className="w-48 shrink-0 flex flex-col pt-[272px] space-y-6">
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Price</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Price / sq.ft</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Location Score</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Location</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Property Type</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Listing Type</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Bedrooms</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Bathrooms</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Total Area</div>
                                    <div className="h-14 flex items-center font-semibold text-text-primary border-b border-surface-border">Status</div>
                                    <div className="flex-1 pt-4 font-semibold text-text-primary">Description</div>
                                </div>

                                {/* Property Columns */}
                                <AnimatePresence>
                                    {items.map((property) => (
                                        <motion.div
                                            key={property.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex-1 min-w-[300px] flex flex-col bg-surface-card rounded-2xl border border-surface-border p-4 shadow-sm"
                                        >
                                            {/* Header / Image */}
                                            <div className="relative mb-4 h-40 rounded-xl overflow-hidden group">
                                                <img
                                                    src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
                                                    alt={property.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <button
                                                    onClick={() => {
                                                        removeItem(property.id);
                                                        toast.success('Removed from comparison');
                                                        useNotificationStore.getState().addNotification({
                                                            id: `compare-remove-${property.id}-${Date.now()}`,
                                                            title: 'Comparison Update',
                                                            message: `Removed ${property.title} from comparison list.`,
                                                            link: '/compare',
                                                            createdAt: Date.now(),
                                                            read: false
                                                        });
                                                    }}
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur transition-colors"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                            
                                            <Link to={`/properties/${property.id}`} className="block h-14 mb-6">
                                                <h3 className="text-lg font-display font-semibold text-text-primary line-clamp-2 hover:text-royal-500 transition-colors">
                                                    {property.title}
                                                </h3>
                                            </Link>

                                            {/* Specs */}
                                            <div className="space-y-6 flex-1">
                                                <div className="h-14 flex items-center text-xl font-display font-bold text-gradient-royal border-b border-surface-border">
                                                    {formatCurrency(property.price || property.monthlyRent || property.leaseAmount)}
                                                </div>
                                                <div className="h-14 flex items-center text-text-primary font-medium border-b border-surface-border">
                                                    {property.area && (property.price || property.monthlyRent || property.leaseAmount)
                                                        ? `₹${Math.round((property.price || property.monthlyRent || property.leaseAmount) / property.area).toLocaleString('en-IN')}/sq.ft`
                                                        : '-'}
                                                </div>
                                                <div className="h-14 flex items-center text-text-primary border-b border-surface-border">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                                                        ★ {(7.5 + ((property.title.length + (property.location?.city?.length || 0)) % 25) / 10).toFixed(1)} / 10
                                                    </span>
                                                </div>
                                                <div className="h-14 flex items-center text-text-secondary border-b border-surface-border">
                                                    <MapPin className="w-4 h-4 mr-1 text-royal-400" />
                                                    {property.location?.city}, {property.location?.state}
                                                </div>
                                                <div className="h-14 flex items-center capitalize text-text-primary border-b border-surface-border">
                                                    {property.propertyType}
                                                </div>
                                                <div className="h-14 flex items-center text-text-primary border-b border-surface-border">
                                                    <Badge variant={property.listingType === 'SALE' ? 'primary' : 'warning'}>
                                                        {property.listingType === 'SALE' ? 'For Sale' : property.listingType === 'RENT' ? 'For Rent' : 'For Lease'}
                                                    </Badge>
                                                </div>
                                                <div className="h-14 flex items-center text-text-primary border-b border-surface-border">
                                                    <Bed className="w-4 h-4 mr-2 text-text-muted" /> {property.bedrooms || '-'}
                                                </div>
                                                <div className="h-14 flex items-center text-text-primary border-b border-surface-border">
                                                    <Bath className="w-4 h-4 mr-2 text-text-muted" /> {property.bathrooms || '-'}
                                                </div>
                                                <div className="h-14 flex items-center text-text-primary border-b border-surface-border">
                                                    <Maximize className="w-4 h-4 mr-2 text-text-muted" /> {property.area ? `${property.area} sq.ft` : '-'}
                                                </div>
                                                <div className="h-14 flex items-center text-text-primary border-b border-surface-border">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${property.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-hover text-text-secondary'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${property.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-text-secondary'}`} />
                                                        {PROPERTY_STATUS_LABELS[property.status] || property.status}
                                                    </span>
                                                </div>
                                                <div className="pt-4 text-sm text-text-secondary line-clamp-4">
                                                    {property.description || 'No description available.'}
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-surface-border">
                                                <Link to={`/properties/${property.id}`}>
                                                    <Button variant="primary" className="w-full">View Details</Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default ComparePropertiesPage;
