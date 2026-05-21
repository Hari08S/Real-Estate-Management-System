import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, IndianRupee, Unlock, GitCompare, Heart, Share2 } from 'lucide-react';
import { formatCurrency, truncateText } from '../../utils';
import { PROPERTY_STATUS_LABELS } from '../../constants';
import { useSavedStore } from '../../store/savedStore';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const statusVariant = {
    APPROVED: 'success',
    PENDING: 'warning',
    REJECTED: 'danger',
    SOLD: 'info',
    RENTED: 'info',
    DRAFT: 'default',
    UNDER_REVIEW: 'warning',
    UNAVAILABLE: 'default',
};

const PropertyCard = memo(({ property, onUnlock, onCompare, showActions = true }) => {
    const {
        id, title, images, price, monthlyRent, location: loc, propertyType,
        bedrooms, bathrooms, area, status, listingType, isUnlocked
    } = property;

    const toggleSave = useSavedStore((s) => s.toggleSave);
    const isSaved = useSavedStore((s) => s.isSaved(id));

    const displayPrice = price || monthlyRent || property.leaseAmount || 0;
    const priceLabel = listingType === 'RENT' ? '/mo' : listingType === 'LEASE' ? '/lease' : '';
    
    // Fallback images by property type
    const fallbackImages = {
        apartment: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
        ],
        villa: [
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
        ],
        commercial: [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
        ],
        penthouse: [
            'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800'
        ],
        plot: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
        ]
    };
    
    const getFallbackImage = () => {
        const typeImages = fallbackImages[propertyType?.toLowerCase()] || fallbackImages.apartment;
        // Simple hash to pick a consistent image for the same property ID
        const index = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % typeImages.length;
        return typeImages[index];
    };

    const mainImage = (images && images.length > 0) ? images[0] : getFallbackImage();

    const handleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowSaved = toggleSave(id);
        toast.success(nowSaved ? 'Property saved!' : 'Removed from saved');
    };

    const handleShare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/properties/${id}`;
        const priceText = formatCurrency(price || monthlyRent || property.leaseAmount || 0);
        const text = `🏠 ${title}\n📍 ${loc?.city}, ${loc?.state}\n💰 ${priceText}${listingType === 'RENT' ? '/mo' : ''}\n\nView property: ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glass-card-hover overflow-hidden group"
        >
            {/* Image */}
            <Link to={`/properties/${id}`} className="relative block aspect-[16/10] overflow-hidden">
                <img
                    src={mainImage}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-royal-600 text-white shadow-lg backdrop-blur-md border border-white/10">
                        {listingType === 'SALE' ? 'For Sale' : listingType === 'RENT' ? 'For Rent' : 'For Lease'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-surface-dark/90 text-white shadow-lg backdrop-blur-md border border-white/10">
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'APPROVED' ? 'bg-emerald-400' : status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                        {PROPERTY_STATUS_LABELS[status] || status}
                    </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        className={`w-8 h-8 rounded-full backdrop-blur flex items-center justify-center transition-all ${isSaved ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
                    >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/80 hover:bg-black/60 transition-all"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
                {isUnlocked && (
                    <div className="absolute bottom-3 right-3">
                        <Badge variant="success"><Unlock className="w-3 h-3 mr-1" /> Contact Revealed</Badge>
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="p-4 space-y-3">
                <Link to={`/properties/${id}`}>
                    <h3 className="text-text-primary font-display font-semibold text-lg leading-tight hover:text-royal-400 transition-colors line-clamp-1">
                        {title}
                    </h3>
                </Link>

                {loc && (
                    <div className="flex items-center gap-1.5 text-text-secondary text-sm">
                        <MapPin className="w-3.5 h-3.5 text-royal-400" />
                        <span className="line-clamp-1">{loc.city}, {loc.state}</span>
                    </div>
                )}

                {/* Specs */}
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                    {bedrooms && (
                        <div className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5" /> {bedrooms} Bed
                        </div>
                    )}
                    {bathrooms && (
                        <div className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5" /> {bathrooms} Bath
                        </div>
                    )}
                    {area && (
                        <div className="flex items-center gap-1">
                            <Maximize className="w-3.5 h-3.5" /> {area} sqft
                        </div>
                    )}
                </div>

                {/* Price + Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                    <div>
                        <p className="text-xl font-display font-bold text-gradient">
                            {formatCurrency(displayPrice)}
                            <span className="text-sm font-normal text-text-muted">{priceLabel}</span>
                        </p>
                    </div>
                    {showActions && (
                        <div className="flex gap-2">
                            {onCompare && (
                                <button onClick={() => onCompare(property)} className="p-2 rounded-xl text-text-secondary hover:text-royal-400 hover:bg-royal-500/10 transition-all">
                                    <GitCompare className="w-4 h-4" />
                                </button>
                            )}
                            {!isUnlocked && onUnlock && (
                                <Button size="sm" variant="primary" onClick={() => onUnlock(property)}>
                                    <Unlock className="w-3.5 h-3.5" /> View Contact
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

PropertyCard.displayName = 'PropertyCard';
export default PropertyCard;

