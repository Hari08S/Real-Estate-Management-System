import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { classNames } from '../../utils';

const variants = {
    primary: 'bg-gradient-to-r from-royal-600 to-royal-500 hover:from-royal-500 hover:to-royal-400 text-white shadow-lg shadow-royal-600/25',
    secondary: 'bg-surface-card hover:bg-surface-hover text-text-primary border border-surface-border',
    outline: 'border-2 border-royal-500 text-royal-400 hover:bg-royal-500/10',
    gold: 'bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-navy-950 font-semibold shadow-lg shadow-gold-600/25',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'text-text-muted hover:text-text-primary hover:bg-surface-hover',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
    xl: 'px-9 py-4 text-lg',
};

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    icon: Icon,
    iconRight: IconRight,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={classNames(
                'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'active:scale-[0.97]',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon ? (
                <Icon className="w-4 h-4" />
            ) : null}
            {children}
            {IconRight && !isLoading && <IconRight className="w-4 h-4" />}
        </button>
    );
});

Button.displayName = 'Button';
export default Button;
