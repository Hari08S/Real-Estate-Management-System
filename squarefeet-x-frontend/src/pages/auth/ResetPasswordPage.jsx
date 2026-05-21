import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword(token, { password });
            setIsSuccess(true);
            toast.success('Password reset successful');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead title="Reset Password" noindex />
            <div className="min-h-screen flex items-center justify-center pt-16 px-4 pb-12 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-royal-500/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

                <div className="w-full max-w-md relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 shadow-2xl"
                    >
                        {!isSuccess ? (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-display font-bold text-text-primary mb-3">Set New Password</h1>
                                    <p className="text-text-secondary text-sm">
                                        Please enter your new password below.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-text-secondary">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-surface-dark border border-surface-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-text-secondary">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-surface-dark border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                                        Reset Password
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-display font-bold text-text-primary mb-3">Password updated!</h2>
                                <p className="text-text-secondary text-sm mb-8">
                                    Your password has been reset successfully. You can now log in with your new password.
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={() => navigate('/login')}
                                    icon={ArrowRight}
                                >
                                    Proceed to Login
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default ResetPasswordPage;
