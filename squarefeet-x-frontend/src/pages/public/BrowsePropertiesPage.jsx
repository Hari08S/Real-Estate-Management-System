import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, MapPin, Grid3X3, LayoutList, Clock, Bell, Trash2 } from 'lucide-react';
import { useFilterStore } from '../../store/filterStore';
import toast from 'react-hot-toast';
import { useCompareStore } from '../../store/compareStore';
import { useSearchHistoryStore } from '../../store/searchHistoryStore';
import { useAlertPreferencesStore } from '../../store/alertPreferencesStore';
import { useNotificationStore } from '../../store/notificationStore';
import { propertyService } from '../../services/api';
import { useAuth, useDebouncedCallback, useIntersectionObserver } from '../../hooks';
import { ROLES, PROPERTY_TYPES, LISTING_TYPES } from '../../constants';
import Footer from '../../components/layout/Footer';
import PropertyCard from '../../components/common/PropertyCard';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { PropertyCardSkeleton } from '../../components/ui/Skeleton';
import SEOHead from '../../components/common/SEOHead';
import { AlertPreferencesModal } from '../../components/property/AlertPreferencesModal';
import { motion } from 'framer-motion';

const BrowsePropertiesPage = () => {
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [page, setPage] = useState(1);
    const [showHistory, setShowHistory] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [localSearch, setLocalSearch] = useState('');
    const { filters, setFilter, resetFilters } = useFilterStore();
    const { addItem } = useCompareStore();
    const { addSearch, removeSearch, history } = useSearchHistoryStore();
    const { preferences } = useAlertPreferencesStore();
    const { user } = useAuth();

    let roleListingFilter = null;
    if (user?.activeRole === ROLES.BUYER) {
        roleListingFilter = 'SALE';
    } else if (user?.activeRole === ROLES.RENTAL_SEEKER) {
        roleListingFilter = 'RENT,LEASE';
    }

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['properties', filters, page, roleListingFilter],
        queryFn: () => {
            const queryParams = { 
                ...filters, 
                minPrice: filters.priceMin,
                maxPrice: filters.priceMax,
                page, 
                limit: 12 
            };
            if (roleListingFilter) {
                queryParams.listingType = roleListingFilter;
            }
            return propertyService.getAll(queryParams).then((r) => r.data);
        },
        placeholderData: (prev) => prev,
    });

    const allowedListingTypes = LISTING_TYPES.filter((type) => {
        if (user?.activeRole === ROLES.BUYER) return type.value === 'SALE';
        if (user?.activeRole === ROLES.RENTAL_SEEKER) return type.value === 'RENT' || type.value === 'LEASE';
        return true;
    });

    const properties = data?.properties || [];
    const totalPages = data?.totalPages || 1;

    useEffect(() => {
        if (properties.length > 0) {
            const matchesAnyPreference = useAlertPreferencesStore.getState().matchesAnyPreference;
            const addNotification = useNotificationStore.getState().addNotification;
            const notifications = useNotificationStore.getState().notifications;
            
            properties.forEach((property) => {
                if (matchesAnyPreference(property)) {
                    const alreadyNotified = notifications.some(
                        (n) => n.id === `alert-${property.id}`
                    );
                    if (!alreadyNotified) {
                        addNotification({
                            id: `alert-${property.id}`,
                            title: 'New Matching Listing!',
                            message: `A property matches your active alerts: ${property.title} in ${property.location?.city || ''}.`,
                            link: `/properties/${property.id}`,
                            createdAt: Date.now(),
                            read: false
                        });
                        toast.success(`New property alert: ${property.title}!`, { icon: '🔔' });
                    }
                }
            });
        }
    }, [properties]);

    const debouncedSearch = useDebouncedCallback((value) => {
        if (value.trim()) addSearch(value.trim(), filters);
        setFilter('search', value);
        setPage(1);
    }, 400);

    const applyHistorySearch = (query) => {
        setLocalSearch(query);
        setFilter('search', query);
        setPage(1);
        setShowHistory(false);
    };

    const loadMoreRef = useIntersectionObserver(
        useCallback(() => {
            if (page < totalPages && !isFetching) setPage((p) => p + 1);
        }, [page, totalPages, isFetching])
    );

    return (
        <>
            <SEOHead
                title="Browse Properties"
                description="Browse thousands of verified properties. Buy, rent or lease with zero commission."
            />
            <div className="w-full">
                <div className="pt-8 pb-16">
                    <div className="page-container">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Browse Properties</h1>
                            <p className="text-text-secondary">Find your perfect property from verified listings</p>
                        </div>

                        {/* Category filter tabs */}
                        {(!user || (user.activeRole !== ROLES.BUYER && user.activeRole !== ROLES.RENTAL_SEEKER)) && (
                            <div className="flex gap-4 border-b border-surface-border mb-6">
                                <button
                                    onClick={() => { setFilter('listingType', ''); setPage(1); }}
                                    className={`pb-3 text-sm font-medium transition-all border-b-2 px-1 ${
                                        !filters.listingType
                                            ? 'border-royal-500 text-royal-400 font-semibold'
                                            : 'border-transparent text-text-muted hover:text-text-secondary'
                                    }`}
                                >
                                    All Properties
                                </button>
                                <button
                                    onClick={() => { setFilter('listingType', 'SALE'); setPage(1); }}
                                    className={`pb-3 text-sm font-medium transition-all border-b-2 px-1 ${
                                        filters.listingType === 'SALE'
                                            ? 'border-royal-500 text-royal-400 font-semibold'
                                            : 'border-transparent text-text-muted hover:text-text-secondary'
                                    }`}
                                >
                                    Buy (For Sale)
                                </button>
                                <button
                                    onClick={() => { setFilter('listingType', 'RENT'); setPage(1); }}
                                    className={`pb-3 text-sm font-medium transition-all border-b-2 px-1 ${
                                        filters.listingType === 'RENT'
                                            ? 'border-royal-500 text-royal-400 font-semibold'
                                            : 'border-transparent text-text-muted hover:text-text-secondary'
                                    }`}
                                >
                                    Rent (For Rent/Lease)
                                </button>
                            </div>
                        )}

                        {/* Search + Controls */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search by title, city, or location..."
                                    value={localSearch}
                                    onChange={(e) => {
                                        setLocalSearch(e.target.value);
                                        debouncedSearch(e.target.value);
                                    }}
                                    onFocus={() => setShowHistory(true)}
                                    onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                                    className="w-full bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50 focus:border-royal-500 transition-all"
                                />
                                {/* Search History Dropdown */}
                                {showHistory && history.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-surface-border rounded-xl shadow-xl z-30 overflow-hidden">
                                        <div className="px-3 py-2 border-b border-surface-border">
                                            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Recent Searches
                                            </span>
                                        </div>
                                        {history.map((h) => (
                                            <div key={h.query}
                                                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-hover cursor-pointer"
                                                onClick={() => applyHistorySearch(h.query)}
                                            >
                                                <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                                <span className="text-sm text-text-secondary flex-1">{h.query}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeSearch(h.query); }}
                                                    className="text-text-muted hover:text-red-400 p-0.5"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {/* Alert Preferences Button */}
                                <button
                                    onClick={() => setShowAlertModal(true)}
                                    className={`relative p-2.5 rounded-xl border transition-all ${
                                        preferences.length > 0
                                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                                            : 'border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                    }`}
                                    title="Listing Alert Preferences"
                                >
                                    <Bell className="w-4 h-4" />
                                    {preferences.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-navy-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                                            {preferences.length}
                                        </span>
                                    )}
                                </button>
                                <Button
                                    variant={showFilters ? 'primary' : 'secondary'}
                                    icon={SlidersHorizontal}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    Filters
                                </Button>
                                <div className="flex rounded-xl border border-surface-border overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-royal-500/15 text-royal-400' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        <Grid3X3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-royal-500/15 text-royal-400' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        <LayoutList className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden mb-6"
                                >
                                    <div className="glass-card p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
                                            <button onClick={resetFilters} className="text-xs text-royal-400 hover:text-royal-300">Reset All</button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            <Select
                                                placeholder="Property Type"
                                                options={PROPERTY_TYPES}
                                                value={filters.propertyType}
                                                onChange={(e) => { setFilter('propertyType', e.target.value); setPage(1); }}
                                            />
                                            <Select
                                                placeholder="Listing Type"
                                                options={allowedListingTypes}
                                                value={filters.listingType}
                                                onChange={(e) => { setFilter('listingType', e.target.value); setPage(1); }}
                                            />
                                            <Input
                                                placeholder="Min Price"
                                                type="number"
                                                value={filters.priceMin}
                                                onChange={(e) => { setFilter('priceMin', e.target.value); setPage(1); }}
                                            />
                                            <Input
                                                placeholder="Max Price"
                                                type="number"
                                                value={filters.priceMax}
                                                onChange={(e) => { setFilter('priceMax', e.target.value); setPage(1); }}
                                            />
                                            <Select
                                                placeholder="Bedrooms"
                                                options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}+ BHK` }))}
                                                value={filters.bedrooms}
                                                onChange={(e) => { setFilter('bedrooms', e.target.value); setPage(1); }}
                                            />
                                            <Input
                                                placeholder="City"
                                                icon={MapPin}
                                                value={filters.city}
                                                onChange={(e) => { setFilter('city', e.target.value); setPage(1); }}
                                            />
                                            <Select
                                                placeholder="Furnishing"
                                                options={[
                                                    { value: 'FURNISHED', label: 'Furnished' },
                                                    { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
                                                    { value: 'UNFURNISHED', label: 'Unfurnished' }
                                                ]}
                                                value={filters.furnishing}
                                                onChange={(e) => { setFilter('furnishing', e.target.value); setPage(1); }}
                                            />
                                            <Select
                                                placeholder="RERA Approved"
                                                options={[
                                                    { value: 'APPROVED', label: 'RERA Approved' },
                                                    { value: 'PENDING', label: 'RERA Pending' }
                                                ]}
                                                value={filters.reraStatus}
                                                onChange={(e) => { setFilter('reraStatus', e.target.value); setPage(1); }}
                                            />
                                            <Select
                                                placeholder="Floor"
                                                options={[
                                                    { value: 'GROUND', label: 'Ground Floor' },
                                                    { value: 'LOW', label: 'Low Floor' },
                                                    { value: 'MEDIUM', label: 'Medium Floor' },
                                                    { value: 'HIGH', label: 'High Floor' }
                                                ]}
                                                value={filters.floor}
                                                onChange={(e) => { setFilter('floor', e.target.value); setPage(1); }}
                                            />
                                            <Select
                                                placeholder="Distance Radius"
                                                options={[
                                                    { value: '2', label: 'Within 2 km' },
                                                    { value: '5', label: 'Within 5 km' },
                                                    { value: '10', label: 'Within 10 km' },
                                                    { value: '20', label: 'Within 20 km' }
                                                ]}
                                                value={filters.distance}
                                                onChange={(e) => {
                                                    const dist = e.target.value;
                                                    setFilter('distance', dist);
                                                    if (dist) {
                                                        setFilter('pinnedLat', '17.3850');
                                                        setFilter('pinnedLng', '78.4867');
                                                    } else {
                                                        setFilter('pinnedLat', '');
                                                        setFilter('pinnedLng', '');
                                                    }
                                                    setPage(1);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Results */}
                        {isLoading ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                {[...Array(6)].map((_, i) => <PropertyCardSkeleton key={i} />)}
                            </div>
                        ) : properties.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-text-muted" />
                                </div>
                                <h3 className="text-lg font-display font-semibold text-text-primary mb-2">No properties found</h3>
                                <p className="text-text-secondary text-sm">Try adjusting your filters or search terms</p>
                                <Button variant="secondary" className="mt-4" onClick={resetFilters}>Clear Filters</Button>
                            </div>
                        ) : (
                            <>
                                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                    {properties.map((property) => (
                                        <PropertyCard
                                            key={property.id}
                                            property={property}
                                            onCompare={(p) => addItem(p)}
                                        />
                                    ))}
                                </div>
                                <div ref={loadMoreRef} className="h-10 mt-8 flex items-center justify-center">
                                    {isFetching && <div className="w-6 h-6 border-2 border-royal-500 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <Footer />
            </div>

            {showAlertModal && <AlertPreferencesModal onClose={() => setShowAlertModal(false)} />}
        </>
    );
};

export default BrowsePropertiesPage;
