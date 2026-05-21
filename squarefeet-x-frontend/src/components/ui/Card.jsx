import { classNames } from '../../utils';

const Card = ({ children, className = '', hover = false, glow = false, padding = true, ...props }) => {
    return (
        <div
            className={classNames(
                'glass-card',
                padding && 'p-6',
                hover && 'glass-card-hover transition-all duration-300 cursor-pointer',
                glow && 'animate-glow',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
