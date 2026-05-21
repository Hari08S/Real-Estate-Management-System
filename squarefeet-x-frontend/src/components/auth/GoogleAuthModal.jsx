import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Check, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { motion } from 'framer-motion';

const GoogleAuthModal = ({ isOpen, onClose, onLogin }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('Google User');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setEmail('');
            setPassword('');
        }
    }, [isOpen]);

    const handleNext = () => {
        if (!email.includes('@')) return;
        setStep(2);
    };

    const handleFinalize = async () => {
        setIsLoading(true);
        // Simulate a small delay for "Google" to verify
        setTimeout(() => {
            onLogin({ email, name });
            setIsLoading(false);
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden text-slate-900"
                >
                    {/* Google Header */}
                    <div className="p-8 pb-4 text-center">
                        <div className="flex justify-center mb-4">
                            <svg className="w-12 h-12" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold mb-1">Sign in</h2>
                        <p className="text-slate-600">to continue to SquareFeet X</p>
                    </div>

                    <div className="p-8 pt-4">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email or phone"
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">
                                        Forgot email?
                                    </div>
                                    <div className="text-sm text-slate-500 pt-4 leading-relaxed">
                                        Not your computer? Use Guest mode to sign in privately.{' '}
                                        <span className="text-blue-600 font-medium cursor-pointer hover:underline">Learn more</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-8">
                                        <button className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded-md transition-colors">
                                            Create account
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full w-fit mb-6">
                                        <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden">
                                            <span className="text-[10px] font-bold text-slate-600">G</span>
                                        </div>
                                        <span className="text-sm text-slate-700">{email}</span>
                                    </div>
                                    
                                    <h3 className="text-xl font-medium mb-4">Welcome</h3>

                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input type="checkbox" id="show-pass" className="w-4 h-4 rounded" />
                                        <label htmlFor="show-pass" className="text-sm text-slate-700 cursor-pointer">Show password</label>
                                    </div>

                                    <div className="flex justify-between items-center pt-12">
                                        <button 
                                            onClick={() => setStep(1)}
                                            className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleFinalize}
                                            disabled={isLoading}
                                            className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                'Next'
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Links */}
                    <div className="p-4 flex justify-between text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
                        <div className="flex gap-4">
                            <span className="hover:text-slate-700 cursor-pointer">English (United States)</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="hover:text-slate-700 cursor-pointer">Help</span>
                            <span className="hover:text-slate-700 cursor-pointer">Privacy</span>
                            <span className="hover:text-slate-700 cursor-pointer">Terms</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GoogleAuthModal;
