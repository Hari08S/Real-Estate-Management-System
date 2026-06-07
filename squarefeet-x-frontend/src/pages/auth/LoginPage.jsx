import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLogin } from '../../hooks';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const login = useLogin();
    const navigate = useNavigate();
    const location = useLocation();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await login(data);
            toast.success('Welcome back!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead title="Login" noindex />
            <div className="min-h-screen bg-surface-dark flex">
                {/* Left - Form */}
                <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-lg"
                    >
                        {/* Back to Home Button */}
                        <div className="mb-6 flex justify-start">
                            <Link 
                                to="/" 
                                className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface-card hover:bg-surface-hover border border-surface-border px-3.5 py-1.5 rounded-xl transition-all duration-200"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                            </Link>
                        </div>

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 mb-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-600 to-gold-500 flex items-center justify-center">
                                <span className="text-sm font-display font-bold text-text-primary">SX</span>
                            </div>
                            <div>
                                <span className="text-xl font-display font-bold text-text-primary">Square</span>
                                <span className="text-xl font-display font-bold text-gradient">Feet X</span>
                            </div>
                        </Link>

                        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Welcome Back</h1>
                        <p className="text-text-secondary mb-8">Sign in to access your dashboard</p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                icon={Mail}
                                error={errors.email?.message}
                                autoComplete="email"
                                {...register('email')}
                            />

                            <div className="relative">
                                <Input
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    icon={Lock}
                                    error={errors.password?.message}
                                    autoComplete="current-password"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-surface-border bg-surface-card text-royal-500 focus:ring-royal-500" />
                                    <span className="text-sm text-text-secondary">Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="text-sm text-royal-400 hover:text-royal-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button type="submit" className="w-full" size="lg" isLoading={isLoading} iconRight={ArrowRight}>
                                Sign In
                            </Button>
                        </form>

                        <p className="mt-8 text-center text-sm text-text-secondary">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-royal-400 hover:text-royal-300">
                                Sign up now
                            </Link>
                        </p>
                    </motion.div>
                </div>

                {/* Right - Decorative */}
                <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-royal-900 via-navy-950 to-surface-dark" />
                    <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-royal-600/20 blur-[100px]" />
                    <div className="absolute bottom-1/4 left-1/4 w-56 h-56 rounded-full bg-gold-500/15 blur-[80px]" />
                    <div className="relative z-10 flex items-center justify-center p-12 w-full">
                        <div className="text-center max-w-lg">
                            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-royal-600 to-gold-500 flex items-center justify-center animate-float shadow-2xl shadow-royal-500/30">
                                <span className="text-3xl font-display font-bold text-white">SX</span>
                            </div>
                            <h2 className="text-4xl font-display font-bold text-white mb-4">Every Square Foot.<br /><span className="text-gradient">Zero Commission.</span></h2>
                            <p className="text-gray-300 text-lg leading-relaxed">Commission-free real estate with manager-verified listings. Pay only to unlock.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
