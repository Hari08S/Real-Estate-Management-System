import { classNames } from '../../utils';

const variants = {
    default: 'bg-surface-hover text-text-secondary',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    royal: 'bg-royal-500/15 text-royal-400 border border-royal-500/30',
    gold: 'bg-gold-500/15 text-gold-400 border border-gold-500/30',
};

const Badge = ({ children, variant = 'default', className = '', dot = false }) => {
    return (
        <span
            className={classNames(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                variants[variant],
                className
            )}
        >
            {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            {children}
        </span>
    );
};

export default Badge;
