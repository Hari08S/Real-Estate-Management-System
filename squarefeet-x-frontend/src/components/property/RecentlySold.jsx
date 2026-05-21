import { CheckCircle2, Clock, Bed, Bath, Maximize, TrendingDown, TrendingUp } from 'lucide-react';
import { MOCK_SOLD_PROPERTIES } from '../../data/mockData';
import { formatCurrency } from '../../utils';

const getDaysAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * Shows recently sold/rented properties in the same city or type.
 * Gives buyers real market price data.
 */
export const RecentlySoldSection = ({ city, listingType, currentPrice, area }) => {
    // Show city-matched first, then fall back to all
    const relevant = [
        ...MOCK_SOLD_PROPERTIES.filter((p) => p.city === city),
        ...MOCK_SOLD_PROPERTIES.filter((p) => p.city !== city && p.listingType === listingType),
    ].slice(0, 4);

    if (!relevant.length) return null;

    const currentPriceSqft = currentPrice && area ? Math.round(currentPrice / area) : null;

    return (
        <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-lg font-display font-semibold text-text-primary">
                    Recently Sold / Rented Nearby
                </h3>
                <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-full">
                    Real market data
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relevant.map((p) => {
                    const soldPriceSqft = p.soldPrice && p.area ? Math.round(p.soldPrice / p.area) : null;
                    const diffPercent = currentPriceSqft && soldPriceSqft
                        ? (((currentPriceSqft - soldPriceSqft) / soldPriceSqft) * 100).toFixed(0)
                        : null;
                    const daysAgo = getDaysAgo(p.soldAt);

                    return (
                        <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-surface-hover border border-surface-border hover:border-emerald-500/30 transition-all">
                            <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0">
                                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-text-primary truncate">{p.title}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">{p.city}, {p.state}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-xs font-bold text-emerald-400">
                                        {formatCurrency(p.soldPrice)}
                                        {p.listingType === 'RENT' && <span className="font-normal text-text-muted">/mo</span>}
                                    </span>
                                    {diffPercent !== null && (
                                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
                                            Number(diffPercent) > 0 ? 'text-red-400' : 'text-emerald-400'
                                        }`}>
                                            {Number(diffPercent) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(Number(diffPercent))}% vs this
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                                    {p.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed className="w-2.5 h-2.5" />{p.bedrooms}</span>}
                                    {p.area && <span className="flex items-center gap-0.5"><Maximize className="w-2.5 h-2.5" />{p.area} sqft</span>}
                                    <span className="flex items-center gap-0.5 ml-auto">
                                        <Clock className="w-2.5 h-2.5" />
                                        {daysAgo}d ago · {p.daysOnMarket}d on market
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-[10px] text-text-muted mt-2">
                * Prices shown are actual transaction prices. Use these to gauge real market value.
            </p>
        </div>
    );
};
