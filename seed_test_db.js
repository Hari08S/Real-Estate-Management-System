const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

const properties = [
    {
        title: "Luxury 3BHK in Banjara Hills",
        description: "Spacious 3BHK apartment with modern amenities, swimming pool, gym, and 24/7 security. Located in the heart of Banjara Hills with excellent connectivity to IT hubs and shopping centers. Italian marble flooring, modular kitchen with chimney, and large balconies with city views.",
        propertyType: "apartment", listingType: "SALE", price: 12500000,
        bedrooms: 3, bathrooms: 3, area: 1850, status: "APPROVED", sellerId: "u2",
        location: { address: "Road No. 12, Banjara Hills", city: "Hyderabad", state: "Telangana", pincode: "500034" },
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"],
        unlockFee: 499, views: 245, unlockCount: 12, createdAt: new Date("2025-12-01"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2025-11-28"), APPROVED: new Date("2025-12-01") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Modern Villa with Garden in Jubilee Hills",
        description: "Beautiful 4BHK independent villa with a lush garden, private parking for 3 cars, and a dedicated home office space. Smart home automation, solar panels, and rainwater harvesting.",
        propertyType: "villa", listingType: "SALE", price: 35000000,
        bedrooms: 4, bathrooms: 4, area: 3200, status: "APPROVED", sellerId: "u2",
        location: { address: "Film Nagar, Jubilee Hills", city: "Hyderabad", state: "Telangana", pincode: "500033" },
        images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"],
        unlockFee: 999, views: 189, unlockCount: 8, createdAt: new Date("2025-11-20"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2025-11-18"), APPROVED: new Date("2025-11-20") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Cozy 2BHK for Rent in Gachibowli",
        description: "Well-maintained 2BHK apartment in a gated community near IT corridor. Fully furnished with air conditioning, washing machine, and modular kitchen. Walking distance to DLF Cyber City.",
        propertyType: "apartment", listingType: "RENT", monthlyRent: 28000, securityDeposit: 100000,
        bedrooms: 2, bathrooms: 2, area: 1100, status: "APPROVED", sellerId: "u2",
        location: { address: "Nanakramguda Road, Gachibowli", city: "Hyderabad", state: "Telangana", pincode: "500032" },
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
        unlockFee: 199, views: 320, unlockCount: 22, createdAt: new Date("2026-01-05"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2026-01-03"), APPROVED: new Date("2026-01-05") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Premium Penthouse in Madhapur",
        description: "Exclusive penthouse with panoramic city views, private terrace with jacuzzi, and premium interiors. Home theater, wine cellar, and designer lighting throughout.",
        propertyType: "penthouse", listingType: "SALE", price: 45000000,
        bedrooms: 5, bathrooms: 5, area: 4500, status: "APPROVED", sellerId: "u2",
        location: { address: "Hitec City Main Road, Madhapur", city: "Hyderabad", state: "Telangana", pincode: "500081" },
        images: ["https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800","https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800"],
        unlockFee: 1499, views: 156, unlockCount: 5, createdAt: new Date("2026-01-10"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2026-01-08"), APPROVED: new Date("2026-01-10") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Commercial Space in Financial District",
        description: "Prime commercial office space suitable for IT companies and startups. Open floor plan with fiber optic connectivity, power backup, and ample parking.",
        propertyType: "commercial", listingType: "LEASE", price: 5000000, leaseAmount: 5000000, leaseDurationYears: 5, refundableDeposit: 1500000,
        bedrooms: 0, bathrooms: 4, area: 5000, status: "APPROVED", sellerId: "u2",
        location: { address: "Financial District", city: "Hyderabad", state: "Telangana", pincode: "500032" },
        images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800","https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800"],
        unlockFee: 999, views: 98, unlockCount: 3, createdAt: new Date("2026-01-15"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2026-01-13"), APPROVED: new Date("2026-01-15") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Spacious 3BHK in Kondapur",
        description: "Newly constructed 3BHK in a premium gated community with clubhouse, swimming pool, and gym. East-facing with excellent ventilation and natural light.",
        propertyType: "apartment", listingType: "SALE", price: 9500000,
        bedrooms: 3, bathrooms: 2, area: 1600, status: "PENDING", sellerId: "u1",
        location: { address: "Botanical Garden Road, Kondapur", city: "Hyderabad", state: "Telangana", pincode: "500084" },
        images: ["https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800"],
        unlockFee: 399, views: 45, unlockCount: 0, createdAt: new Date("2026-02-01"),
        sellerContact: { name: "Hari Kumar", phone: "+91 98765 43210", email: "hari@example.com" },
        statusTimestamps: { PENDING: new Date("2026-02-01") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Farmhouse with Pool in Shamshabad",
        description: "Beautiful farmhouse spread over 2 acres with swimming pool, organic farm, and guest cottages. Perfect weekend retreat near the airport.",
        propertyType: "farmhouse", listingType: "SALE", price: 28000000,
        bedrooms: 4, bathrooms: 3, area: 6000, status: "APPROVED", sellerId: "u2",
        location: { address: "Shamshabad", city: "Hyderabad", state: "Telangana", pincode: "501218" },
        images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
        unlockFee: 799, views: 210, unlockCount: 9, createdAt: new Date("2026-01-20"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2026-01-18"), APPROVED: new Date("2026-01-20") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Budget 1BHK near HITEC City",
        description: "Compact 1BHK ideal for working professionals. Close to HITEC City IT hub with excellent public transport connectivity. Includes covered car parking.",
        propertyType: "apartment", listingType: "RENT", monthlyRent: 14000, securityDeposit: 50000,
        bedrooms: 1, bathrooms: 1, area: 650, status: "APPROVED", sellerId: "u2",
        location: { address: "Kukatpally Housing Board", city: "Hyderabad", state: "Telangana", pincode: "500072" },
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800","https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800"],
        unlockFee: 99, views: 410, unlockCount: 30, createdAt: new Date("2026-02-10"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2026-02-08"), APPROVED: new Date("2026-02-10") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Elegant 4BHK Duplex in Kokapet",
        description: "Stunning duplex villa in the fast-growing Kokapet area. Double-height living room, private garden, modular kitchen with imported fittings.",
        propertyType: "villa", listingType: "SALE", price: 22000000,
        bedrooms: 4, bathrooms: 4, area: 2800, status: "APPROVED", sellerId: "u2",
        location: { address: "Kokapet Main Road", city: "Hyderabad", state: "Telangana", pincode: "500075" },
        images: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"],
        unlockFee: 799, views: 175, unlockCount: 7, createdAt: new Date("2026-02-15"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2026-02-13"), APPROVED: new Date("2026-02-15") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Sea-View 2BHK in Vizag Beach Road",
        description: "Wake up to ocean views! Premium 2BHK apartment with floor-to-ceiling windows facing the Bay of Bengal. Gated community with infinity pool.",
        propertyType: "apartment", listingType: "SALE", price: 8500000,
        bedrooms: 2, bathrooms: 2, area: 1250, status: "APPROVED", sellerId: "u1",
        location: { address: "Beach Road, RK Beach", city: "Visakhapatnam", state: "Andhra Pradesh", pincode: "530002" },
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800","https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800"],
        unlockFee: 399, views: 312, unlockCount: 15, createdAt: new Date("2026-02-20"),
        sellerContact: { name: "Hari Kumar", phone: "+91 98765 43210", email: "hari@example.com" },
        statusTimestamps: { PENDING: new Date("2026-02-18"), APPROVED: new Date("2026-02-20") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Studio Apartment in Indiranagar, Bangalore",
        description: "Trendy studio apartment in the heart of Indiranagar. Walking distance to 100 Feet Road restaurants and pubs. Fully furnished with smart TV and high-speed WiFi.",
        propertyType: "apartment", listingType: "RENT", monthlyRent: 22000, securityDeposit: 80000,
        bedrooms: 1, bathrooms: 1, area: 550, status: "APPROVED", sellerId: "u2",
        location: { address: "12th Main, Indiranagar", city: "Bangalore", state: "Karnataka", pincode: "560038" },
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
        unlockFee: 149, views: 520, unlockCount: 35, createdAt: new Date("2026-03-01"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2026-02-27"), APPROVED: new Date("2026-03-01") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Independent House with Terrace in Secunderabad",
        description: "Charming 3BHK independent house with a large terrace garden. Ground + 1 floor, car parking for 2, covered sit-out area, and separate servant quarters.",
        propertyType: "villa", listingType: "SALE", price: 15000000,
        bedrooms: 3, bathrooms: 3, area: 2200, status: "APPROVED", sellerId: "u1",
        location: { address: "West Marredpally", city: "Secunderabad", state: "Telangana", pincode: "500026" },
        images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800","https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"],
        unlockFee: 599, views: 140, unlockCount: 6, createdAt: new Date("2026-03-05"),
        sellerContact: { name: "Hari Kumar", phone: "+91 98765 43210", email: "hari@example.com" },
        statusTimestamps: { PENDING: new Date("2026-03-03"), APPROVED: new Date("2026-03-05") },
        _class: "com.squarefeetx.property.model.Property"
    },
    {
        title: "Gated Community Plot in Shamirpet",
        description: "Premium residential plot in a DTCP-approved gated community. Amenities include clubhouse, jogging track, children's play area, and 24/7 security.",
        propertyType: "plot", listingType: "SALE", price: 4500000,
        bedrooms: 0, bathrooms: 0, area: 2400, status: "APPROVED", sellerId: "u2",
        location: { address: "Shamirpet Road", city: "Hyderabad", state: "Telangana", pincode: "500078" },
        images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800","https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800"],
        unlockFee: 299, views: 88, unlockCount: 4, createdAt: new Date("2026-03-10"),
        sellerContact: { name: "Priya Sharma", phone: "+91 87654 32109", email: "priya@example.com" },
        statusTimestamps: { PENDING: new Date("2026-03-08"), APPROVED: new Date("2026-03-10") },
        _class: "com.squarefeetx.property.model.Property"
    },
];

async function seed() {
    await client.connect();
    console.log('Connected to MongoDB');

    // Seed BOTH databases so properties show up regardless of which one the service reads
    for (const dbName of ['test', 'RMS']) {
        const db = client.db(dbName);
        const col = db.collection('properties');
        await col.deleteMany({});
        const result = await col.insertMany(properties);
        console.log(`✅ ${dbName}.properties: Inserted ${result.insertedCount} properties`);
    }

    await client.close();
    console.log('\n🎉 Done! 13 properties seeded in both test and RMS databases.');
}

seed().catch(console.error);
