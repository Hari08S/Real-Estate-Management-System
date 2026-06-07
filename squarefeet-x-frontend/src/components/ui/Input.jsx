import { forwardRef, useId } from 'react';
import { classNames } from '../../utils';

const Input = forwardRef(({
    label,
    error,
    icon: Icon,
    className = '',
    type = 'text',
    id,
    ...props
}, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="w-4 h-4 text-text-muted" />
                    </div>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    type={type}
                    className={classNames(
                        'w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary',
                        'placeholder:text-text-muted',
                        'focus:outline-none focus:ring-2 focus:ring-royal-500/50 focus:border-royal-500',
                        'transition-all duration-200',
                        Icon && 'pl-10',
                        error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-400 mt-1">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
