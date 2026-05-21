import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 'md', className = '' }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' };
    return <Loader2 className={`animate-spin text-royal-500 ${sizes[size]} ${className}`} />;
};

export default Spinner;
