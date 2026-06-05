import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
    ChevronLeft, ChevronRight, Upload, X, MapPin, Building2,
    IndianRupee, Bed, Bath, Maximize, Check, Image as ImageIcon
} from 'lucide-react';
import { propertyService } from '../../services/api';
import { useAuth } from '../../hooks';
import { PROPERTY_TYPES, LISTING_TYPES } from '../../constants';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';
import { filesToDataUrls } from '../../utils/imageHelpers';

import { STATES, getDistrictsForState } from '../../data/locations';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const defaultCenter = [17.3850, 78.4867];

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });
    return position ? <Marker position={position} /> : null;
};

const MapRefresher = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 15);
        }
    }, [center, map]);
    return null;
};

const listingSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    propertyType: z.string().min(1, 'Select property type'),
    listingType: z.string().min(1, 'Select listing type'),
    price: z.coerce.number().nullable().optional(),
    monthlyRent: z.coerce.number().nullable().optional(),
    securityDeposit: z.coerce.number().nullable().optional(),
    leaseDurationMonths: z.coerce.number().nullable().optional(),
    leaseAmount: z.coerce.number().nullable().optional(),
    leaseDurationYears: z.coerce.number().nullable().optional(),
    refundableDeposit: z.coerce.number().nullable().optional(),
    leaseConditions: z.string().nullable().optional(),
    bedrooms: z.coerce.number().min(1, 'Enter bedrooms'),
    bathrooms: z.coerce.number().min(1, 'Enter bathrooms'),
    area: z.coerce.number().min(1, 'Enter area'),
    address: z.string().min(5, 'Enter address'),
    city: z.string().min(2, 'Select district'),
    district: z.string().nullable().optional(),
    state: z.string().min(2, 'Enter state'),
    pincode: z.string().min(5, 'Enter pincode'),
    petFriendly: z.boolean().nullable().optional(),
    maintenanceIncluded: z.boolean().nullable().optional(),
    availableFrom: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
    if (data.listingType === 'SALE' && (!data.price || data.price <= 0)) {
        ctx.addIssue({ path: ['price'], code: z.ZodIssueCode.custom, message: 'Price is required for sale listings' });
    }
    if (data.listingType === 'RENT' && (!data.monthlyRent || data.monthlyRent <= 0)) {
        ctx.addIssue({ path: ['monthlyRent'], code: z.ZodIssueCode.custom, message: 'Monthly rent is required for rental listings' });
    }
    if (data.listingType === 'LEASE' && (!data.leaseAmount || data.leaseAmount <= 0)) {
        ctx.addIssue({ path: ['leaseAmount'], code: z.ZodIssueCode.custom, message: 'Lease amount is required for lease listings' });
    }
});

const STEPS = ['Basic Info', 'Details', 'Location', 'Images', 'Documents'];

const CreateListingPage = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditMode = Boolean(id);
    const [step, setStep] = useState(0);
    const [images, setImages] = useState([]);
    const [docs, setDocs] = useState([]);
    const [existingDocs, setExistingDocs] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const { register, handleSubmit, watch, setFocus, reset, formState: { errors } } = useForm({
        resolver: zodResolver(listingSchema),
        defaultValues: { listingType: 'SALE', petFriendly: false, maintenanceIncluded: false },
    });

    const { data: propertyData } = useQuery({
        queryKey: ['property-edit', id],
        queryFn: () => propertyService.getById(id).then((r) => r.data),
        enabled: isEditMode,
    });

    useEffect(() => {
        if (propertyData) {
            reset({
                ...propertyData,
                address: propertyData.location?.address || '',
                city: propertyData.location?.district || propertyData.location?.city || '',
                district: propertyData.location?.district || propertyData.location?.city || '',
                state: propertyData.location?.state || '',
                pincode: propertyData.location?.pincode || '',
            });
            if (propertyData.images) {
                setExistingImages(propertyData.images);
            }
            if (propertyData.verificationDocuments) {
                setExistingDocs(propertyData.verificationDocuments);
            }
            // Pre-populate map position from saved location
            if (propertyData.location?.lat && propertyData.location?.lng) {
                setMapCenter([propertyData.location.lat, propertyData.location.lng]);
            }
        }
    }, [propertyData, reset]);

    const listingType = watch('listingType');
    const isRent = listingType === 'RENT';
    const isLease = listingType === 'LEASE';

    const [mapCenter, setMapCenter] = useState(defaultCenter);

    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [mapSearchSuggestions, setMapSearchSuggestions] = useState([]);
    const [isSearchingMap, setIsSearchingMap] = useState(false);

    const handleMapSearch = async (e) => {
        e?.preventDefault();
        if (!mapSearchQuery.trim()) return;
        setIsSearchingMap(true);
        try {
            // Standard OSM Geocoding request
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=5`);
            const data = await res.json();
            
            if (data.length > 0) {
                setMapSearchSuggestions(data);
            } else {
                // Fallback 1: Try broader parts if query contains comma (e.g. "salem,thunbathulipatti" -> search "salem")
                const commaParts = mapSearchQuery.split(',').map(p => p.trim()).filter(Boolean);
                if (commaParts.length > 1) {
                    for (const partQuery of commaParts) {
                        const fbResPart = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(partQuery)}&limit=5`);
                        const fbDataPart = await fbResPart.json();
                        if (fbDataPart.length > 0) {
                            setMapSearchSuggestions(fbDataPart);
                            toast.success(`Showing results for broader area: "${partQuery}"`);
                            setIsSearchingMap(false);
                            return;
                        }
                    }
                }

                // Fallback 2: Fall back to fields filled in form (Pincode, City/District + State)
                const cityVal = watch('city');
                const stateVal = watch('state');
                const pincodeVal = watch('pincode');
                
                let fallbackQueries = [];
                if (pincodeVal) fallbackQueries.push(`${pincodeVal}, India`);
                if (cityVal && stateVal) fallbackQueries.push(`${cityVal}, ${stateVal}, India`);
                else if (cityVal) fallbackQueries.push(`${cityVal}, India`);
                else if (stateVal) fallbackQueries.push(`${stateVal}, India`);

                for (const fbQ of fallbackQueries) {
                    const fbRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fbQ)}&limit=3`);
                    const fbData = await fbRes.json();
                    if (fbData.length > 0) {
                        const lat = parseFloat(fbData[0].lat);
                        const lng = parseFloat(fbData[0].lon);
                        setMapCenter([lat, lng]);
                        toast.success(`Exact location not found. Centered map on: ${fbData[0].display_name}. Click map to pinpoint.`);
                        setIsSearchingMap(false);
                        return;
                    }
                }

                toast.error('Location not found. Please click the map to pin manually.');
            }
        } catch (err) {
            console.error("Search failed", err);
            toast.error('Search failed. Please try again.');
        } finally {
            setIsSearchingMap(false);
        }
    };

    const handleSelectMapSuggestion = (sug) => {
        const lat = parseFloat(sug.lat);
        const lng = parseFloat(sug.lon);
        setMapCenter([lat, lng]);
        setMapSearchSuggestions([]);
        setMapSearchQuery(sug.display_name);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'image/*' : ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 10,
        onDrop: (files) => setImages((prev) => [...prev, ...files].slice(0, 10)),
    });

    const { getRootProps: getDocRootProps, getInputProps: getDocInputProps, isDragActive: isDocDragActive } = useDropzone({
        accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 3,
        onDrop: (files) => setDocs((prev) => [...prev, ...files].slice(0, 3)),
    });

    const removeDoc = (index) => setDocs((prev) => prev.filter((_, i) => i !== index));

    const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

    const onSubmit = async (data) => {
        // In edit mode, allow saving even without new images (existing ones are kept)
        if (!isEditMode && images.length === 0 && existingImages.length === 0) {
            toast.error('Please upload at least one image of the property.');
            setIsSubmitting(false);
            return;
        }
        if (!isEditMode && docs.length === 0 && existingDocs.length === 0) {
            toast.error('Please upload at least one proof-of-ownership document (Sale Deed, Tax Receipt, Index II, etc.).');
            setIsSubmitting(false);
            return;
        }
        setIsSubmitting(true);
        try {
            const uploadedUrls = images.length > 0 ? await filesToDataUrls(images) : [];
            const allImages = [...existingImages, ...uploadedUrls];

            const uploadedDocUrls = docs.length > 0 ? await filesToDataUrls(docs) : [];
            const allDocs = [...existingDocs, ...uploadedDocUrls];

            const payload = {
                ...data,
                images: allImages,
                verificationDocuments: allDocs,
                location: {
                    address: data.address,
                    city: data.city,
                    district: data.city,
                    state: data.state,
                    pincode: data.pincode,
                    lat: mapCenter[0],
                    lng: mapCenter[1],
                },
            };

            if (isEditMode) {
                await propertyService.update(id, payload);
                queryClient.invalidateQueries({ queryKey: ['my-listings'] });
                queryClient.invalidateQueries({ queryKey: ['property-edit', id] });
                toast.success('Property updated successfully!');
            } else {
                await propertyService.create(payload);
                queryClient.invalidateQueries({ queryKey: ['my-listings'] });
                toast.success('Property listed successfully! Pending manager review.');
            }
            if (user?.activeRole === 'ADMIN') {
                navigate('/admin/properties');
            } else if (user?.activeRole === 'MANAGER') {
                navigate('/manager/listings');
            } else {
                navigate('/seller/listings');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save listing');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (step < STEPS.length - 1) {
            nextStep();
        } else {
            handleSubmit(onSubmit, onError)(e);
        }
    };

    const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    const onError = (errors) => {
        const step0 = ['title', 'description', 'propertyType', 'listingType'];
        const step1 = ['price', 'monthlyRent', 'leaseAmount', 'bedrooms', 'bathrooms', 'area'];
        const step2 = ['address', 'city', 'state', 'pincode'];

        const errorKeys = Object.keys(errors);
        
        if (errorKeys.length > 0) {
            console.log('Validation errors:', errors);
            const firstMsg = errors[errorKeys[0]]?.message || 'Invalid value';
            toast.error(`Validation Error: ${firstMsg}`);
        }

        let targetStep = step;
        if (errorKeys.some(k => step0.includes(k))) targetStep = 0;
        else if (errorKeys.some(k => step1.includes(k))) targetStep = 1;
        else if (errorKeys.some(k => step2.includes(k))) targetStep = 2;

        if (targetStep !== step) setStep(targetStep);

        setTimeout(() => {
            const firstErrorKey = errorKeys[0];
            if (firstErrorKey) setFocus(firstErrorKey);
        }, 100);
    };

    return (
        <>
            <SEOHead title={isEditMode ? "Edit Listing" : "Create Listing"} noindex />
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-display font-bold text-text-primary mb-2">{isEditMode ? "Edit Listing" : "Create New Listing"}</h1>
                <p className="text-text-secondary mb-8">{isEditMode ? "Update your property details" : "List your property for free — zero charges"}</p>

                {isEditMode && propertyData?.status === 'REJECTED' && propertyData?.rejectionReason && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                        <h4 className="font-semibold mb-1">Listing Rejected by Manager</h4>
                        <p className="text-xs text-text-secondary">
                            <strong>Reason:</strong> {propertyData.rejectionReason}
                        </p>
                        <p className="text-xs text-text-muted mt-2">
                            Please make necessary edits and save your changes. Saving will automatically re-submit this property to the manager pool for review.
                        </p>
                    </div>
                )}

                {/* Stepper */}
                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center flex-1">
                            <button
                                onClick={() => i < step && setStep(i)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-royal-600 text-white' : 'bg-surface-hover text-text-muted'
                                    }`}
                            >
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </button>
                            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${i < step ? 'bg-emerald-500' : 'bg-surface-border'}`} />}
                        </div>
                    ))}
                </div>
                <p className="text-sm text-text-secondary mb-6">{STEPS[step]}</p>

                <Card>
                    <form id="listing-form" onSubmit={handleFormSubmit}>
                        <AnimatePresence mode="wait">
                            {/* Step 0: Basic Info */}
                            {step === 0 && (
                                <motion.div key="basic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    <Input label="Property Title *" placeholder="e.g. Luxury 3BHK in Banjara Hills" error={errors.title?.message} {...register('title')} />
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-text-secondary">Description *</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Describe your property..."
                                            className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50 resize-none"
                                            {...register('description')}
                                        />
                                        {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select label="Property Type *" options={PROPERTY_TYPES} error={errors.propertyType?.message} {...register('propertyType')} />
                                        <Select label="Listing Type *" options={LISTING_TYPES} error={errors.listingType?.message} {...register('listingType')} />
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 1: Details (Rent vs Lease) */}
                            {step === 1 && (
                                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    {!isRent && !isLease && (
                                        <Input label="Price (₹) *" type="number" placeholder="e.g. 5000000" icon={IndianRupee} error={errors.price?.message} {...register('price')} />
                                    )}
                                    {isRent && (
                                        <>
                                            <Input label="Monthly Rent (₹) *" type="number" icon={IndianRupee} error={errors.monthlyRent?.message} {...register('monthlyRent')} />
                                            <Input label="Security Deposit (₹)" type="number" icon={IndianRupee} {...register('securityDeposit')} />
                                            <Input label="Lease Duration (months)" type="number" {...register('leaseDurationMonths')} />
                                            <Input label="Available From" type="date" {...register('availableFrom')} />
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 rounded" {...register('maintenanceIncluded')} />
                                                <span className="text-sm text-text-secondary">Maintenance Included</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 rounded" {...register('petFriendly')} />
                                                <span className="text-sm text-text-secondary">Pet Friendly</span>
                                            </label>
                                        </>
                                    )}
                                    {isLease && (
                                        <>
                                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-2">
                                                <p className="text-xs text-blue-400">Lease is a long-term agreement where the tenant pays a lump sum upfront for the entire lease period, not monthly rent.</p>
                                            </div>
                                            <Input label="Lease Amount (₹) *" type="number" icon={IndianRupee} error={errors.leaseAmount?.message} {...register('leaseAmount')} />
                                            <Input label="Lease Duration (years)" type="number" {...register('leaseDurationYears')} />
                                            <Input label="Refundable Deposit (₹)" type="number" icon={IndianRupee} {...register('refundableDeposit')} />
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-medium text-text-secondary">Lease Conditions</label>
                                                <textarea rows={3} className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50 resize-none" placeholder="Any special conditions..." {...register('leaseConditions')} />
                                            </div>
                                        </>
                                    )}
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input label="Bedrooms *" type="number" icon={Bed} error={errors.bedrooms?.message} {...register('bedrooms')} />
                                        <Input label="Bathrooms *" type="number" icon={Bath} error={errors.bathrooms?.message} {...register('bathrooms')} />
                                        <Input label="Area (sqft) *" type="number" icon={Maximize} error={errors.area?.message} {...register('area')} />
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Location */}
                            {step === 2 && (
                                <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                    <Input label="Address *" placeholder="Street address" icon={MapPin} error={errors.address?.message} {...register('address')} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select label="State *" options={STATES} error={errors.state?.message} {...register('state')} />
                                        <Select
                                            label="District *"
                                            options={[
                                                { value: '', label: watch('state') ? 'Select district' : 'Select state first' },
                                                ...getDistrictsForState(watch('state')).map((d) => ({ value: d, label: d })),
                                            ]}
                                            error={errors.city?.message}
                                            disabled={!watch('state')}
                                            {...register('city')}
                                        />
                                    </div>
                                    <Input label="Pincode *" placeholder="e.g. 500034" error={errors.pincode?.message} {...register('pincode')} />
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Pin on Map (Optional)</label>
                                        <div className="border border-surface-border rounded-xl overflow-hidden shadow-sm h-[350px] relative">
                                            {/* Map Search Overlay */}
                                            <div className="absolute top-3 left-12 z-[1000] w-72 max-w-[calc(100%-60px)]">
                                                <div className="flex gap-1.5 bg-surface-card/90 backdrop-blur-md border border-surface-border p-1.5 rounded-xl shadow-lg animate-fadeIn">
                                                    <input
                                                        type="text"
                                                        value={mapSearchQuery}
                                                        onChange={(e) => setMapSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleMapSearch();
                                                            }
                                                        }}
                                                        placeholder="Search location to pin..."
                                                        className="flex-1 min-w-0 bg-surface-hover/80 border border-surface-border/50 text-[11px] px-3 py-1.5 rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-royal-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleMapSearch();
                                                        }}
                                                        disabled={isSearchingMap}
                                                        className="bg-royal-600 hover:bg-royal-500 disabled:bg-surface-hover text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors duration-150"
                                                    >
                                                        {isSearchingMap ? '...' : 'Search'}
                                                    </button>
                                                </div>
                                                {mapSearchSuggestions.length > 0 && (
                                                    <ul className="absolute z-[1001] w-full bg-surface-card/95 backdrop-blur-md border border-surface-border rounded-xl shadow-2xl max-h-40 overflow-y-auto divide-y divide-surface-border mt-1">
                                                        {mapSearchSuggestions.map((sug, i) => (
                                                            <li
                                                                key={i}
                                                                onClick={() => handleSelectMapSuggestion(sug)}
                                                                className="px-3 py-2 text-[10px] text-text-secondary hover:text-text-primary hover:bg-surface-hover cursor-pointer truncate"
                                                                title={sug.display_name}
                                                            >
                                                                {sug.display_name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>

                                            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
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
                                                <LocationMarker position={mapCenter} setPosition={setMapCenter} />
                                                <MapRefresher center={mapCenter} />
                                            </MapContainer>
                                        </div>
                                        <p className="text-xs text-text-muted mt-2">Click on the map to pinpoint the exact location.</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Images */}
                            {step === 3 && (
                                <motion.div key="images" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-royal-500 bg-royal-500/5' : 'border-surface-border hover:border-royal-500/50'}`}
                                    >
                                        <input {...getInputProps()} />
                                        <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                                        <p className="text-sm text-text-secondary">Drag & drop images here or click to browse</p>
                                        <p className="text-xs text-text-muted mt-1">Max 10 images · JPG, PNG, WebP</p>
                                    </div>

                                    {/* Existing Images */}
                                    {existingImages.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Existing Images</p>
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                                {existingImages.map((img, i) => (
                                                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-surface-border bg-surface-card">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))}
                                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New Images */}
                                    {images.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">New Images to Upload</p>
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                                {images.map((img, i) => (
                                                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-surface-border bg-surface-card">
                                                        <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(i)}
                                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="p-4 rounded-xl bg-royal-500/10 border border-royal-500/20 mb-4">
                                        <h3 className="text-sm font-semibold text-royal-400 mb-1">Legal Trust & Ownership Verification</h3>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            To list your property on Squarefeet X, please upload a proof-of-ownership document (e.g. Sale Deed, Property Tax Receipt, Index II, or Utility Bill in your name). 
                                            This document will be securely reviewed by our state-level verification managers to guarantee listing authenticity.
                                        </p>
                                    </div>
                                    
                                    <div
                                        {...getDocRootProps()}
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDocDragActive ? 'border-royal-500 bg-royal-500/5' : 'border-surface-border hover:border-royal-500/50'}`}
                                    >
                                        <input {...getDocInputProps()} />
                                        <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                                        <p className="text-sm text-text-secondary">Drag & drop verification files here or click to browse</p>
                                        <p className="text-xs text-text-muted mt-1">PDF or Images (Max 3 files)</p>
                                    </div>

                                    {/* Existing Documents */}
                                    {existingDocs.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Uploaded Documents</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {existingDocs.map((doc, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface-card text-xs">
                                                        <span className="text-text-primary font-medium truncate max-w-[200px]">Document #{i + 1}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setExistingDocs((prev) => prev.filter((_, idx) => idx !== i))}
                                                            className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New Documents */}
                                    {docs.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">New Documents to Upload</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {docs.map((doc, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface-card text-xs">
                                                        <span className="text-text-primary font-medium truncate max-w-[200px]">{doc.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDoc(i)}
                                                            className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-surface-border">
                        <Button key="btn-back" type="button" variant="secondary" onClick={prevStep} disabled={step === 0} icon={ChevronLeft}>Back</Button>
                         {step < STEPS.length - 1 ? (
                            <Button key="btn-next" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextStep(); }} iconRight={ChevronRight}>Next</Button>
                        ) : (
                            <Button key="btn-submit" type="submit" form="listing-form" variant="gold" isLoading={isSubmitting}>
                                {isEditMode ? 'Save Changes' : 'Submit for Approval'}
                            </Button>
                        )}
                    </div>
                </Card>

            </div>
        </>
    );
};

export default CreateListingPage;
