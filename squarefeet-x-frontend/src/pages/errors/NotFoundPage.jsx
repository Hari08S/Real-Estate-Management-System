import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
    return (
        <>
            <SEOHead title="Page Not Found" noindex />
            <div className="min-h-screen bg-surface-dark flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="relative mb-8">
                        <h1 className="text-[120px] sm:text-[160px] font-display font-black text-gradient-royal leading-none opacity-20">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-royal-600 to-gold-500 flex items-center justify-center animate-float shadow-2xl shadow-royal-500/30">
                                <Search className="w-10 h-10 text-white" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-display font-bold text-text-primary mb-3">Page Not Found</h2>
                    <p className="text-text-secondary mb-8">The page you're looking for doesn't exist or has been moved.</p>
                    <div className="flex items-center justify-center gap-3">
                        <Button variant="secondary" onClick={() => window.history.back()} icon={ArrowLeft}>
                            Go Back
                        </Button>
                        <Link to="/">
                            <Button icon={Home}>Home</Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default NotFoundPage;
