import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldAlert, Award, FileText, Compass, Briefcase, HelpCircle, ArrowLeft, Send } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';
import { chatService } from '../../services/api';
import { useAuth } from '../../hooks';
import toast from 'react-hot-toast';

const pagesContent = {
    '/about': {
        title: 'About Us',
        subtitle: 'The Smarter Way to Buy, Sell, and Rent Real Estate.',
        description: 'SquareFeet X was founded with a simple yet powerful mission: to eliminate unnecessary brokerage fees and bring complete transparency to the real estate market. We connect buyers and sellers directly, verified by our trusted local city managers.',
        icon: Compass,
        sections: [
            { title: 'Zero Commission', content: 'We believe real estate transactions shouldn\'t be burdened with heavy middleman fees. Sellers list for free, and buyers connect directly at no extra brokerage cost.' },
            { title: 'Manager Verified Listings', content: 'Our dedicated team of city managers verifies each property physically or digitally to ensure genuine photos, accurate locations, and verified ownership.' },
            { title: 'Secure direct chats', content: 'Communicate directly with property owners and buyers using our real-time messaging system, keeping your contact details safe until you choose to unlock.' }
        ]
    },
    '/careers': {
        title: 'Careers at SquareFeet X',
        subtitle: 'Shape the Future of Real Estate Technology.',
        description: 'Join a dynamic, rapidly growing team that is revolutionizing how properties are bought, sold, and managed across India. We are always looking for passionate builders, designers, and operations wizards.',
        icon: Briefcase,
        sections: [
            { title: 'Engineering & Product', content: 'Build advanced matching systems, seamless direct chat infrastructure, and real-time mapping platforms that power thousands of transactions daily.' },
            { title: 'City Manager Operations', content: 'Be our eyes on the ground. Act as the trusted verification partner for your local city, ensuring high-quality property standards and onboarding new listings.' },
            { title: 'Marketing & Growth', content: 'Spread the word about commission-free real estate. Develop digital campaigns, content strategies, and strategic partnerships.' }
        ]
    },
    '/help': {
        title: 'Help Center',
        subtitle: 'Frequently Asked Questions & Support Guide.',
        description: 'Need help navigating the platform? Find instant answers to the most common queries or reach out directly to our dedicated support managers.',
        icon: HelpCircle,
        sections: [
            { title: 'How do I unlock contact details?', content: 'To view direct seller or buyer contact details, simply click the "View Contact" button on the property detail page. You can unlock listings using credits or a small unlock fee.' },
            { title: 'How does listing verification work?', content: 'Once you submit a property listing, a local city manager is assigned. They will review the details, verify coordinates, and approve it within 24 hours.' },
            { title: 'Is my message history secure?', content: 'Yes, your chats are stored securely. You can send messages directly on our platform and receive real-time updates through your dashboard.' }
        ]
    },
    '/contact': {
        title: 'Contact Us',
        subtitle: 'We would love to hear from you.',
        description: 'Have feedback, custom partnership inquiries, or need support? Drop us a line and our Hyderabad-based team will respond within 24 hours.',
        icon: Mail,
        isContactForm: true,
        sections: [
            { title: 'Headquarters', content: 'Plot 45, Gachibowli Tech Park, Hyderabad, Telangana, 500032' },
            { title: 'Direct Email', content: 'support@squarefeetx.com' },
            { title: 'Phone Support', content: '+91 98765 43210 (Mon-Sat, 9 AM - 6 PM)' }
        ]
    },
    '/privacy': {
        title: 'Privacy Policy',
        subtitle: 'Your Data Security is Our Top Priority.',
        description: 'We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, store, and share your data when you use our platform.',
        icon: ShieldAlert,
        sections: [
            { title: 'Information We Collect', content: 'We collect your name, email, phone number, and location coordinates to verify your identity and facilitate manager assignments.' },
            { title: 'How We Use Your Data', content: 'We use your data to recommend local listings, facilitate direct communication between buyers and sellers, and monitor platform security.' },
            { title: 'Data Sharing & Consent', content: 'We never sell your personal information to third-party advertisers. Your phone number is only shared when a user pays the required unlock fee.' }
        ]
    },
    '/terms': {
        title: 'Terms of Service',
        subtitle: 'Rules, Responsibilities, and Agreement.',
        description: 'By accessing or using SquareFeet X, you agree to comply with our Terms of Service. Please read these terms carefully before listing or purchasing properties.',
        icon: FileText,
        sections: [
            { title: 'User Account Responsibilities', content: 'You must provide accurate information when creating an account. Any fraudulent listings or fake roles will lead to immediate account suspension.' },
            { title: 'Listing Standards & Accuracy', content: 'All properties must have valid details, real pricing, and authentic photographs. City managers reserve the right to reject low-quality or suspicious properties.' },
            { title: 'Fees and Direct Transactions', content: 'While listing and searching is completely free, certain premium features (like unlocking direct seller contact details) may incur a small standard fee.' }
        ]
    }
};

const StaticPages = () => {
    const { pathname } = useLocation();
    const content = pagesContent[pathname] || pagesContent['/about'];
    const IconComponent = content.icon;

    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) {
            toast.error('All fields are required');
            return;
        }
        setIsSubmitting(true);
        try {
            await chatService.publicContact({ name, email, message });
            toast.success('Your message has been sent to the admin team!');
            setMessage('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <SEOHead title={content.title} />
            <div className="min-h-screen bg-surface-dark flex flex-col">
                <Navbar />
                
                {/* Hero Section */}
                <section className="relative pt-[10rem] pb-16 overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-royal-600/10 blur-[120px]" />
                        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-gold-500/8 blur-[100px]" />
                    </div>

                    <div className="relative z-10 page-container max-w-4xl">
                        <div className="text-center mb-12">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-royal-500/10 border border-royal-500/20 text-royal-400 mb-6"
                            >
                                <IconComponent className="w-8 h-8" />
                            </motion.div>
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl sm:text-5xl font-display font-black text-text-primary mb-4"
                            >
                                {content.title}
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg sm:text-xl text-gradient-royal font-semibold mb-6"
                            >
                                {content.subtitle}
                            </motion.p>
                            <motion.p 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-text-secondary leading-relaxed max-w-2xl mx-auto"
                            >
                                {content.description}
                            </motion.p>
                        </div>

                        {/* Content Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {content.sections.map((section, idx) => (
                                <motion.div 
                                    key={section.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx + 0.3 }}
                                    className="glass-card p-6 flex flex-col h-full"
                                >
                                    <h3 className="text-lg font-display font-bold text-text-primary mb-3">
                                        {section.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm leading-relaxed flex-grow">
                                        {section.content}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Special interactive section for Contact Form */}
                        {content.isContactForm && (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="glass-card p-8 max-w-lg mx-auto"
                            >
                                <h3 className="text-xl font-display font-bold text-text-primary mb-4 text-center">
                                    Send Us a Message
                                </h3>
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Your Name</label>
                                        <input
                                            id="contact-name"
                                            name="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                                        <input
                                            id="contact-email"
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
                                        <textarea
                                            id="contact-message"
                                            name="message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            rows={4}
                                            className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" iconRight={Send} disabled={isSubmitting}>
                                        {isSubmitting ? 'Sending...' : 'Submit Message'}
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* Back navigation */}
                        <div className="flex justify-center mt-12">
                            <Link to="/">
                                <Button variant="secondary" icon={ArrowLeft}>
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="mt-auto">
                    <Footer />
                </div>
            </div>
        </>
    );
};

export default StaticPages;
