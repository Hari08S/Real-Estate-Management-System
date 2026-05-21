import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, PlusCircle } from 'lucide-react';
import { useAuth } from '../../hooks';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { userService, authService } from '../../services/api';
import toast from 'react-hot-toast';

const footerLinks = [
    {
        title: 'Discover',
        links: [
            { label: 'Buy Property', to: '/properties?type=SALE' },
            { label: 'Rent Property', to: '/properties?type=RENT' },
            { label: 'Lease Property', to: '/properties?type=LEASE' },
            { label: 'Compare', to: '/compare' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About Us', to: '/about' },
            { label: 'How It Works', to: '/#how-it-works' },
            { label: 'Pricing', to: '/#pricing' },
            { label: 'Careers', to: '/careers' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Help Center', to: '/help' },
            { label: 'Contact Us', to: '/contact' },
            { label: 'Privacy Policy', to: '/privacy' },
            { label: 'Terms of Service', to: '/terms' },
        ],
    },
];

const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

const Footer = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const setUser = useAuthStore((s) => s.setUser);

    const handlePublishListing = async () => {
        if (!isAuthenticated) {
            navigate('/login?returnUrl=/seller/create');
            return;
        }

        if (user?.activeRole === 'SELLER' || user?.activeRole === 'RENTAL_OWNER') {
            navigate('/seller/create');
            return;
        }

        const hasSellerRole = user?.roles?.includes('SELLER');
        const targetRole = hasSellerRole ? 'SELLER' : (user?.roles?.includes('RENTAL_OWNER') ? 'RENTAL_OWNER' : null);

        if (targetRole) {
            const toastId = toast.loading('Switching to Seller role to publish listing...');
            try {
                const { data } = await userService.switchRole(targetRole);
                await authService.refreshToken();
                setUser(data.user);
                toast.success('Switched to Seller! Ready to publish.', { id: toastId });
                setTimeout(() => {
                    navigate('/seller/create');
                }, 100);
            } catch (err) {
                toast.error('Failed to automatically switch role. Please switch manually in the navbar.', { id: toastId });
            }
        } else {
            toast.error('You do not have a Seller role. Please change role from settings first.');
        }
    };

    return (
        <footer className="bg-surface-card border-t border-surface-border">
            {/* Publish Listing CTA */}
            <div className="page-container py-10">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-royal-800 via-royal-500 to-navy-600 p-8 sm:p-10">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
                                Have a property to sell or rent?
                            </h3>
                            <p className="text-white/70 text-sm max-w-md">
                                List your property for free on SquareFeet X and reach thousands of verified buyers.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            variant="gold"
                            icon={PlusCircle}
                            onClick={handlePublishListing}
                            className="shrink-0 shadow-2xl"
                        >
                            Publish Listing
                        </Button>
                    </div>
                </div>
            </div>

            <div className="page-container pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2.5 mb-4">
                            <img src="/squarefeetx.png" alt="SquareFeet X" className="w-10 h-10 rounded-xl object-contain" />
                            <div>
                                <span className="text-xl font-display font-bold text-text-primary">Square</span>
                                <span className="text-xl font-display font-bold text-gradient">Feet X</span>
                            </div>
                        </Link>
                        <p className="text-text-secondary text-sm leading-relaxed mb-6 max-w-sm">
                            Every Square Foot. Zero Commission. The smarter way to buy, sell, and rent properties with manager-verified listings.
                        </p>
                        <div className="space-y-3 text-sm text-text-secondary">
                            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-royal-400" /> support@squarefeetx.com</div>
                            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-royal-400" /> +91 98765 43210</div>
                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-royal-400" /> Hyderabad, India</div>
                        </div>
                    </div>

                    {/* Links */}
                    {footerLinks.map((section) => (
                        <div key={section.title} className="pt-1">
                            <h4 className="text-sm font-display font-semibold text-text-primary mb-5 uppercase tracking-wider">{section.title}</h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link to={link.to} className="text-sm text-text-secondary hover:text-royal-400 transition-colors duration-200">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-14 pt-8 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-text-muted">
                        © {new Date().getFullYear()} SquareFeet X. All rights reserved.
                    </p>
                    <div className="flex items-center gap-3">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                aria-label={social.label}
                                className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-text-secondary hover:text-royal-400 hover:bg-royal-500/10 transition-all duration-200"
                            >
                                <social.icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

