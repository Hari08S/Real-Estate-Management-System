import { Shield, Star, MessageSquare, Heart, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Calculates and displays a Buyer Credibility Score (0–100)
 * based on profile completeness, activity, and engagement.
 */
const scoreFactors = [
    { key: 'profileComplete', label: 'Profile Complete', max: 25, icon: Shield },
    { key: 'phoneVerified', label: 'Phone Verified', max: 20, icon: Phone },
    { key: 'savedProperties', label: 'Property Research', max: 20, icon: Heart },
    { key: 'inquiries', label: 'Inquiry Activity', max: 20, icon: MessageSquare },
    { key: 'accountAge', label: 'Account Seniority', max: 15, icon: Star },
];

const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Excellent', ring: 'stroke-emerald-400' };
    if (score >= 60) return { text: 'text-royal-400', bg: 'bg-royal-500', label: 'Good', ring: 'stroke-royal-400' };
    if (score >= 40) return { text: 'text-amber-400', bg: 'bg-amber-500', label: 'Fair', ring: 'stroke-amber-400' };
    return { text: 'text-red-400', bg: 'bg-red-500', label: 'Beginner', ring: 'stroke-red-400' };
};

export const BuyerCredibilityScore = ({ user, savedCount = 0, inquiryCount = 0, precalculatedScore = null, precalculatedFactors = null }) => {
    // Calculate factor scores
    const profileComplete = [user?.name, user?.email, user?.phone].filter(Boolean).length;
    const computedFactors = {
        profileComplete: Math.min(25, Math.round((profileComplete / 3) * 25)),
        phoneVerified: user?.phone ? 20 : 0,
        savedProperties: Math.min(20, savedCount * 4),
        inquiries: Math.min(20, inquiryCount * 5),
        accountAge: (() => {
            if (!user?.createdAt) return 0;
            const months = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
            return Math.min(15, Math.round(months * 2));
        })(),
    };
    const factors = precalculatedFactors || computedFactors;
    const total = precalculatedScore !== null ? precalculatedScore : Object.values(factors).reduce((s, v) => s + v, 0);
    const { text, bg, label, ring } = getScoreColor(total);

    // SVG ring
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = circumference - (total / 100) * circumference;

    const isRentalSeeker = user?.activeRole === 'RENTAL_SEEKER';

    return (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-surface-card to-surface-hover border border-surface-border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4 text-royal-400" />
                    {isRentalSeeker ? 'Rental Seeker Credibility Score' : 'Buyer Credibility Score'}
                </h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg}/20 ${text}`}>{label}</span>
            </div>

            <div className="flex items-center gap-5">
                {/* Ring */}
                <div className="relative shrink-0">
                    <svg width="88" height="88" viewBox="0 0 88 88">
                        <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor"
                            className="text-surface-border" strokeWidth="7" />
                        <circle cx="44" cy="44" r={radius} fill="none"
                            className={ring} strokeWidth="7"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDash}
                            strokeLinecap="round"
                            transform="rotate(-90 44 44)"
                            style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-display font-bold ${text}`}>{total}</span>
                        <span className="text-[9px] text-text-muted">/ 100</span>
                    </div>
                </div>

                {/* Factor bars */}
                <div className="flex-1 space-y-2">
                    {scoreFactors.map(({ key, label, max, icon: Icon }) => {
                        const val = factors[key];
                        const pct = (val / max) * 100;
                        return (
                            <div key={key}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                                        <Icon className="w-2.5 h-2.5" />{label}
                                    </span>
                                    <span className="text-[10px] font-medium text-text-secondary">{val}/{max}</span>
                                </div>
                                <div className="h-1 bg-surface-border rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${bg}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {total < 70 && (
                <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-400">
                        {!user?.phone ? 'Add your phone number to boost your score. ' : ''}
                        {savedCount < 3 ? (isRentalSeeker ? 'Save more rentals to show research activity. ' : 'Save more properties to show research activity. ') : ''}
                        Higher score → {isRentalSeeker ? 'owners' : 'sellers'} respond faster.
                    </p>
                </div>
            )}
            {total >= 70 && (
                <div className="mt-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-emerald-400">
                        Great score! {isRentalSeeker ? 'Owners' : 'Sellers'} are more likely to respond to your inquiries quickly.
                    </p>
                </div>
            )}
        </div>
    );
};
