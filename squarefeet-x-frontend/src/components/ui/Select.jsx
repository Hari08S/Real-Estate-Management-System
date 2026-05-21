import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { classNames } from '../../utils';

const Select = forwardRef(({
    label,
    error,
    options = [],
    placeholder = 'Select...',
    className = '',
    ...props
}, ref) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-text-secondary">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    className={classNames(
                        'w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary',
                        'appearance-none cursor-pointer',
                        'focus:outline-none focus:ring-2 focus:ring-royal-500/50 focus:border-royal-500',
                        'transition-all duration-200',
                        error && 'border-red-500',
                        className
                    )}
                    {...props}
                >
                    <option value="" className="bg-surface-card">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-surface-card">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
});

Select.displayName = 'Select';
export default Select;
