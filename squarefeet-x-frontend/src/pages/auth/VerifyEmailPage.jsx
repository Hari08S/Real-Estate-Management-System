import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { authService } from '../../services/api';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryEmail = new URLSearchParams(location.search).get('email') || '';
    const [email, setEmail] = useState(queryEmail);
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Input OTP, 2: Verification Success
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6 || isNaN(otp)) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            await authService.verifyEmail({ email, otp });
            toast.success('Email verified successfully!');
            setStep(2);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Verification failed. OTP may be invalid or expired.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email) {
            toast.error('Email address is required to resend OTP');
            return;
        }

        setIsResending(true);
        try {
            await authService.resendVerificationOtp({ email });
            toast.success('Verification OTP resent successfully!');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to resend OTP';
            toast.error(msg);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <>
            <SEOHead title="Verify Email Address" />
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
                                <div className="text-center mb-6">
                                    <h1 className="text-3xl font-display font-bold text-text-primary mb-3">Verify Email</h1>
                                    <p className="text-text-secondary text-sm">
                                        We have sent a 6-digit verification OTP to <br />
                                        <span className="text-text-primary font-medium">{email || 'your email'}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-6">
                                    {!queryEmail && (
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-text-secondary">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                            />
                                        </div>
                                    )}

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

                                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                                        Verify Email
                                    </Button>
                                </form>

                                <div className="mt-6 text-center text-sm text-text-secondary">
                                    Didn't receive the OTP?{' '}
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={isResending}
                                        className="text-royal-400 hover:text-royal-300 font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isResending ? 'Resending...' : 'Resend OTP'}
                                    </button>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-display font-bold text-text-primary mb-3">Verification Success!</h2>
                                <p className="text-text-secondary text-sm mb-8">
                                    Your email has been successfully verified. You can now use your account.
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

export default VerifyEmailPage;
