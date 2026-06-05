import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname, hash, search } = useLocation();

    useEffect(() => {
        if (hash) {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Wait slightly for DOM to render in case of page transition
                const timer = setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 150);
                return () => clearTimeout(timer);
            }
        } else {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant'
            });
        }
    }, [pathname, hash, search]);

    return null;
};

export default ScrollToTop;
