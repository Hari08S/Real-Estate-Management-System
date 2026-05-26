import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import {
    MapPin, Bed, Bath, Maximize, Calendar, Building2, Unlock,
    Phone, Mail, User, Heart, Share2, ChevronLeft, Tag, CheckCircle2,
    IndianRupee, X, HandshakeIcon, MessageSquare, GitCompare, Star
} from 'lucide-react';
import { propertyService, chatService, managerService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils';
import { PROPERTY_STATUS_LABELS } from '../../constants';
import { useAuth } from '../../hooks';
import { useSavedStore } from '../../store/savedStore';
import { useCompareStore } from '../../store/compareStore';
import { useRecentlyViewedStore } from '../../store/recentlyViewedStore';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import PropertyStatusTracker from '../../components/common/PropertyStatusTracker';
import SEOHead from '../../components/common/SEOHead';
import { PricePerSqftBadge, SimilarPropertiesSection } from '../../components/property/SimilarProperties';
import { PriceTrendChart } from '../../components/property/PriceTrendChart';
import { CommuteCalculator } from '../../components/property/CommuteCalculator';
import { MakeOfferModal } from '../../components/property/MakeOfferModal';
import { RecentlySoldSection } from '../../components/property/RecentlySold';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const TOUR_ROOMS = {
    livingRoom: {
        label: 'Living Room',
        image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
        details: 'Expansive family living space designed for luxury entertainment and natural ventilation.',
        hotspots: [
            { top: '45%', left: '30%', title: 'Italian Marble Flooring', desc: 'Premium quality Bianco Lasa marble floor with sleek under-floor heating.' },
            { top: '35%', left: '70%', title: 'Expansive Glass Windows', desc: 'Double-glazed soundproof sliding windows offering panoramic skyline views.' }
        ]
    },
    masterBedroom: {
        label: 'Master Bedroom',
        image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200',
        details: 'Opulent master suite with dynamic smart lighting and modular walk-in wardrobe.',
        hotspots: [
            { top: '50%', left: '50%', title: 'Teak Wood King Bedframe', desc: 'Handcrafted teak wood bedframe with integrated ambient LED strip lighting.' },
            { top: '30%', left: '75%', title: 'Smart Ambience Controller', desc: 'Control room temperature, smart curtains, and hue lighting from one panel.' }
        ]
    },
    kitchen: {
        label: 'Gourmet Kitchen',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200',
        details: 'Ultra-modern culinary workspace with high-end modular fixtures and quartz counters.',
        hotspots: [
            { top: '40%', left: '45%', title: 'Modular Quartz Island', desc: 'Stain-resistant solid quartz countertop with integrated modular induction cooktop.' }
        ]
    }
};

const MortgageCalculator = ({ propertyPrice }) => {
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [interestRate, setInterestRate] = useState(8.5);
    const [tenureYears, setTenureYears] = useState(20);

    const price = propertyPrice || 5000000;
    const downPayment = Math.round((price * downPaymentPercent) / 100);
    const loanAmount = price - downPayment;
    
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    let emi = 0;
    if (monthlyRate > 0) {
        emi = Math.round(
            (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        );
    } else {
        emi = Math.round(loanAmount / totalMonths);
    }

    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - loanAmount;
    const principalRatio = (loanAmount / (totalPayment || 1)) * 100;
    const interestRatio = 100 - principalRatio;

    return (
        <Card>
            <h3 className="text-base font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-gold-500" />
                Mortgage / EMI Calculator
            </h3>
            <div className="space-y-4 text-xs">
                <div>
                    <div className="flex justify-between mb-1.5">
                        <span className="text-text-secondary">Down Payment: {downPaymentPercent}%</span>
                        <span className="text-text-primary font-semibold">{formatCurrency(downPayment)}</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="80"
                        step="5"
                        value={downPaymentPercent}
                        onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                        className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-royal-500"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-1.5">
                        <span className="text-text-secondary">Interest Rate: {interestRate}% P.A.</span>
                        <span className="text-text-primary font-semibold">Interest</span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="15"
                        step="0.1"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-royal-500"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-1.5">
                        <span className="text-text-secondary">Tenure: {tenureYears} Years</span>
                        <span className="text-text-primary font-semibold">Tenure</span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="30"
                        step="1"
                        value={tenureYears}
                        onChange={(e) => setTenureYears(Number(e.target.value))}
                        className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-royal-500"
                    />
                </div>

                <div className="pt-4 border-t border-surface-border space-y-3">
                    <div className="flex justify-between items-center bg-royal-500/5 p-3 rounded-xl border border-royal-500/10">
                        <span className="text-text-secondary font-medium">Monthly EMI</span>
                        <span className="text-lg font-display font-bold text-gradient">{formatCurrency(emi)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2.5 rounded-xl bg-surface-hover/50 border border-surface-border">
                            <span className="text-text-muted block mb-0.5">Principal Loan</span>
                            <span className="text-text-primary font-semibold">{formatCurrency(loanAmount)}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-surface-hover/50 border border-surface-border">
                            <span className="text-text-muted block mb-0.5">Total Interest</span>
                            <span className="text-text-primary font-semibold">{formatCurrency(totalInterest)}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-text-muted">
                            <span>Principal ({Math.round(principalRatio)}%)</span>
                            <span>Interest ({Math.round(interestRatio)}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden flex bg-surface-border">
                            <div className="bg-royal-500 h-full transition-all duration-300" style={{ width: `${principalRatio}%` }} />
                            <div className="bg-gold-500 h-full transition-all duration-300" style={{ width: `${interestRatio}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};


const PropertyDetailPage = () => {
    const { id } = useParams();
    const { isAuthenticated, user } = useAuth();
    const [inquiryStatus, setInquiryStatus] = useState('IDLE');
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const toggleSave = useSavedStore((s) => s.toggleSave);
    const isSaved = useSavedStore((s) => s.isSaved(id));
    const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
    const addItem = useCompareStore((s) => s.addItem);
    const removeItem = useCompareStore((s) => s.removeItem);
    const isInCompare = useCompareStore((s) => s.isInCompare(id));

    // New feature states
    const [showOfferModal, setShowOfferModal] = useState(false);

    // Inquiry & Visit States
    const [sidebarTab, setSidebarTab] = useState('inquiry');
    const [inquiryName, setInquiryName] = useState('');
    const [inquiryPhone, setInquiryPhone] = useState('');
    const [inquiryMsg, setInquiryMsg] = useState('I am interested in this property. Please contact me.');

    const [visitName, setVisitName] = useState('');
    const [visitPhone, setVisitPhone] = useState('');
    const [visitDate, setVisitDate] = useState('');
    const [visitType, setVisitType] = useState('IN_PERSON');
    const [visitTimeSlot, setVisitTimeSlot] = useState('Morning (9 AM - 12 PM)');

    // Review States
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            toast.error('Please enter a comment.');
            return;
        }
        setIsSubmittingReview(true);
        try {
            await propertyService.addReview(id, { rating, comment, buyerName: user?.name || 'Verified Buyer' });
            toast.success('Review submitted successfully!');
            setComment('');
            setRating(5);
            refetch();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // 3D Tour States
    const [showTour, setShowTour] = useState(false);
    const [activeRoom, setActiveRoom] = useState('livingRoom');
    const [selectedHotspot, setSelectedHotspot] = useState(null);

    const { data: property, isLoading, refetch } = useQuery({
        queryKey: ['property', id],
        queryFn: () => propertyService.getById(id).then((r) => r.data),
    });

    // Fetch all properties for similar + price/sqft comparison
    const { data: allPropsData } = useQuery({
        queryKey: ['properties-for-similar'],
        queryFn: () => propertyService.getAll({ limit: 50 }).then((r) => r.data),
        staleTime: 5 * 60 * 1000,
    });
    const allProperties = allPropsData?.properties || [];

    // Track recently viewed
    useEffect(() => {
        if (property) addRecentlyViewed(property);
    }, [property?.id]);

    const handleInquiry = async (e) => {
        e?.preventDefault();
        if (!isAuthenticated) {
            window.location.href = `/login?returnUrl=/properties/${id}`;
            return;
        }

        try {
            setInquiryStatus('VERIFYING');
            let otherUserId = property.sellerId;
            let targetLabel = 'seller';

            try {
                const state = property.location?.state || '';
                if (state) {
                    const managerRes = await managerService.getManagerByCity(state);
                    if (managerRes.data?.manager?.id) {
                        otherUserId = managerRes.data.manager.id;
                        targetLabel = 'state manager';
                    }
                }
            } catch (err) {
                console.error("Failed to fetch state manager, falling back to seller", err);
            }

            const formattedMessage = `✉️ *NEW PROPERTY INQUIRY*\n\n*Name:* ${inquiryName}\n*Phone:* ${inquiryPhone}\n*Message:* ${inquiryMsg}\n*Property:* ${property.title}`;

            try {
                await propertyService.incrementUnlockCount(id);
            } catch (err) {
                console.error("Failed to increment unlock count", err);
            }

            await chatService.startConversation({
                propertyId: id,
                propertyTitle: property.title,
                otherUserId,
                message: formattedMessage
            });

            setInquiryStatus('SUCCESS');
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            toast.success(`Your inquiry has been sent! The ${targetLabel} will contact you.`);
            refetch();
        } catch (error) {
            setInquiryStatus('ERROR');
            toast.error('Failed to send contact inquiry');
        }
    };

    const handleScheduleVisit = async (e) => {
        e?.preventDefault();
        if (!isAuthenticated) {
            window.location.href = `/login?returnUrl=/properties/${id}`;
            return;
        }

        try {
            setInquiryStatus('VERIFYING');
            let otherUserId = property.sellerId;
            let targetLabel = 'seller';

            try {
                const state = property.location?.state || '';
                if (state) {
                    const managerRes = await managerService.getManagerByCity(state);
                    if (managerRes.data?.manager?.id) {
                        otherUserId = managerRes.data.manager.id;
                        targetLabel = 'state manager';
                    }
                }
            } catch (err) {
                console.error("Failed to fetch state manager, falling back to seller", err);
            }

            const formattedMessage = `📅 *SITE VISIT REQUESTED*\n\n*Name:* ${visitName}\n*Phone:* ${visitPhone}\n*Date:* ${visitDate}\n*Time:* ${visitTimeSlot}\n*Type:* ${visitType === 'IN_PERSON' ? 'In-Person Visit' : 'Virtual (Video Call)'}\n*Property:* ${property.title}`;

            try {
                await propertyService.incrementUnlockCount(id);
            } catch (err) {
                console.error("Failed to increment unlock count", err);
            }

            await chatService.startConversation({
                propertyId: id,
                propertyTitle: property.title,
                otherUserId,
                message: formattedMessage
            });

            setInquiryStatus('SUCCESS');
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            toast.success(`Site visit booked successfully! The ${targetLabel} will confirm shortly.`);
            refetch();
        } catch (error) {
            setInquiryStatus('ERROR');
            toast.error('Failed to book site visit');
        }
    };

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="pt-24 flex justify-center"><Spinner size="lg" /></div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="w-full">
                <div className="pt-24 text-center text-text-secondary">Property not found</div>
            </div>
        );
    }

    const images = property.images?.length > 0 ? property.images : [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ];

    const tourRooms = {
        livingRoom: {
            label: 'Living Room',
            image: images[0] || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
            details: 'Expansive family living space designed for luxury entertainment and natural ventilation.',
            hotspots: [
                { top: '45%', left: '30%', title: 'Italian Marble Flooring', desc: 'Premium quality Bianco Lasa marble floor with sleek under-floor heating.' },
                { top: '35%', left: '70%', title: 'Expansive Glass Windows', desc: 'Double-glazed soundproof sliding windows offering panoramic skyline views.' }
            ]
        },
        masterBedroom: {
            label: 'Master Bedroom',
            image: images[1] || images[0] || 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200',
            details: 'Opulent master suite with dynamic smart lighting and modular walk-in wardrobe.',
            hotspots: [
                { top: '50%', left: '50%', title: 'Teak Wood King Bedframe', desc: 'Handcrafted teak wood bedframe with integrated ambient LED strip lighting.' },
                { top: '30%', left: '75%', title: 'Smart Ambience Controller', desc: 'Control room temperature, smart curtains, and hue lighting from one panel.' }
            ]
        },
        kitchen: {
            label: 'Gourmet Kitchen',
            image: images[2] || images[0] || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200',
            details: 'Ultra-modern culinary workspace with high-end modular fixtures and quartz counters.',
            hotspots: [
                { top: '40%', left: '45%', title: 'Modular Quartz Island', desc: 'Stain-resistant solid quartz countertop with integrated modular induction cooktop.' }
            ]
        }
    };

    return (
        <>
            <SEOHead
                title={property.title}
                description={`${property.title} - ${property.propertyType} in ${property.location?.city}. ${formatCurrency(property.price || property.monthlyRent || property.leaseAmount)}`}
            />
            <div className="w-full">
                <div className="pt-8 pb-16">
                    <div className="page-container">
                        {/* Back Button */}
                        <div className="mb-6 flex justify-start">
                            <button
                                onClick={() => window.history.back()}
                                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-semibold text-text-primary transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <ChevronLeft className="w-4 h-4 text-text-secondary group-hover:text-royal-400 transition-colors" />
                                Back to Properties
                            </button>
                        </div>

                        {/* Image Gallery */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 relative">
                            {images.length > 0 ? (
                                <>
                                    <Swiper
                                        modules={[Navigation, Pagination, Thumbs]}
                                        navigation
                                        pagination={{ clickable: true }}
                                        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                                        className="rounded-2xl overflow-hidden aspect-[16/9] max-h-[550px]"
                                    >
                                        {images.map((img, i) => (
                                            <SwiperSlide key={i}>
                                                <img src={img} alt={`${property.title} - ${i + 1}`} className="w-full h-full object-cover" />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                    {images.length > 1 && (
                                        <Swiper
                                            modules={[Thumbs]}
                                            onSwiper={setThumbsSwiper}
                                            slidesPerView={5}
                                            spaceBetween={8}
                                            className="mt-3"
                                            watchSlidesProgress
                                        >
                                            {images.map((img, i) => (
                                                <SwiperSlide key={i} className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity [&.swiper-slide-thumb-active]:opacity-100">
                                                    <img src={img} alt="" className="w-full h-16 object-cover rounded-xl border-2 border-transparent" />
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-[300px] bg-surface-card rounded-2xl flex items-center justify-center text-text-muted">
                                    No images available
                                </div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="royal">{property.listingType}</Badge>
                                                <Badge variant="success" dot>{PROPERTY_STATUS_LABELS[property.status]}</Badge>
                                            </div>
                                            <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary">{property.title}</h1>
                                            {property.location && (
                                                <p className="flex items-center gap-1.5 text-text-secondary mt-2">
                                                    <MapPin className="w-4 h-4 text-royal-400" />
                                                    {property.location.address}, {property.location.city}, {property.location.state}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-display font-bold text-gradient">
                                                {formatCurrency(property.price || property.monthlyRent || property.leaseAmount)}
                                            </p>
                                            {property.listingType === 'RENT' && <span className="text-sm text-text-muted">/month</span>}
                                            <PricePerSqftBadge
                                                price={property.price || property.monthlyRent}
                                                area={property.area}
                                                city={property.location?.city}
                                                properties={allProperties}
                                            />
                                        </div>
                                    </div>

                                    {/* Specs */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-surface-border">
                                        {property.bedrooms && (
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Bed className="w-5 h-5 text-royal-400" />
                                                <div><p className="text-sm font-medium">{property.bedrooms} Bedrooms</p></div>
                                            </div>
                                        )}
                                        {property.bathrooms && (
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Bath className="w-5 h-5 text-royal-400" />
                                                <div><p className="text-sm font-medium">{property.bathrooms} Bathrooms</p></div>
                                            </div>
                                        )}
                                        {property.area && (
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Maximize className="w-5 h-5 text-royal-400" />
                                                <div><p className="text-sm font-medium">{property.area} sqft</p></div>
                                            </div>
                                        )}
                                        {property.propertyType && (
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Building2 className="w-5 h-5 text-royal-400" />
                                                <div><p className="text-sm font-medium capitalize">{property.propertyType}</p></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="mt-6">
                                        <h3 className="text-lg font-display font-semibold text-text-primary mb-3">Description</h3>
                                        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
                                            {property.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    {/* 3D Virtual Tour Section */}
                                    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-royal-950 via-navy-900 to-indigo-950 border border-royal-500/20 relative overflow-hidden shadow-lg group">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(101,116,242,0.1),transparent_70%)] animate-pulse" />
                                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="space-y-2 text-center md:text-left">
                                                <Badge variant="gold">3D Virtual Walkthrough</Badge>
                                                <h3 className="text-lg font-display font-bold text-white mt-1">Experience a Virtual Tour</h3>
                                                <p className="text-text-secondary text-xs max-w-md">Take an interactive 3D digital walk through different rooms and examine premium architectural details in real-time.</p>
                                            </div>
                                            <Button
                                                onClick={() => setShowTour(true)}
                                                variant="gold"
                                                size="md"
                                                className="shadow-md hover:scale-105 transition-transform"
                                                icon={Building2}
                                            >
                                                Launch 3D Tour
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Map Data */}
                                    <div className="mt-8">
                                        <h3 className="text-lg font-display font-semibold text-text-primary mb-3">Location on Map</h3>
                                        <div className="border border-surface-border rounded-xl overflow-hidden shadow-sm h-[300px] z-0 relative">
                                            <MapContainer center={[property.location?.lat || 17.3850, property.location?.lng || 78.4867]} zoom={13} style={{ height: '100%', width: '100%' }}>
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
                                                <Marker position={[property.location?.lat || 17.3850, property.location?.lng || 78.4867]}>
                                                    <Popup>{property.title}</Popup>
                                                </Marker>
                                            </MapContainer>
                                        </div>
                                    </div>

                                    {/* Commute Calculator */}
                                    <CommuteCalculator
                                        propertyLat={property.location?.lat}
                                        propertyLng={property.location?.lng}
                                    />

                                    {/* Price Trend */}
                                    <PriceTrendChart
                                        price={property.price || property.monthlyRent}
                                        area={property.area}
                                        city={property.location?.city}
                                    />
                                </Card>

                                {/* Status Tracker */}
                                <Card>
                                    <h3 className="text-lg font-display font-semibold text-text-primary mb-5">Listing Status</h3>
                                    <PropertyStatusTracker currentStatus={property.status} timestamps={property.statusTimestamps} rejectionReason={property.rejectionReason} />
                                </Card>

                                {/* Reviews & Ratings */}
                                <Card>
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-border">
                                        <div>
                                            <h3 className="text-lg font-display font-semibold text-text-primary">Buyer Reviews & Ratings</h3>
                                            <p className="text-xs text-text-secondary mt-0.5">Authentic feedback from verified property visitors</p>
                                        </div>
                                        <Badge variant="royal" icon={Star}>Social Proof</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        {/* Score breakdown */}
                                        <div className="flex flex-col items-center justify-center bg-surface-hover/30 rounded-2xl p-6 border border-surface-border text-center">
                                            <p className="text-5xl font-display font-bold text-text-primary">
                                                {property.reviews && property.reviews.length > 0
                                                    ? (property.reviews.reduce((acc, r) => acc + r.rating, 0) / property.reviews.length).toFixed(1)
                                                    : '0.0'}
                                            </p>
                                            <div className="flex gap-1 my-2">
                                                {[1, 2, 3, 4, 5].map((s) => {
                                                    const avg = property.reviews && property.reviews.length > 0
                                                        ? property.reviews.reduce((acc, r) => acc + r.rating, 0) / property.reviews.length
                                                        : 0;
                                                    return (
                                                        <Star
                                                            key={s}
                                                            className={`w-4 h-4 ${s <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-text-muted'}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <p className="text-xs text-text-secondary font-medium">
                                                Based on {property.reviews ? property.reviews.length : 0} reviews
                                            </p>
                                        </div>

                                        {/* Bars breakdown */}
                                        <div className="md:col-span-2 flex flex-col justify-center space-y-2">
                                            {[5, 4, 3, 2, 1].map((s) => {
                                                const total = property.reviews ? property.reviews.length : 0;
                                                const count = property.reviews ? property.reviews.filter((r) => r.rating === s).length : 0;
                                                const percent = total > 0 ? (count / total) * 100 : 0;
                                                return (
                                                    <div key={s} className="flex items-center gap-3 text-xs">
                                                        <span className="w-3 text-text-secondary text-right font-medium">{s}</span>
                                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                                        <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden border border-surface-border">
                                                            <div className="h-full bg-royal-500 rounded-full" style={{ width: `${percent}%` }} />
                                                        </div>
                                                        <span className="w-8 text-text-muted text-right font-medium">{percent.toFixed(0)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Review form */}
                                    {isAuthenticated ? (
                                        <form onSubmit={handleReviewSubmit} className="space-y-4 bg-surface-hover/20 p-5 rounded-2xl border border-surface-border mb-8">
                                            <h4 className="text-sm font-semibold text-text-primary">Leave a Review</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-text-secondary">Your Rating:</span>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => setRating(s)}
                                                            className="focus:outline-none"
                                                        >
                                                            <Star
                                                                className={`w-5 h-5 transition-transform hover:scale-110 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-text-muted'}`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-text-secondary">Your Comment</label>
                                                <textarea
                                                    required
                                                    rows={3}
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    placeholder="Share your experience (visit, neighborhood, seller interaction...)"
                                                    className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50 resize-none"
                                                />
                                            </div>
                                            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingReview}>
                                                Submit Review
                                            </Button>
                                        </form>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-surface-hover border border-surface-border text-center text-xs text-text-secondary mb-8">
                                            Please <Link to="/login" className="text-royal-400 font-semibold hover:underline">login</Link> to leave a review for this property.
                                        </div>
                                    )}

                                    {/* Reviews list */}
                                    <div className="space-y-4">
                                        {property.reviews && property.reviews.length > 0 ? (
                                            property.reviews.map((r) => (
                                                <div key={r.id || r._id} className="p-4 rounded-2xl border border-surface-border bg-surface-card space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-royal-500/10 border border-royal-500/20 flex items-center justify-center text-xs font-bold text-royal-400">
                                                                {r.buyerName ? r.buyerName.substring(0, 2).toUpperCase() : 'VB'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs font-bold text-text-primary">{r.buyerName || 'Verified Buyer'}</span>
                                                                    <Badge variant="success" size="sm">Verified Buyer</Badge>
                                                                </div>
                                                                <p className="text-[10px] text-text-muted mt-0.5">{formatDate(r.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    className={`w-3 h-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-text-muted'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-text-secondary leading-relaxed pl-10">{r.comment}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 bg-surface-hover/10 rounded-2xl border border-dashed border-surface-border">
                                                <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-2" />
                                                <p className="text-xs font-semibold text-text-primary">No reviews yet</p>
                                                <p className="text-[11px] text-text-muted mt-1">Be the first to review this property listing!</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Unlock / Contact Card */}
                                <Card glow={inquiryStatus === 'SUCCESS'}>
                                    {inquiryStatus === 'SUCCESS' || property.isUnlocked ? (
                                        <div className="text-center py-6">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">Request Processed!</h3>
                                            <p className="text-sm text-text-secondary">
                                                The details have been sent. They will contact you shortly. You can also message them directly via the chat.
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex rounded-xl bg-surface-hover p-1 mb-5 border border-surface-border">
                                                <button
                                                    type="button"
                                                    onClick={() => setSidebarTab('inquiry')}
                                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                                        sidebarTab === 'inquiry'
                                                            ? 'bg-royal-600 text-white shadow-sm'
                                                            : 'text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    Direct Inquiry
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSidebarTab('visit')}
                                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                                        sidebarTab === 'visit'
                                                            ? 'bg-royal-600 text-white shadow-sm'
                                                            : 'text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    Schedule Visit
                                                </button>
                                            </div>

                                            {sidebarTab === 'inquiry' ? (
                                                <form onSubmit={handleInquiry} className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[11px] font-medium text-text-secondary">Your Name</label>
                                                        <input type="text" required value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} placeholder="John Doe" className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500/50" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[11px] font-medium text-text-secondary">Phone Number</label>
                                                        <input type="tel" required value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} placeholder="+91 9876543210" className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500/50" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[11px] font-medium text-text-secondary">Message</label>
                                                        <textarea required rows={3} value={inquiryMsg} onChange={(e) => setInquiryMsg(e.target.value)} className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500/50 resize-none" />
                                                    </div>

                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                        size="md"
                                                        className="w-full mt-2"
                                                        icon={User}
                                                        isLoading={inquiryStatus === 'VERIFYING'}
                                                    >
                                                        {inquiryStatus === 'VERIFYING' ? 'Sending...' : 'Send Inquiry'}
                                                    </Button>
                                                </form>
                                            ) : (
                                                <form onSubmit={handleScheduleVisit} className="space-y-3">
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[11px] font-medium text-text-secondary">Your Name</label>
                                                        <input type="text" required value={visitName} onChange={(e) => setVisitName(e.target.value)} placeholder="John Doe" className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500/50" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[11px] font-medium text-text-secondary">Phone Number</label>
                                                        <input type="tel" required value={visitPhone} onChange={(e) => setVisitPhone(e.target.value)} placeholder="+91 9876543210" className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500/50" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1.5">
                                                            <label className="block text-[11px] font-medium text-text-secondary">Visit Date</label>
                                                            <input type="date" required value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500/50" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="block text-[11px] font-medium text-text-secondary">Visit Type</label>
                                                            <select value={visitType} onChange={(e) => setVisitType(e.target.value)} className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500/50">
                                                                <option value="IN_PERSON">In Person</option>
                                                                <option value="VIRTUAL">Video Call</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[11px] font-medium text-text-secondary">Preferred Time Slot</label>
                                                        <select value={visitTimeSlot} onChange={(e) => setVisitTimeSlot(e.target.value)} className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500/50">
                                                            <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                                                            <option value="Afternoon (12 PM - 3 PM)">Afternoon (12 PM - 3 PM)</option>
                                                            <option value="Evening (3 PM - 6 PM)">Evening (3 PM - 6 PM)</option>
                                                        </select>
                                                    </div>

                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                        size="md"
                                                        className="w-full mt-2"
                                                        icon={Calendar}
                                                        isLoading={inquiryStatus === 'VERIFYING'}
                                                    >
                                                        {inquiryStatus === 'VERIFYING' ? 'Booking...' : 'Book Site Visit'}
                                                    </Button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                    <div className="mt-4 pt-4 border-t border-surface-border text-center">
                                        <Link to={`/seller/profile/${property.sellerId}`} className="text-sm font-semibold text-royal-400 hover:text-royal-300 transition-colors">
                                            View Seller Profile
                                        </Link>
                                    </div>
                                </Card>

                                {/* Quick Actions */}
                                <Card>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant={isSaved ? 'primary' : 'secondary'}
                                            className="w-full"
                                            icon={Heart}
                                            onClick={() => {
                                                const nowSaved = toggleSave(id);
                                                toast.success(nowSaved ? 'Property saved!' : 'Removed from saved');
                                            }}
                                        >
                                            {isSaved ? 'Saved' : 'Save'}
                                        </Button>
                                        <Button
                                             variant={isInCompare ? 'primary' : 'secondary'}
                                             className="w-full"
                                             icon={GitCompare}
                                             onClick={() => {
                                                 if (isInCompare) {
                                                     removeItem(id);
                                                     toast.success('Removed from comparison');
                                                 } else {
                                                     addItem(property);
                                                     toast.success('Added to comparison');
                                                 }
                                             }}
                                         >
                                             {isInCompare ? 'Comparing' : 'Compare'}
                                         </Button>
                                         <Button
                                            variant="secondary"
                                            className="w-full"
                                            icon={Share2}
                                            onClick={() => {
                                                const url = window.location.href;
                                                const text = `🏠 ${property?.title}\n📍 ${property?.location?.city}\n💰 ${formatCurrency(property?.price || property?.monthlyRent || property?.leaseAmount)}\n\nView: ${url}`;
                                                const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                                window.open(waUrl, '_blank');
                                            }}
                                        >
                                            Share
                                        </Button>
                                        {isAuthenticated && (
                                            <Button
                                                variant="gold"
                                                className="col-span-3 w-full"
                                                icon={HandshakeIcon}
                                                onClick={() => setShowOfferModal(true)}
                                            >
                                                Make an Offer
                                            </Button>
                                        )}
                                    </div>
                                </Card>

                                {/* Mortgage Calculator */}
                                <MortgageCalculator propertyPrice={property.price || property.monthlyRent || property.leaseAmount} />
                            </div>
                        </div>

                        {/* Similar Properties */}
                        <SimilarPropertiesSection
                            currentId={id}
                            city={property.location?.city}
                            listingType={property.listingType}
                            properties={allProperties}
                        />

                        {/* Recently Sold */}
                        <RecentlySoldSection
                            city={property.location?.city}
                            listingType={property.listingType}
                            currentPrice={property.price || property.monthlyRent || property.leaseAmount}
                            area={property.area}
                        />
                    </div>
                </div>

                {/* Sticky Mobile CTA */}
                {!property.isUnlocked && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-card/95 backdrop-blur-xl border-t border-surface-border p-4 z-40">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-lg font-display font-bold text-gradient">{formatCurrency(property.price || property.monthlyRent || property.leaseAmount)}</p>
                                <p className="text-xs text-text-muted">{property.listingType}</p>
                            </div>
                            <Button variant="primary" icon={User} onClick={handleInquiry} isLoading={inquiryStatus === 'VERIFYING'}>
                                Contact Seller
                            </Button>
                        </div>
                    </div>
                )}

                <Footer />
            </div>

            {/* Make Offer Modal */}
            {showOfferModal && (
                <MakeOfferModal
                    property={property}
                    onClose={() => setShowOfferModal(false)}
                    onSubmit={async ({ offerPrice, message }) => {
                        let otherUserId = property.sellerId;
                        try {
                            const state = property.location?.state || '';
                            if (state) {
                                const managerRes = await managerService.getManagerByCity(state);
                                if (managerRes.data?.manager?.id) {
                                    otherUserId = managerRes.data.manager.id;
                                }
                            }
                        } catch (err) {
                            console.error("Failed to fetch state manager, falling back to seller", err);
                        }

                        try {
                            await propertyService.incrementUnlockCount(id);
                        } catch (err) {
                            console.error("Failed to increment unlock count", err);
                        }

                        await chatService.startConversation({
                            propertyId: id,
                            propertyTitle: property.title,
                            otherUserId,
                            message: `🤝 *FORMAL OFFER*\n\n*Offer Price:* ${formatCurrency(offerPrice)}\n*Listed At:* ${formatCurrency(property.price || property.monthlyRent || property.leaseAmount)}\n*Message:* ${message}`,
                        });
                        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
                    }}
                />
            )}

            {/* 3D Tour Modal */}
            {showTour && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-navy-900 border border-royal-500/20 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative flex flex-col h-[550px]"
                    >
                        {/* Modal Header */}
                        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-navy-950/50">
                            <div className="flex items-center gap-2">
                                <Badge variant="gold">Interactive 3D Tour</Badge>
                                <h3 className="text-sm font-display font-bold text-white">{property.title}</h3>
                            </div>
                            <button
                                onClick={() => setShowTour(false)}
                                className="w-8 h-8 rounded-full bg-surface-hover hover:bg-surface-border text-text-secondary hover:text-white flex items-center justify-center transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tour Viewer Area */}
                        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                            <img
                                src={tourRooms[activeRoom].image}
                                alt={activeRoom}
                                className="w-full h-full object-cover transition-all duration-700 ease-in-out transform scale-105"
                            />
                            
                            {/* Glassmorphism Room Controls */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-navy-950/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-royal-500/20 shadow-lg z-10">
                                {Object.keys(tourRooms).map((roomKey) => (
                                    <button
                                        key={roomKey}
                                        onClick={() => {
                                            setActiveRoom(roomKey);
                                            setSelectedHotspot(null);
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                            activeRoom === roomKey
                                                ? 'bg-gold-500 text-navy-950 shadow-md'
                                                : 'text-text-secondary hover:text-white hover:bg-surface-hover/50'
                                        }`}
                                    >
                                        {tourRooms[roomKey].label}
                                    </button>
                                ))}
                            </div>

                            {/* Hotspots */}
                            {tourRooms[activeRoom].hotspots.map((h, i) => (
                                <div
                                    key={i}
                                    style={{ top: h.top, left: h.left }}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                                >
                                    <button
                                        onClick={() => setSelectedHotspot(h)}
                                        className="relative flex items-center justify-center w-8 h-8 focus:outline-none group"
                                    >
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-gold-500 opacity-75 animate-ping" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500 border-2 border-white shadow-md" />
                                    </button>
                                </div>
                            ))}

                            {/* Hotspot Info Bubble */}
                            {selectedHotspot && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute bg-navy-950/90 backdrop-blur-md border border-gold-500/30 p-3.5 rounded-2xl max-w-xs shadow-xl z-30"
                                    style={{
                                        top: `calc(${selectedHotspot.top} - 10px)`,
                                        left: selectedHotspot.left,
                                        transform: 'translate(-50%, -100%)'
                                    }}
                                >
                                    <button
                                        onClick={() => setSelectedHotspot(null)}
                                        className="absolute top-2 right-2 text-text-muted hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <h4 className="text-xs font-bold text-gold-400 mb-1 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-gold-500" />
                                        {selectedHotspot.title}
                                    </h4>
                                    <p className="text-[11px] text-text-secondary leading-relaxed">{selectedHotspot.desc}</p>
                                </motion.div>
                            )}

                            {/* Info overlay */}
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm p-3 rounded-2xl border border-white/5 max-w-xs text-xs pointer-events-none">
                                <p className="font-bold text-white mb-0.5">{tourRooms[activeRoom].label} Overview</p>
                                <p className="text-text-muted">{tourRooms[activeRoom].details}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
};

export default PropertyDetailPage;
