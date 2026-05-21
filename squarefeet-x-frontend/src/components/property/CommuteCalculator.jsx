import { useState } from 'react';
import { Navigation, Clock, Bike, Car, Bus, AlertCircle } from 'lucide-react';

const MODES = [
    { key: 'driving', label: 'Car', icon: Car, color: 'royal', speed: 30 },
    { key: 'cycling', label: 'Bike', icon: Bike, color: 'emerald', speed: 15 },
    { key: 'foot', label: 'Walk/Bus', icon: Bus, color: 'amber', speed: 8 },
];

// Calculate straight-line distance → estimated commute using avg speeds
const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const geocodeAddress = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (!data.length) throw new Error('Address not found');
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
};

export const CommuteCalculator = ({ propertyLat, propertyLng }) => {
    const [officeAddress, setOfficeAddress] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const calculate = async () => {
        if (!officeAddress.trim()) return;
        setLoading(true);
        setError('');
        setResults(null);
        try {
            const office = await geocodeAddress(officeAddress);
            const pLat = propertyLat || 17.385;
            const pLng = propertyLng || 78.4867;
            const distKm = haversineKm(pLat, pLng, office.lat, office.lng);
            // Add 1.35x factor for road vs straight-line
            const roadKm = distKm * 1.35;
            const modes = MODES.map((m) => ({
                ...m,
                km: roadKm.toFixed(1),
                mins: Math.round((roadKm / m.speed) * 60),
            }));
            setResults({ modes, address: office.display.split(',').slice(0, 2).join(',') });
        } catch {
            setError('Could not find that address. Try adding city name (e.g. "Madhapur, Hyderabad")');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 p-5 rounded-2xl bg-surface-card border border-surface-border">
            <h3 className="text-sm font-display font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-royal-400" />
                Commute Time Calculator
            </h3>
            <div className="flex gap-2">
                <input
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && calculate()}
                    placeholder="Enter your office address..."
                    className="flex-1 bg-surface-hover border border-surface-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-royal-500"
                />
                <button
                    onClick={calculate}
                    disabled={loading || !officeAddress.trim()}
                    className="px-4 py-2 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-semibold disabled:opacity-50 transition-all whitespace-nowrap"
                >
                    {loading ? '...' : 'Calculate'}
                </button>
            </div>

            {error && (
                <p className="mt-2 text-xs text-red-400 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{error}
                </p>
            )}

            {results && (
                <div className="mt-4 space-y-2">
                    <p className="text-[10px] text-text-muted truncate">
                        To: {results.address}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {results.modes.map((m) => (
                            <div key={m.key}
                                className={`p-3 rounded-xl text-center border ${
                                    m.color === 'royal' ? 'bg-royal-500/10 border-royal-500/20' :
                                    m.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                    'bg-amber-500/10 border-amber-500/20'
                                }`}>
                                <m.icon className={`w-4 h-4 mx-auto mb-1 ${
                                    m.color === 'royal' ? 'text-royal-400' :
                                    m.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                                }`} />
                                <p className="text-xs font-bold text-text-primary">{m.mins} min</p>
                                <p className="text-[10px] text-text-muted">{m.km} km</p>
                                <p className="text-[10px] text-text-muted">{m.label}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Estimated based on road distance & average speed
                    </p>
                </div>
            )}
        </div>
    );
};
