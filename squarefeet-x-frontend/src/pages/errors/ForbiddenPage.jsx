import { Link } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';

const ForbiddenPage = () => {
    return (
        <>
            <SEOHead title="Access Denied" noindex />
            <div className="min-h-screen bg-surface-dark flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-red-500/15 flex items-center justify-center mb-6">
                        <ShieldX className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-5xl font-display font-black text-white mb-2">403</h1>
                    <h2 className="text-xl font-display font-semibold text-text-primary mb-3">Access Denied</h2>
                    <p className="text-text-secondary mb-8">You don't have permission to access this page.</p>
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

export default ForbiddenPage;
