import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8090/api',
    withCredentials: true,
});

async function run() {
    try {
        console.log("Logging in as priya...");
        const loginRes = await api.post('/auth/login', { email: 'priya@example.com', password: 'password123' });
        const cookie = loginRes.headers['set-cookie'][0];
        console.log("Got cookie:", cookie.substring(0, 30));

        console.log("Creating property...");
        const prop = {
            title: "Luxury 3BHK in Banjara Hills",
            description: "Spacious 3BHK apartment with modern amenities, swimming pool, gym, and 24/7 security. Located in the heart of Banjara Hills with excellent connectivity to IT hubs and shopping centers.",
            propertyType: "apartment",
            listingType: "SALE",
            price: 12500000,
            bedrooms: 3,
            bathrooms: 3,
            area: 1850,
            location: { address: "Road No. 12, Banjara Hills", city: "Hyderabad", state: "Telangana", pincode: "500034" },
            images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"]
        };
        const propRes = await api.post('/properties', prop, { headers: { Cookie: cookie } });
        console.log("Property created:", propRes.data.id);

        console.log("Logging in as admin...");
        const adminRes = await api.post('/auth/login', { email: 'admin@example.com', password: 'admin123' });
        const adminCookie = adminRes.headers['set-cookie'][0];

        console.log("Approving property...");
        await api.put(`/admin/properties/${propRes.data.id}/status`, { status: 'APPROVED' }, { headers: { Cookie: adminCookie } });
        console.log("Property approved!");
        
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
run();
