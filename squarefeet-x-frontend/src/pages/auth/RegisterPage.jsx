import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRegister } from '../../hooks';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Invalid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const RegisterPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const registerUser = useRegister();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await registerUser(data);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead title="Create Account" noindex />
            <div className="min-h-screen bg-surface-dark flex">
                {/* Left - Decorative */}
                <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-royal-900 to-surface-dark" />
                    <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-gold-500/15 blur-[100px]" />
                    <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-royal-600/20 blur-[80px]" />
                    <div className="relative z-10 flex items-center justify-center p-12 w-full">
                        <div className="text-center max-w-lg">
                            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-gold-500 to-royal-600 flex items-center justify-center animate-float shadow-2xl shadow-gold-500/20">
                                <span className="text-3xl font-display font-bold text-white">SX</span>
                            </div>
                            <h2 className="text-4xl font-display font-bold text-white mb-4">Join the<br /><span className="text-gradient">Revolution</span></h2>
                            <p className="text-gray-300 text-lg leading-relaxed">List properties for free. Buy with zero commissions. Only pay to unlock seller details.</p>
                        </div>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12">
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
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

                        <Link to="/" className="flex items-center gap-2.5 mb-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-600 to-gold-500 flex items-center justify-center">
                                <span className="text-sm font-display font-bold text-text-primary">SX</span>
                            </div>
                            <div>
                                <span className="text-xl font-display font-bold text-text-primary">Square</span>
                                <span className="text-xl font-display font-bold text-gradient">Feet X</span>
                            </div>
                        </Link>

                        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Create Account</h1>
                        <p className="text-text-secondary mb-8">Start your commission-free journey</p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Full Name" placeholder="John Doe" icon={User} error={errors.name?.message} autoComplete="name" {...register('name')} />
                                <Input label="Phone" type="tel" placeholder="+91 98765 43210" icon={Phone} error={errors.phone?.message} autoComplete="tel" {...register('phone')} />
                            </div>
                            <Input label="Email" type="email" placeholder="you@example.com" icon={Mail} error={errors.email?.message} autoComplete="email" {...register('email')} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" icon={Lock} error={errors.password?.message} autoComplete="new-password" {...register('password')} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <Input label="Confirm Password" type="password" placeholder="••••••••" icon={Lock} error={errors.confirmPassword?.message} autoComplete="new-password" {...register('confirmPassword')} />
                            </div>

                            <Button type="submit" className="w-full" size="lg" isLoading={isLoading} iconRight={ArrowRight}>
                                Create Account
                            </Button>
                        </form>

                        <p className="mt-8 text-center text-sm text-text-secondary">
                            Already have an account?{' '}
                            <Link to="/login" className="text-royal-400 hover:text-royal-300 font-medium transition-colors">Sign In</Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;
