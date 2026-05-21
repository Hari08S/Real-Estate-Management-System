import { Helmet } from 'react-helmet-async';

const defaults = {
    siteName: 'SquareFeet X',
    titleTemplate: '%s | SquareFeet X',
    description: 'Every Square Foot. Zero Commission. Commission-free real estate platform with manager-verified listings.',
    image: '/og-image.jpg',
    url: 'https://squarefeetx.com',
};

const SEOHead = ({
    title,
    description = defaults.description,
    noindex = false,
    canonical,
    image = defaults.image,
    type = 'website',
}) => {
    const fullTitle = title ? `${title} | ${defaults.siteName}` : defaults.siteName;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}
            {canonical && <link rel="canonical" href={canonical} />}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={defaults.siteName} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default SEOHead;
