import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [devResetLink, setDevResetLink] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { authService } = await import('../../services/api');
            const { data } = await authService.forgotPassword({ email });
            if (data?.resetLink) {
                setDevResetLink(data.resetLink);
            }
            setIsSubmitted(true);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to send reset link';
            import('react-hot-toast').then(toast => toast.default.error(msg));
            setIsSubmitted(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead title="Forgot Password" />
            <div className="min-h-screen flex items-center justify-center pt-16 px-4 pb-12 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-royal-500/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

                <div className="w-full max-w-md relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 shadow-2xl"
                    >
                        {!isSubmitted ? (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-display font-bold text-text-primary mb-3">Reset Password</h1>
                                    <p className="text-text-secondary text-sm">
                                        Enter your email address and we'll send you instructions to reset your password.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-text-secondary">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full bg-surface-dark border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                                        Send Reset Link
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-display font-bold text-text-primary mb-3">Check your email</h2>
                                <p className="text-text-secondary text-sm mb-8">
                                    We have sent a password reset link to <br />
                                    <span className="text-text-primary font-medium">{email}</span>
                                </p>
                                {devResetLink ? (
                                    <div className="mt-6 p-4 rounded-xl bg-royal-500/10 border border-royal-500/20 text-left">
                                        <p className="text-xs font-semibold text-royal-400 mb-2 uppercase tracking-wider">Demo / Development Mode:</p>
                                        <p className="text-sm text-text-secondary mb-3">Since this is a simulated mail service environment, you can reset your password directly by clicking the button below:</p>
                                        <Link to={devResetLink.replace('http://localhost:5173', '')} className="block w-full text-center px-4 py-2.5 bg-royal-500 hover:bg-royal-600 text-white text-sm font-semibold rounded-xl transition-all">
                                            Reset Password Directly
                                        </Link>
                                    </div>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => window.open('https://gmail.com', '_blank')}
                                    >
                                        Open Email App
                                    </Button>
                                )}
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
