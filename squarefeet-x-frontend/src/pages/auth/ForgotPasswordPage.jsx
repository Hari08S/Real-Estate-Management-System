import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Verify OTP & New Password, Step 3: Success
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [devOtp, setDevOtp] = useState('');

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { authService } = await import('../../services/api');
            const { data } = await authService.forgotPassword({ email });
            if (data?.otp || data?.token) {
                setDevOtp(data.otp || data.token);
            }
            toast.success('Reset OTP sent successfully!');
            setStep(2);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to send OTP';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (otp.length !== 6 || isNaN(otp)) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }
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
            const { authService } = await import('../../services/api');
            await authService.resetPassword(otp, { password });
            toast.success('Password reset successfully!');
            setStep(3);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to reset password. OTP may be invalid or expired.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead title="Reset Password via OTP" />
            <div className="min-h-screen flex items-center justify-center pt-16 px-4 pb-12 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-royal-500/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

                <div className="w-full max-w-md relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 shadow-2xl"
                    >
                        {step === 1 && (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-display font-bold text-text-primary mb-3">Reset Password</h1>
                                    <p className="text-text-secondary text-sm">
                                        Enter your email address and we will send you a 6-digit OTP to reset your password.
                                    </p>
                                </div>

                                <form onSubmit={handleSendOtp} className="space-y-6">
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
                                        Send Reset OTP
                                    </Button>
                                </form>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="text-center mb-6">
                                    <h1 className="text-3xl font-display font-bold text-text-primary mb-3">Enter Reset OTP</h1>
                                    <p className="text-text-secondary text-sm">
                                        We have sent a 6-digit reset OTP to <br />
                                        <span className="text-text-primary font-medium">{email}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-text-secondary">6-Digit OTP</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="123456"
                                                className="w-full bg-surface-dark border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-center text-lg font-bold tracking-widest text-text-primary placeholder:text-text-muted placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                            />
                                        </div>
                                    </div>

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

                                    <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
                                        Reset Password
                                    </Button>
                                </form>

                                {/* Real-time OTP is successfully delivered to the user's inbox */}
                            </>
                        )}

                        {step === 3 && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-display font-bold text-text-primary mb-3">Password reset success!</h2>
                                <p className="text-text-secondary text-sm mb-8">
                                    Your password has been successfully updated in the Oracle database. You can now use your new password to sign in.
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={() => navigate('/login')}
                                >
                                    Proceed to Login
                                </Button>
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            {step === 2 ? (
                                <button
                                    onClick={() => setStep(1)}
                                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Email Entry
                                </button>
                            ) : (
                                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
