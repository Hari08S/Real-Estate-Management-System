import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils';

/* ─── Price Per Sqft Badge ─── */
export const PricePerSqftBadge = ({ price, area, city, properties = [] }) => {
    if (!price || !area) return null;
    const priceSqft = Math.round(price / area);

    // Calculate area average from similar properties
    const similarWithArea = properties.filter(
        (p) => p.location?.city === city && p.price && p.area
    );
    const avgPriceSqft = similarWithArea.length > 0
        ? Math.round(similarWithArea.reduce((s, p) => s + p.price / p.area, 0) / similarWithArea.length)
        : null;

    const diff = avgPriceSqft ? Math.round(((priceSqft - avgPriceSqft) / avgPriceSqft) * 100) : null;

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-royal-500/10 border border-royal-500/20 text-xs font-medium text-royal-300">
                <Maximize className="w-3.5 h-3.5" />
                ₹{priceSqft.toLocaleString('en-IN')}/sqft
            </span>
            {diff !== null && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    diff < -5 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    diff > 5 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                    {diff < -5 ? <TrendingDown className="w-3.5 h-3.5" /> :
                     diff > 5 ? <TrendingUp className="w-3.5 h-3.5" /> :
                     <Minus className="w-3.5 h-3.5" />}
                    {Math.abs(diff)}% {diff < 0 ? 'below' : diff > 0 ? 'above' : 'at'} area avg
                </span>
            )}
        </div>
    );
};

/* ─── Similar Properties Carousel ─── */
export const SimilarPropertiesSection = ({ currentId, city, listingType, properties = [] }) => {
    const similar = properties
        .filter((p) => p.id !== currentId &&
            (p.location?.city === city || p.listingType === listingType))
        .slice(0, 6);

    if (!similar.length) return null;

    return (
        <div className="mt-8">
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-royal-500 rounded-full inline-block" />
                You May Also Like
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similar.map((p) => (
                    <Link
                        key={p.id}
                        to={`/properties/${p.id}`}
                        className="group glass-card overflow-hidden hover:border-royal-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-royal-500/10"
                    >
                        <div className="h-36 overflow-hidden">
                            <img
                                src={p.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'}
                                alt={p.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <div className="p-3">
                            <p className="text-sm font-semibold text-text-primary truncate group-hover:text-royal-400 transition-colors">
                                {p.title}
                            </p>
                            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{p.location?.city}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm font-bold text-gradient">
                                    {formatCurrency(p.price || p.monthlyRent || p.leaseAmount)}
                                    {p.listingType === 'RENT' && <span className="text-[10px] text-text-muted font-normal">/mo</span>}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                    {p.bedrooms && <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
                                    {p.bathrooms && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
                                    {p.area && <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{p.area}</span>}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
