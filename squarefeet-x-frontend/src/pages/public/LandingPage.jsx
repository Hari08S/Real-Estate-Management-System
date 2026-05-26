import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import {
    Search, Shield, MessageSquare, IndianRupee, ArrowRight, CheckCircle2,
    Building2, Users, Star, Zap, ChevronRight, Sparkles, Crown, TrendingUp, BadgeCheck
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6 },
};

const stagger = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
};

const features = [
    { icon: IndianRupee, title: 'Zero Commission', desc: 'No brokerage fees. Sellers list for free. Buyers connect with sellers directly.', color: 'from-gold-500 to-gold-600' },
    { icon: Shield, title: 'Manager Verified', desc: 'Every listing is verified by assigned city managers for quality assurance.', color: 'from-emerald-500 to-emerald-600' },
    { icon: MessageSquare, title: 'Direct Inquiries', desc: 'View property details freely. Send direct inquiries to sellers without any hurdles.', color: 'from-royal-500 to-royal-600' },
    { icon: Zap, title: 'Instant Access', desc: 'Get instant access to connect with sellers through our integrated chat platform.', color: 'from-blue-500 to-blue-600' },
    { icon: Crown, title: 'Premium Listings', desc: 'Access curated, high-quality properties across all major Indian cities.', color: 'from-amber-500 to-amber-600' },
    { icon: BadgeCheck, title: 'Secure Platform', desc: 'Your data and direct communications are strictly protected across the platform.', color: 'from-cyan-500 to-cyan-600' },
];

const steps = [
    { step: '01', title: 'Browse Properties', desc: 'Search and filter through thousands of verified listings across cities.', icon: Search },
    { step: '02', title: 'Find Your Match', desc: 'Compare properties, view photos, maps, and detailed specifications.', icon: Building2 },
    { step: '03', title: 'Send Inquiry', desc: 'Send a direct inquiry to the seller to express your interest instantly.', icon: MessageSquare },
    { step: '04', title: 'Connect Directly', desc: 'Contact the seller directly — zero middlemen, zero commission.', icon: Users },
];

const stats = [
    { value: '10,000+', label: 'Properties Listed' },
    { value: '5,000+', label: 'Happy Buyers' },
    { value: '50+', label: 'Cities Covered' },
    { value: '₹0', label: 'Commission Charged' },
];

const testimonials = [
    { name: 'Arjun Patel', role: 'Buyer', city: 'Mumbai', text: 'Found my dream apartment without paying any brokerage. The direct chat feature made talking to the seller incredibly easy!', rating: 5, gradient: 'from-blue-500 to-indigo-600' },
    { name: 'Priya Sharma', role: 'Seller', city: 'Delhi', text: 'Listed my property for free and got genuine buyers directly. No more dealing with brokers!', rating: 5, gradient: 'from-purple-500 to-pink-600' },
    { name: 'Rajesh Kumar', role: 'Buyer', city: 'Bangalore', text: 'The verification process gives confidence that every listing is genuine. Amazing platform!', rating: 5, gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Sneha Reddy', role: 'Seller', city: 'Hyderabad', text: 'Sold my villa in just 2 weeks through SquareFeet X. The manager verification really builds trust.', rating: 5, gradient: 'from-amber-500 to-rose-600' },
];

const LandingPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return (
        <>
            <SEOHead
                title="Commission-Free Real Estate"
                description="Every Square Foot. Zero Commission. Buy, sell, and rent properties without brokerage fees. Manager-verified listings with direct seller connectivity."
            />
            <div className="min-h-screen bg-surface-dark">
                <Navbar />

                {/* ===== HERO ===== */}
                <section className="relative pt-[7rem] pb-12 lg:pt-[9rem] lg:pb-16 overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0">
                        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-royal-600/10 blur-[120px]" />
                        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-gold-500/8 blur-[100px]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-navy-800/30 blur-[150px]" />
                    </div>

                    <div className="relative z-10 page-container">
                        <div className="text-center max-w-4xl mx-auto">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center">
                                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-royal-500/10 border border-royal-500/20 text-royal-400 text-sm font-medium mb-8">
                                    <Sparkles className="w-4 h-4" /> Commission-Free · Direct Inquiries · Manager-Verified
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="text-4xl sm:text-5xl lg:text-7xl font-display font-black text-text-primary leading-[1.1] mb-8"
                            >
                                Every Square Foot.
                                <br />
                                <span className="text-gradient">Zero Commission.</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed"
                            >
                                The smarter way to buy, sell, and rent properties. No brokers. No commissions.
                                Just verified listings and direct inquiries to connect with sellers.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-5"
                            >
                                <Link to="/properties">
                                    <Button size="xl" variant="gold" iconRight={ArrowRight} className="shadow-2xl shadow-gold-500/20">
                                        Browse Properties
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="xl" variant="outline" iconRight={ChevronRight}>
                                        List for Free
                                    </Button>
                                </Link>
                            </motion.div>

                            {/* Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 max-w-3xl mx-auto"
                            >
                                {stats.map((stat) => (
                                    <div key={stat.label} className="text-center px-4">
                                        <p className="text-3xl sm:text-4xl font-display font-bold text-gradient">{stat.value}</p>
                                        <p className="text-sm text-text-muted mt-2">{stat.label}</p>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ===== FEATURES ===== */}
                <section className="py-16 lg:py-20 relative">
                    <div className="page-container">
                        <motion.div {...fadeUp} className="text-center mb-16 max-w-3xl mx-auto">
                            <span className="text-sm font-medium text-royal-400 uppercase tracking-widest">Why Choose Us</span>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mt-4">
                                Built for <span className="text-gradient-royal">Smart Buyers & Sellers</span>
                            </h2>
                            <p className="text-text-secondary mt-5 max-w-2xl mx-auto leading-relaxed">Everything you need to buy, sell, or rent property — without paying a single rupee in commission.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {features.map((feature, i) => (
                                <motion.div key={feature.title} {...stagger} transition={{ delay: i * 0.1, duration: 0.5 }}>
                                    <Card hover className="h-full group text-center">
                                        <div className="flex justify-center">
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                                <feature.icon className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-display font-semibold text-text-primary mb-3">{feature.title}</h3>
                                        <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== HOW IT WORKS ===== */}
                <section id="how-it-works" className="py-16 lg:py-20 bg-surface-card/50">
                    <div className="page-container">
                        <motion.div {...fadeUp} className="text-center mb-20">
                            <span className="text-sm font-medium text-gold-400 uppercase tracking-widest">Simple Process</span>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mt-4">
                                How It <span className="text-gradient">Works</span>
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 max-w-5xl mx-auto">
                            {steps.map((step, i) => (
                                <motion.div key={step.step} {...stagger} transition={{ delay: i * 0.15, duration: 0.5 }}>
                                    <div className="relative text-center group">
                                        <div className="text-7xl font-display font-black text-royal-500/10 mb-2 leading-none">{step.step}</div>
                                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-royal-600 to-royal-500 flex items-center justify-center mb-6 group-hover:shadow-xl group-hover:shadow-royal-500/20 transition-all duration-300">
                                            <step.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-lg font-display font-semibold text-text-primary mb-3">{step.title}</h3>
                                        <p className="text-text-secondary text-sm leading-relaxed max-w-[220px] mx-auto">{step.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== TESTIMONIALS ===== */}
                <section className="py-16 lg:py-20">
                    <div className="page-container">
                        <motion.div {...fadeUp} className="text-center mb-16">
                            <span className="text-sm font-medium text-gold-400 uppercase tracking-widest">Testimonials</span>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mt-4">
                                Loved by <span className="text-gradient">Thousands</span>
                            </h2>
                        </motion.div>

                        <Swiper
                            modules={[Autoplay, Pagination]}
                            autoplay={{ delay: 4000, disableOnInteraction: false }}
                            pagination={{ clickable: true }}
                            spaceBetween={28}
                            breakpoints={{
                                640: { slidesPerView: 1 },
                                768: { slidesPerView: 2 },
                                1024: { slidesPerView: 3 },
                            }}
                            className="pb-14"
                        >
                            {testimonials.map((t, i) => (
                                <SwiperSlide key={i}>
                                    <Card className="h-full flex flex-col">
                                        <div className="flex gap-1 mb-4">
                                            {[...Array(t.rating)].map((_, j) => (
                                                <Star key={j} className="w-4 h-4 fill-gold-400 text-gold-400" />
                                            ))}
                                        </div>
                                        <p className="text-text-secondary text-sm leading-relaxed mb-6 italic flex-1 min-h-[80px]">"{t.text}"</p>
                                        <div className="flex items-center gap-3 pt-4 border-t border-surface-border">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient || 'from-royal-600 to-gold-500'} flex items-center justify-center text-white font-display font-semibold text-sm shrink-0`}>
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">{t.name}</p>
                                                <p className="text-xs text-text-muted">{t.role} · {t.city}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </section>

                {/* ===== CTA ===== */}
                <section className="py-12 lg:py-16">
                    <div className="page-container">
                        <motion.div {...fadeUp}>
                            <div className="relative rounded-3xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-royal-800 via-royal-500 to-navy-800 animate-gradient" />
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
                                <div className="relative z-10 text-center px-8 sm:px-12 py-16 lg:py-24">
                                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                                        Ready to Get Started?
                                    </h2>
                                    <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                                        Join thousands of buyers and sellers who trust SquareFeet X for commission-free real estate.
                                    </p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                                        <Link to="/register">
                                            <Button size="xl" variant="gold" iconRight={ArrowRight} className="shadow-2xl">
                                                Create Free Account
                                            </Button>
                                        </Link>
                                        <Link to="/properties">
                                            <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                                                Explore Listings
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <Footer />
            </div>
        </>
    );
};

export default LandingPage;
