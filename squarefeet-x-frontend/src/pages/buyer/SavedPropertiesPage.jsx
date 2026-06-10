import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { propertyService } from '../../services/api';
import { useAuth } from '../../hooks';
import PropertyCard from '../../components/common/PropertyCard';
import SEOHead from '../../components/common/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { PropertyCardSkeleton } from '../../components/ui/Skeleton';

const SavedPropertiesPage = () => {
    const { user } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['saved-properties', user?.id, user?.activeRole],
        queryFn: () => propertyService.getSavedProperties().then((r) => r.data),
        enabled: !!user?.id,
    });

    const savedProperties = (data?.properties || []).filter((p) => {
        if (user?.activeRole === 'BUYER') {
            return p.listingType === 'SALE';
        } else if (user?.activeRole === 'RENTAL_SEEKER') {
            return p.listingType === 'RENT' || p.listingType === 'LEASE';
        }
        return true;
    });

    return (
        <>
            <SEOHead title="Favorites" noindex />
            <div>
                <h1 className="text-2xl font-display font-bold text-text-primary mb-2">Favorites</h1>
                <p className="text-text-secondary mb-8">Properties you've favorited for quick access</p>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => <PropertyCardSkeleton key={i} />)}
                    </div>
                ) : savedProperties.length === 0 ? (
                    <div className="text-center py-20">
                        <Heart className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-display font-semibold text-text-primary mb-2">No saved properties</h3>
                        <p className="text-text-secondary text-sm">Click the heart icon on any property to save it here</p>
                        <Link to="/properties" className="inline-block mt-4 px-5 py-2 rounded-xl bg-royal-600 text-white text-sm hover:bg-royal-500 transition-all">
                            Browse Properties
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {savedProperties.map((p) => <PropertyCard key={p.id} property={p} showActions={false} />)}
                    </div>
                )}
            </div>
        </>
    );
};

export default SavedPropertiesPage;
