import { getInitials } from '../../utils';

const Avatar = ({ src, name, size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-lg',
        xl: 'w-20 h-20 text-2xl',
    };

    if (src) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={`${sizes[size]} rounded-full object-cover border-2 border-royal-500/30 ${className}`}
            />
        );
    }

    return (
        <div
            className={`${sizes[size]} rounded-full bg-gradient-to-br from-royal-600 to-navy-700 flex items-center justify-center font-display font-semibold text-white border-2 border-royal-500/30 ${className}`}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;
