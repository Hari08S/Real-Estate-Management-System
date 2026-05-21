import { useState } from 'react';
import { Bell, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useAlertPreferencesStore } from '../../store/alertPreferencesStore';
import { LISTING_TYPES } from '../../constants';
import toast from 'react-hot-toast';

export const AlertPreferencesModal = ({ onClose }) => {
    const { preferences, addPreference, removePreference } = useAlertPreferencesStore();
    const [city, setCity] = useState('');
    const [listingType, setListingType] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [bedrooms, setBedrooms] = useState('');

    const handleAdd = () => {
        if (!city.trim()) { toast.error('Enter a city or area'); return; }
        addPreference({ city: city.trim(), listingType, maxPrice, bedrooms });
        toast.success('Alert preference saved!');
        setCity(''); setListingType(''); setMaxPrice(''); setBedrooms('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-400" />
                        Listing Alert Preferences
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-xs text-text-muted mb-4">
                    Set your preferences. When a new matching property is listed, you'll see an alert badge while browsing.
                </p>

                {/* Add Form */}
                <div className="p-4 rounded-xl bg-surface-hover border border-surface-border space-y-3 mb-5">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Add New Alert</p>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City / Area *"
                            className="col-span-2 bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-royal-500"
                        />
                        <select
                            value={listingType}
                            onChange={(e) => setListingType(e.target.value)}
                            className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                        >
                            <option value="">Any Type</option>
                            {LISTING_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <select
                            value={bedrooms}
                            onChange={(e) => setBedrooms(e.target.value)}
                            className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                        >
                            <option value="">Any BHK</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>{n}+ BHK</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="Max Price (₹)"
                            className="col-span-2 bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-royal-500"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="w-full py-2 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Save Alert
                    </button>
                </div>

                {/* Existing Preferences */}
                {preferences.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Active Alerts ({preferences.length}/5)</p>
                        {preferences.map((p) => (
                            <div key={p.id} className="flex items-start justify-between p-3 rounded-xl bg-surface-hover border border-surface-border">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-medium text-text-primary">{p.city}</p>
                                        <p className="text-text-muted">
                                            {[p.listingType, p.bedrooms && `${p.bedrooms}+ BHK`, p.maxPrice && `under ₹${Number(p.maxPrice).toLocaleString('en-IN')}`]
                                                .filter(Boolean).join(' · ') || 'Any property'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => removePreference(p.id)} className="text-text-muted hover:text-red-400 transition-colors ml-2 shrink-0">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-xs text-text-muted py-4">No alerts set yet</p>
                )}

                <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl border border-surface-border text-text-secondary hover:text-text-primary text-sm font-medium transition-all">
                    Close
                </button>
            </div>
        </div>
    );
};
