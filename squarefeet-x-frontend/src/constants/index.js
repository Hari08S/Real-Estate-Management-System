export const ROLES = {
    BUYER: 'BUYER',
    SELLER: 'SELLER',
    RENTAL_OWNER: 'RENTAL_OWNER',
    RENTAL_SEEKER: 'RENTAL_SEEKER',
    MANAGER: 'MANAGER',
    ADMIN: 'ADMIN',
};

export const ROLE_LABELS = {
    [ROLES.BUYER]: 'Buyer',
    [ROLES.SELLER]: 'Seller',
    [ROLES.RENTAL_OWNER]: 'Rental Owner',
    [ROLES.RENTAL_SEEKER]: 'Rental Seeker',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.ADMIN]: 'Admin',
};

export const ROLE_DASHBOARD = {
    [ROLES.BUYER]: '/buyer/dashboard',
    [ROLES.SELLER]: '/seller/dashboard',
    [ROLES.RENTAL_OWNER]: '/seller/dashboard',
    [ROLES.RENTAL_SEEKER]: '/buyer/dashboard',
    [ROLES.MANAGER]: '/manager/dashboard',
    [ROLES.ADMIN]: '/admin/dashboard',
};

export const getDashboardPath = (role) => ROLE_DASHBOARD[role] || '/';

export const PROPERTY_STATUS = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    SOLD: 'SOLD',
    RENTED: 'RENTED',
    UNAVAILABLE: 'UNAVAILABLE',
    REJECTED: 'REJECTED',
};

export const PROPERTY_STATUS_LABELS = {
    [PROPERTY_STATUS.DRAFT]: 'Draft',
    [PROPERTY_STATUS.PENDING]: 'Pending Review',
    [PROPERTY_STATUS.APPROVED]: 'Approved',
    [PROPERTY_STATUS.UNDER_REVIEW]: 'Under Review',
    [PROPERTY_STATUS.SOLD]: 'Sold',
    [PROPERTY_STATUS.RENTED]: 'Rented',
    [PROPERTY_STATUS.UNAVAILABLE]: 'Unavailable',
    [PROPERTY_STATUS.REJECTED]: 'Rejected',
};

export const STATUS_FLOW = [
    PROPERTY_STATUS.DRAFT,
    PROPERTY_STATUS.PENDING,
    PROPERTY_STATUS.UNDER_REVIEW,
    PROPERTY_STATUS.APPROVED,
];

export const PROPERTY_TYPES = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'plot', label: 'Plot' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'farmhouse', label: 'Farmhouse' },
    { value: 'penthouse', label: 'Penthouse' },
];

export const LISTING_TYPES = [
    { value: 'SALE', label: 'For Sale' },
    { value: 'RENT', label: 'For Rent' },
    { value: 'LEASE', label: 'For Lease' },
];


