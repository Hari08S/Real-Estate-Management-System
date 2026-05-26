import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, Compass, Navigation, Car, Heart, Info, RotateCcw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';

import { propertyService } from '../../services/api';
import { useSavedStore } from '../../store/savedStore';
import { useAuth } from '../../hooks';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import { formatCurrency } from '../../utils';

// Helper component to adjust map bounds to fit both markers
const MapBoundsSetter = ({ fromCoords, toCoords }) => {
    const map = useMap();
    useEffect(() => {
        if (fromCoords && toCoords) {
            map.fitBounds([fromCoords, toCoords], { padding: [50, 50] });
        } else if (fromCoords) {
            map.setView(fromCoords, 13);
        } else if (toCoords) {
            map.setView(toCoords, 13);
        }
    }, [fromCoords, toCoords, map]);
    return null;
};

// Custom Leaflet Icons using stable public CDN assets
const fromIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const toIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Haversine formula to compute great-circle distance in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
};

// Extract structured address details from Nominatim's address object
const extractAddressDetails = (addressObj) => {
    if (!addressObj) return null;
    return {
        doorNo: addressObj.house_number || addressObj.building || addressObj.flat || addressObj.door_number || 'N/A',
        road: addressObj.road || addressObj.street || 'N/A',
        area: addressObj.suburb || addressObj.neighbourhood || addressObj.village || addressObj.hamlet || addressObj.residential || 'N/A',
        town: addressObj.city || addressObj.town || addressObj.municipality || addressObj.village || 'N/A',
        district: addressObj.city_district || addressObj.county || addressObj.district || 'N/A',
        state: addressObj.state || 'N/A',
        postcode: addressObj.postcode || 'N/A',
        country: addressObj.country || 'N/A'
    };
};

const RouteMapPage = () => {
    const { user } = useAuth();
    const savedIds = useSavedStore((s) => s.savedIds);

    // Queries
    const { data: allPropsData } = useQuery({
        queryKey: ['properties-browse'],
        queryFn: () => propertyService.getAll().then((r) => r.data),
    });
    const savedProperties = (allPropsData?.properties || []).filter((p) => savedIds.includes(p.id));

    // Inputs & Suggestions
    const [fromText, setFromText] = useState('');
    const [toText, setToText] = useState('');
    const [fromCoords, setFromCoords] = useState(null); // [lat, lng]
    const [toCoords, setToCoords] = useState(null);     // [lat, lng]
    const [fromDetails, setFromDetails] = useState(null);
    const [toDetails, setToDetails] = useState(null);

    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [isLocating, setIsLocating] = useState(false);

    // Debounce timer refs
    const fromTimerRef = useRef(null);
    const toTimerRef = useRef(null);

    // Clear timers on unmount
    useEffect(() => {
        return () => {
            if (fromTimerRef.current) clearTimeout(fromTimerRef.current);
            if (toTimerRef.current) clearTimeout(toTimerRef.current);
        };
    }, []);

    // Fetch suggestions helper with English-only results and address details
    const fetchSuggestions = async (query, setFunc) => {
        if (!query || query.trim().length < 3) {
            setFunc([]);
            return;
        }
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=en&addressdetails=1`
            );
            const data = await res.json();
            setFunc(data);
        } catch (e) {
            console.error('Error fetching suggestions:', e);
        }
    };

    // Locate user
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setFromCoords([latitude, longitude]);
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en&addressdetails=1`
                    );
                    const data = await res.json();
                    setFromText(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    setFromDetails(data.address || null);
                } catch {
                    setFromText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    setFromDetails(null);
                }
                setIsLocating(false);
            },
            (err) => {
                console.error(err);
                setIsLocating(false);
                alert('Could not retrieve your location. Please type manually.');
            }
        );
    };

    // Debounced input handlers
    const handleFromChange = (value) => {
        setFromText(value);
        if (fromTimerRef.current) {
            clearTimeout(fromTimerRef.current);
        }
        if (!value || value.trim().length < 3) {
            setFromSuggestions([]);
            return;
        }
        fromTimerRef.current = setTimeout(() => {
            fetchSuggestions(value, setFromSuggestions);
        }, 600); // 600ms debounce
    };

    const handleToChange = (value) => {
        setToText(value);
        if (toTimerRef.current) {
            clearTimeout(toTimerRef.current);
        }
        if (!value || value.trim().length < 3) {
            setToSuggestions([]);
            return;
        }
        toTimerRef.current = setTimeout(() => {
            fetchSuggestions(value, setToSuggestions);
        }, 600); // 600ms debounce
    };

    // Form Handlers
    const selectFrom = (sug) => {
        if (fromTimerRef.current) clearTimeout(fromTimerRef.current);
        setFromCoords([parseFloat(sug.lat), parseFloat(sug.lon)]);
        setFromText(sug.display_name);
        setFromDetails(sug.address || null);
        setFromSuggestions([]);
    };

    const selectTo = (sug) => {
        if (toTimerRef.current) clearTimeout(toTimerRef.current);
        setToCoords([parseFloat(sug.lat), parseFloat(sug.lon)]);
        setToText(sug.display_name);
        setToDetails(sug.address || null);
        setToSuggestions([]);
    };

    const handleQuickSetTo = (prop) => {
        if (toTimerRef.current) clearTimeout(toTimerRef.current);
        const lat = prop.location?.lat || 17.3850;
        const lng = prop.location?.lng || 78.4867;
        setToCoords([lat, lng]);
        setToText(`${prop.title}, ${prop.location?.city || ''}`);
        setToDetails({
            house_number: prop.location?.address?.split(',')[0] || '',
            road: prop.location?.address || '',
            city: prop.location?.city || '',
            state: prop.location?.state || '',
            postcode: prop.location?.pincode || '',
            country: 'India'
        });
    };

    const handleClear = () => {
        if (fromTimerRef.current) clearTimeout(fromTimerRef.current);
        if (toTimerRef.current) clearTimeout(toTimerRef.current);
        setFromText('');
        setToText('');
        setFromCoords(null);
        setToCoords(null);
        setFromDetails(null);
        setToDetails(null);
        setFromSuggestions([]);
        setToSuggestions([]);
    };

    // Derived values
    const distance = fromCoords && toCoords
        ? calculateDistance(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1])
        : null;

    const estDrivingTime = distance
        ? Math.round(parseFloat(distance) * 1.5 + 5) // Mock travel time logic based on distance
        : null;

    return (
        <>
            <SEOHead title="Location Route Planner" noindex />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary">
                        Location & Route <span className="text-gradient">Planner</span>
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Find directions, calculate distance, and plan travel routes to saved properties.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Controls Panel */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="space-y-4">
                            <div className="flex items-center justify-between border-b border-surface-border pb-3">
                                <h3 className="font-display font-semibold text-text-primary flex items-center gap-2">
                                    <Navigation className="w-4 h-4 text-royal-400" />
                                    Route Planner
                                </h3>
                                {(fromCoords || toCoords) && (
                                    <button
                                        onClick={handleClear}
                                        className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Clear
                                    </button>
                                )}
                            </div>

                            {/* From Search */}
                            <div className="relative space-y-1">
                                <label className="text-xs font-semibold text-text-secondary block">From (Start Location)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={fromText}
                                            onChange={(e) => handleFromChange(e.target.value)}
                                            placeholder="Type starting point..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-hover border border-surface-border rounded-xl focus:border-royal-500 focus:outline-none text-text-primary"
                                        />
                                        <MapPin className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleLocateMe}
                                        isLoading={isLocating}
                                        className="px-3"
                                        title="Use my current location"
                                    >
                                        <Compass className="w-4 h-4 text-royal-400" />
                                    </Button>
                                </div>

                                {/* From Suggestions dropdown */}
                                <AnimatePresence>
                                    {fromSuggestions.length > 0 && (
                                        <motion.ul
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute z-20 w-full bg-surface-card border border-surface-border rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-surface-border mt-1"
                                        >
                                            {fromSuggestions.map((sug) => (
                                                <li
                                                    key={sug.place_id}
                                                    onClick={() => selectFrom(sug)}
                                                    className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover cursor-pointer truncate"
                                                >
                                                    {sug.display_name}
                                                </li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>

                                {/* Structured Start Address Details */}
                                {fromDetails && (
                                    <div className="bg-surface-hover/30 border border-surface-border/50 rounded-xl p-3 mt-2 text-xs space-y-2">
                                        <p className="text-[10px] font-bold text-royal-400 uppercase tracking-wider">Start Address Details</p>
                                        <div className="grid grid-cols-2 gap-2 text-text-secondary">
                                            <div><span className="font-semibold text-text-muted">Door No:</span> {extractAddressDetails(fromDetails).doorNo}</div>
                                            <div><span className="font-semibold text-text-muted">Road/Cross:</span> {extractAddressDetails(fromDetails).road}</div>
                                            <div><span className="font-semibold text-text-muted">Area:</span> {extractAddressDetails(fromDetails).area}</div>
                                            <div><span className="font-semibold text-text-muted">Town/City:</span> {extractAddressDetails(fromDetails).town}</div>
                                            <div><span className="font-semibold text-text-muted">District:</span> {extractAddressDetails(fromDetails).district}</div>
                                            <div><span className="font-semibold text-text-muted">State:</span> {extractAddressDetails(fromDetails).state}</div>
                                            <div><span className="font-semibold text-text-muted">Postcode:</span> {extractAddressDetails(fromDetails).postcode}</div>
                                            <div><span className="font-semibold text-text-muted">Country:</span> {extractAddressDetails(fromDetails).country}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* To Search */}
                            <div className="relative space-y-1">
                                <label className="text-xs font-semibold text-text-secondary block">To (Destination Property)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={toText}
                                        onChange={(e) => handleToChange(e.target.value)}
                                        placeholder="Search or pick a saved property..."
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-surface-hover border border-surface-border rounded-xl focus:border-royal-500 focus:outline-none text-text-primary"
                                    />
                                    <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                                </div>

                                {/* To Suggestions dropdown */}
                                <AnimatePresence>
                                    {toSuggestions.length > 0 && (
                                        <motion.ul
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute z-20 w-full bg-surface-card border border-surface-border rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-surface-border mt-1"
                                        >
                                            {toSuggestions.map((sug) => (
                                                <li
                                                    key={sug.place_id}
                                                    onClick={() => selectTo(sug)}
                                                    className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover cursor-pointer truncate"
                                                >
                                                    {sug.display_name}
                                                </li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>

                                {/* Structured Destination Address Details */}
                                {toDetails && (
                                    <div className="bg-surface-hover/30 border border-surface-border/50 rounded-xl p-3 mt-2 text-xs space-y-2">
                                        <p className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">Destination Address Details</p>
                                        <div className="grid grid-cols-2 gap-2 text-text-secondary">
                                            <div><span className="font-semibold text-text-muted">Door No:</span> {extractAddressDetails(toDetails).doorNo}</div>
                                            <div><span className="font-semibold text-text-muted">Road/Cross:</span> {extractAddressDetails(toDetails).road}</div>
                                            <div><span className="font-semibold text-text-muted">Area:</span> {extractAddressDetails(toDetails).area}</div>
                                            <div><span className="font-semibold text-text-muted">Town/City:</span> {extractAddressDetails(toDetails).town}</div>
                                            <div><span className="font-semibold text-text-muted">District:</span> {extractAddressDetails(toDetails).district}</div>
                                            <div><span className="font-semibold text-text-muted">State:</span> {extractAddressDetails(toDetails).state}</div>
                                            <div><span className="font-semibold text-text-muted">Postcode:</span> {extractAddressDetails(toDetails).postcode}</div>
                                            <div><span className="font-semibold text-text-muted">Country:</span> {extractAddressDetails(toDetails).country}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Route info */}
                        {distance && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <Card className="bg-gradient-to-br from-royal-700/20 to-gold-700/10 border-royal-500/20 space-y-3">
                                    <h4 className="font-display font-semibold text-text-primary flex items-center gap-2 text-sm">
                                        <Info className="w-4 h-4 text-royal-400" />
                                        Travel Statistics
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface-card p-3 rounded-xl border border-surface-border/50 text-center">
                                            <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Distance</p>
                                            <p className="text-xl font-bold text-gradient mt-1">{distance} km</p>
                                        </div>
                                        <div className="bg-surface-card p-3 rounded-xl border border-surface-border/50 text-center">
                                            <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Est. Driving Time</p>
                                            <p className="text-xl font-bold text-gradient mt-1 flex items-center justify-center gap-1">
                                                <Car className="w-4 h-4 text-gold-400" />
                                                {estDrivingTime} mins
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* Saved properties helper */}
                        <Card className="space-y-4">
                            <h3 className="font-display font-semibold text-text-primary flex items-center gap-2 text-sm border-b border-surface-border pb-3">
                                <Heart className="w-4 h-4 text-pink-500" />
                                Saved Properties
                            </h3>
                            {savedProperties.length === 0 ? (
                                <p className="text-xs text-text-muted py-2 text-center">No saved properties yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {savedProperties.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between p-2 rounded-lg bg-surface-hover hover:bg-surface-hover/80 transition-colors border border-surface-border/50 text-left"
                                        >
                                            <div className="min-w-0 pr-2">
                                                <p className="text-xs font-semibold text-text-primary truncate">{p.title}</p>
                                                <p className="text-[10px] text-text-secondary">{p.location?.city || 'Unknown'}</p>
                                                <p className="text-[10px] font-medium text-gradient mt-0.5">{formatCurrency(p.price || p.monthlyRent)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleQuickSetTo(p)}
                                                className="shrink-0 text-[10px] font-semibold bg-royal-600 hover:bg-royal-500 text-white px-2 py-1 rounded transition-colors"
                                            >
                                                Set Destination
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Map Display Panel */}
                    <div className="lg:col-span-8">
                        <Card className="p-0 h-[500px] overflow-hidden relative border border-surface-border rounded-2xl shadow-lg">
                            <MapContainer
                                center={[17.3850, 78.4867]}
                                zoom={12}
                                style={{ height: '100%', width: '100%', zIndex: 1 }}
                            >
                                <LayersControl position="topright">
                                    <LayersControl.BaseLayer checked name="Road View">
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                    </LayersControl.BaseLayer>
                                    <LayersControl.BaseLayer name="Satellite View">
                                        <TileLayer
                                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                            attribution='&copy; Google'
                                            maxZoom={20}
                                            maxNativeZoom={20}
                                        />
                                    </LayersControl.BaseLayer>
                                </LayersControl>
                                {fromCoords && (
                                    <Marker position={fromCoords} icon={fromIcon}>
                                        <Popup>
                                            <div className="text-xs space-y-1 p-1 max-w-[200px]">
                                                <p className="font-semibold text-royal-600 border-b border-surface-border pb-1 mb-1">Start Location</p>
                                                {fromDetails ? (
                                                    <div className="space-y-0.5 text-[10px] text-text-secondary">
                                                        <p><strong>Door No:</strong> {extractAddressDetails(fromDetails).doorNo}</p>
                                                        <p><strong>Road:</strong> {extractAddressDetails(fromDetails).road}</p>
                                                        <p><strong>Area:</strong> {extractAddressDetails(fromDetails).area}</p>
                                                        <p><strong>City/Town:</strong> {extractAddressDetails(fromDetails).town}</p>
                                                        <p><strong>District:</strong> {extractAddressDetails(fromDetails).district}</p>
                                                        <p><strong>State:</strong> {extractAddressDetails(fromDetails).state}</p>
                                                        <p><strong>Postcode:</strong> {extractAddressDetails(fromDetails).postcode}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-text-muted mt-1">{fromText || 'Custom Pin'}</p>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                                {toCoords && (
                                    <Marker position={toCoords} icon={toIcon}>
                                        <Popup>
                                            <div className="text-xs space-y-1 p-1 max-w-[200px]">
                                                <p className="font-semibold text-gold-600 border-b border-surface-border pb-1 mb-1">Destination Property</p>
                                                {toDetails ? (
                                                    <div className="space-y-0.5 text-[10px] text-text-secondary">
                                                        <p><strong>Door No:</strong> {extractAddressDetails(toDetails).doorNo}</p>
                                                        <p><strong>Road:</strong> {extractAddressDetails(toDetails).road}</p>
                                                        <p><strong>Area:</strong> {extractAddressDetails(toDetails).area}</p>
                                                        <p><strong>City/Town:</strong> {extractAddressDetails(toDetails).town}</p>
                                                        <p><strong>District:</strong> {extractAddressDetails(toDetails).district}</p>
                                                        <p><strong>State:</strong> {extractAddressDetails(toDetails).state}</p>
                                                        <p><strong>Postcode:</strong> {extractAddressDetails(toDetails).postcode}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-text-muted mt-1">{toText || 'Custom Pin'}</p>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                                {fromCoords && toCoords && (
                                    <Polyline
                                        positions={[fromCoords, toCoords]}
                                        pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '5, 10' }}
                                    />
                                )}
                                <MapBoundsSetter fromCoords={fromCoords} toCoords={toCoords} />
                            </MapContainer>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RouteMapPage;
