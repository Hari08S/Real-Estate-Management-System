// Direct MongoDB seed script - inserts sample data into the RMS database
// Run with: node seed_mongodb.js

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'RMS';

async function seed() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(DB_NAME);

        // ── 1. Seed Properties ──────────────────────────────────────
        const propertiesCol = db.collection('properties');
        await propertiesCol.deleteMany({});

        const properties = [
            {
                title: "Luxury 3BHK in Banjara Hills",
                description: "Spacious 3BHK apartment with modern amenities, swimming pool, gym, and 24/7 security. Located in the heart of Banjara Hills with excellent connectivity to IT hubs and shopping centers.",
                propertyType: "apartment",
                listingType: "SALE",
                price: 12500000,
                monthlyRent: null,
                securityDeposit: null,
                leaseAmount: null,
                leaseDurationYears: null,
                refundableDeposit: null,
                leaseConditions: null,
                leaseDurationMonths: null,
                availableFrom: null,
                petFriendly: true,
                maintenanceIncluded: false,
                bedrooms: 3,
                bathrooms: 3,
                area: 1850,
                status: "APPROVED",
                sellerId: "seller-001",
                managerId: "manager-001",
                location: {
                    address: "Road No. 12, Banjara Hills",
                    city: "Hyderabad",
                    state: "Telangana",
                    pincode: "500034",
                    lat: 17.4156,
                    lng: 78.4347
                },
                images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
                views: 142,
                unlockCount: 8,
                buyerPercent: 68,
                avgTimeOnPage: 125,
                unlockFee: 499.0,
                rejectionReason: null,
                statusTimestamps: {
                    "PENDING": new Date("2026-04-15T10:00:00"),
                    "APPROVED": new Date("2026-04-16T14:30:00")
                },
                sellerContact: {
                    name: "Priya Sharma",
                    phone: "+91 87654 32109",
                    email: "priya@example.com"
                },
                createdAt: new Date("2026-04-15T10:00:00")
            },
            {
                title: "Modern Villa with Garden in Jubilee Hills",
                description: "Beautiful 4BHK independent villa with a lush garden, private parking for 3 cars, and a dedicated home office space. Premium gated community with clubhouse.",
                propertyType: "villa",
                listingType: "SALE",
                price: 35000000,
                monthlyRent: null,
                securityDeposit: null,
                leaseAmount: null,
                leaseDurationYears: null,
                refundableDeposit: null,
                leaseConditions: null,
                leaseDurationMonths: null,
                availableFrom: null,
                petFriendly: true,
                maintenanceIncluded: true,
                bedrooms: 4,
                bathrooms: 4,
                area: 3200,
                status: "APPROVED",
                sellerId: "seller-001",
                managerId: "manager-001",
                location: {
                    address: "Film Nagar, Jubilee Hills",
                    city: "Hyderabad",
                    state: "Telangana",
                    pincode: "500033",
                    lat: 17.4239,
                    lng: 78.4069
                },
                images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"],
                views: 256,
                unlockCount: 15,
                buyerPercent: 74,
                avgTimeOnPage: 195,
                unlockFee: 999.0,
                rejectionReason: null,
                statusTimestamps: {
                    "PENDING": new Date("2026-04-12T09:00:00"),
                    "APPROVED": new Date("2026-04-13T11:00:00")
                },
                sellerContact: {
                    name: "Priya Sharma",
                    phone: "+91 87654 32109",
                    email: "priya@example.com"
                },
                createdAt: new Date("2026-04-12T09:00:00")
            },
            {
                title: "Cozy 2BHK for Rent in Gachibowli",
                description: "Well-maintained 2BHK apartment in a gated community near IT corridor. Fully furnished with air conditioning, washing machine, and modular kitchen. Walking distance to DLF Cyber City.",
                propertyType: "apartment",
                listingType: "RENT",
                price: null,
                monthlyRent: 28000,
                securityDeposit: 100000,
                leaseAmount: null,
                leaseDurationYears: null,
                refundableDeposit: null,
                leaseConditions: null,
                leaseDurationMonths: null,
                availableFrom: "2026-06-01",
                petFriendly: false,
                maintenanceIncluded: true,
                bedrooms: 2,
                bathrooms: 2,
                area: 1100,
                status: "APPROVED",
                sellerId: "seller-002",
                managerId: "manager-001",
                location: {
                    address: "Nanakramguda Road, Gachibowli",
                    city: "Hyderabad",
                    state: "Telangana",
                    pincode: "500032",
                    lat: 17.4400,
                    lng: 78.3489
                },
                images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
                views: 89,
                unlockCount: 4,
                buyerPercent: 58,
                avgTimeOnPage: 92,
                unlockFee: 299.0,
                rejectionReason: null,
                statusTimestamps: {
                    "PENDING": new Date("2026-04-20T08:00:00"),
                    "APPROVED": new Date("2026-04-21T16:00:00")
                },
                sellerContact: {
                    name: "Amit Kumar",
                    phone: "+91 98765 43210",
                    email: "amit@example.com"
                },
                createdAt: new Date("2026-04-20T08:00:00")
            },
            {
                title: "Commercial Space for Lease in HITEC City",
                description: "Prime commercial office space on the 8th floor with panoramic city views. Ready-to-move-in with workstations for 50 people, conference rooms, and pantry. 24/7 power backup.",
                propertyType: "commercial",
                listingType: "LEASE",
                price: null,
                monthlyRent: null,
                securityDeposit: null,
                leaseAmount: 5000000,
                leaseDurationYears: 5,
                refundableDeposit: 1500000,
                leaseConditions: "No sub-leasing allowed. Annual rent escalation of 5%.",
                leaseDurationMonths: 60,
                availableFrom: "2026-07-01",
                petFriendly: false,
                maintenanceIncluded: true,
                bedrooms: 0,
                bathrooms: 4,
                area: 5000,
                status: "PENDING",
                sellerId: "seller-003",
                managerId: null,
                location: {
                    address: "Cyber Towers, HITEC City",
                    city: "Hyderabad",
                    state: "Telangana",
                    pincode: "500081",
                    lat: 17.4486,
                    lng: 78.3772
                },
                images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"],
                views: 34,
                unlockCount: 0,
                buyerPercent: 45,
                avgTimeOnPage: 60,
                unlockFee: 1499.0,
                rejectionReason: null,
                statusTimestamps: {
                    "PENDING": new Date("2026-05-10T12:00:00")
                },
                sellerContact: {
                    name: "Rajesh Reddy",
                    phone: "+91 77777 88888",
                    email: "rajesh@example.com"
                },
                createdAt: new Date("2026-05-10T12:00:00")
            },
            {
                title: "Penthouse with Terrace in Kondapur",
                description: "Stunning 3BHK penthouse with a private terrace garden spanning 800 sqft. Italian marble flooring, smart home automation, and a private elevator. Premium locality with top schools nearby.",
                propertyType: "apartment",
                listingType: "SALE",
                price: 22000000,
                monthlyRent: null,
                securityDeposit: null,
                leaseAmount: null,
                leaseDurationYears: null,
                refundableDeposit: null,
                leaseConditions: null,
                leaseDurationMonths: null,
                availableFrom: null,
                petFriendly: true,
                maintenanceIncluded: false,
                bedrooms: 3,
                bathrooms: 3,
                area: 2400,
                status: "APPROVED",
                sellerId: "seller-001",
                managerId: "manager-001",
                location: {
                    address: "Botanical Garden Road, Kondapur",
                    city: "Hyderabad",
                    state: "Telangana",
                    pincode: "500084",
                    lat: 17.4625,
                    lng: 78.3522
                },
                images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"],
                views: 312,
                unlockCount: 22,
                buyerPercent: 82,
                avgTimeOnPage: 245,
                unlockFee: 799.0,
                rejectionReason: null,
                statusTimestamps: {
                    "PENDING": new Date("2026-04-05T07:00:00"),
                    "APPROVED": new Date("2026-04-06T10:00:00")
                },
                sellerContact: {
                    name: "Priya Sharma",
                    phone: "+91 87654 32109",
                    email: "priya@example.com"
                },
                createdAt: new Date("2026-04-05T07:00:00")
            },
            {
                title: "Budget 1BHK near HITEC City",
                description: "Compact 1BHK ideal for working professionals. Close to HITEC City IT hub with excellent public transport connectivity. Includes covered car parking.",
                propertyType: "apartment",
                listingType: "RENT",
                monthlyRent: 14000,
                securityDeposit: 50000,
                leaseAmount: null,
                leaseDurationYears: null,
                refundableDeposit: null,
                leaseConditions: null,
                leaseDurationMonths: null,
                availableFrom: "2026-02-10",
                petFriendly: true,
                maintenanceIncluded: true,
                bedrooms: 1,
                bathrooms: 1,
                area: 650,
                status: "APPROVED",
                sellerId: "seller-002",
                managerId: "manager-001",
                location: {
                    address: "Kukatpally Housing Board",
                    city: "Hyderabad",
                    state: "Telangana",
                    pincode: "500072",
                    lat: 17.4850,
                    lng: 78.4100
                },
                images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800","https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800"],
                views: 410,
                unlockCount: 30,
                buyerPercent: 78,
                avgTimeOnPage: 115,
                unlockFee: 99.0,
                rejectionReason: null,
                statusTimestamps: {
                    "PENDING": new Date("2026-02-08T10:00:00"),
                    "APPROVED": new Date("2026-02-10T14:30:00")
                },
                sellerContact: {
                    name: "Amit Kumar",
                    phone: "+91 98765 43210",
                    email: "amit@example.com"
                },
                createdAt: new Date("2026-02-10T10:00:00")
            },
            {
                title: "Studio Apartment in Indiranagar, Bangalore",
                description: "Trendy studio apartment in the heart of Indiranagar. Walking distance to 100 Feet Road restaurants and pubs. Fully furnished with smart TV and high-speed WiFi.",
                propertyType: "apartment",
                listingType: "RENT",
                monthlyRent: 22000,
                securityDeposit: 80000,
                leaseAmount: null,
                leaseDurationYears: null,
                refundableDeposit: null,
                leaseConditions: null,
                leaseDurationMonths: null,
                availableFrom: "2026-03-01",
                petFriendly: true,
                maintenanceIncluded: true,
                bedrooms: 1,
                bathrooms: 1,
                area: 550,
                status: "APPROVED",
                sellerId: "seller-002",
                managerId: "manager-001",
                location: {
                    address: "12th Main, Indiranagar",
                    city: "Bangalore",
                    state: "Karnataka",
                    pincode: "560038",
                    lat: 12.9784,
                    lng: 77.6408
                },
                images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
                views: 520,
                unlockCount: 35,
                buyerPercent: 80,
                avgTimeOnPage: 125,
                unlockFee: 149.0,
                rejectionReason: null,
                statusTimestamps: {
                    "PENDING": new Date("2026-02-27T10:00:00"),
                    "APPROVED": new Date("2026-03-01T14:30:00")
                },
                sellerContact: {
                    name: "Amit Kumar",
                    phone: "+91 98765 43210",
                    email: "amit@example.com"
                },
                createdAt: new Date("2026-03-01T10:00:00")
            }
        ];

        const propResult = await propertiesCol.insertMany(properties);
        console.log(`✅ Inserted ${propResult.insertedCount} properties`);

        // ── 2. Seed Conversations ───────────────────────────────────
        const conversationsCol = db.collection('conversations');
        await conversationsCol.deleteMany({});

        const conversations = [
            {
                participants: ["seller-001", "buyer-001"],
                propertyId: Object.values(propResult.insertedIds)[0].toString(),
                propertyTitle: "Luxury 3BHK in Banjara Hills",
                lastMessage: "Is the price negotiable?",
                lastMessageAt: new Date("2026-05-17T14:30:00"),
                unreadCounts: { "seller-001": 1, "buyer-001": 0 },
                createdAt: new Date("2026-05-15T10:00:00")
            },
            {
                participants: ["seller-002", "buyer-002"],
                propertyId: Object.values(propResult.insertedIds)[2].toString(),
                propertyTitle: "Cozy 2BHK for Rent in Gachibowli",
                lastMessage: "Can I schedule a visit this weekend?",
                lastMessageAt: new Date("2026-05-16T18:00:00"),
                unreadCounts: { "seller-002": 1, "buyer-002": 0 },
                createdAt: new Date("2026-05-14T09:00:00")
            },
            {
                participants: ["seller-001", "buyer-003"],
                propertyId: Object.values(propResult.insertedIds)[4].toString(),
                propertyTitle: "Penthouse with Terrace in Kondapur",
                lastMessage: "Thank you for the details. I will get back to you.",
                lastMessageAt: new Date("2026-05-18T09:00:00"),
                unreadCounts: { "seller-001": 0, "buyer-003": 0 },
                createdAt: new Date("2026-05-16T11:00:00")
            }
        ];

        const convResult = await conversationsCol.insertMany(conversations);
        console.log(`✅ Inserted ${convResult.insertedCount} conversations`);

        // ── 3. Seed Messages ────────────────────────────────────────
        const messagesCol = db.collection('messages');
        await messagesCol.deleteMany({});

        const convIds = Object.values(convResult.insertedIds);
        const messages = [
            // Conversation 1 messages
            { conversationId: convIds[0].toString(), senderId: "buyer-001", content: "Hi, I'm interested in the 3BHK in Banjara Hills. Is it still available?", createdAt: new Date("2026-05-15T10:00:00") },
            { conversationId: convIds[0].toString(), senderId: "seller-001", content: "Yes, it's available! Would you like to schedule a visit?", createdAt: new Date("2026-05-15T10:15:00") },
            { conversationId: convIds[0].toString(), senderId: "buyer-001", content: "Sure, how about this Saturday at 11 AM?", createdAt: new Date("2026-05-15T10:30:00") },
            { conversationId: convIds[0].toString(), senderId: "seller-001", content: "Saturday works. I'll send you the exact directions.", createdAt: new Date("2026-05-15T11:00:00") },
            { conversationId: convIds[0].toString(), senderId: "buyer-001", content: "Is the price negotiable?", createdAt: new Date("2026-05-17T14:30:00") },
            // Conversation 2 messages
            { conversationId: convIds[1].toString(), senderId: "buyer-002", content: "Hello, is the 2BHK in Gachibowli still available for rent?", createdAt: new Date("2026-05-14T09:00:00") },
            { conversationId: convIds[1].toString(), senderId: "seller-002", content: "Yes! It's available from June 1st. Fully furnished.", createdAt: new Date("2026-05-14T09:20:00") },
            { conversationId: convIds[1].toString(), senderId: "buyer-002", content: "Can I schedule a visit this weekend?", createdAt: new Date("2026-05-16T18:00:00") },
            // Conversation 3 messages
            { conversationId: convIds[2].toString(), senderId: "buyer-003", content: "The penthouse looks amazing! Can you share more photos?", createdAt: new Date("2026-05-16T11:00:00") },
            { conversationId: convIds[2].toString(), senderId: "seller-001", content: "Of course! I'll share a video walkthrough as well. The terrace garden is the highlight.", createdAt: new Date("2026-05-16T11:30:00") },
            { conversationId: convIds[2].toString(), senderId: "buyer-003", content: "Thank you for the details. I will get back to you.", createdAt: new Date("2026-05-18T09:00:00") },
        ];

        const msgResult = await messagesCol.insertMany(messages);
        console.log(`✅ Inserted ${msgResult.insertedCount} messages`);

        // ── 4. Seed Audit Logs ──────────────────────────────────────
        const auditLogsCol = db.collection('audit_logs');
        await auditLogsCol.deleteMany({});

        const auditLogs = [
            { action: "PROPERTY_APPROVED", userId: "admin-001", details: "Approved property: Luxury 3BHK in Banjara Hills", createdAt: new Date("2026-04-16T14:30:00") },
            { action: "PROPERTY_APPROVED", userId: "admin-001", details: "Approved property: Modern Villa with Garden in Jubilee Hills", createdAt: new Date("2026-04-13T11:00:00") },
            { action: "PROPERTY_APPROVED", userId: "admin-001", details: "Approved property: Cozy 2BHK for Rent in Gachibowli", createdAt: new Date("2026-04-21T16:00:00") },
            { action: "PROPERTY_APPROVED", userId: "admin-001", details: "Approved property: Penthouse with Terrace in Kondapur", createdAt: new Date("2026-04-06T10:00:00") },
            { action: "USER_ROLE_UPDATED", userId: "admin-001", details: "Updated role for manager@example.com to MANAGER", createdAt: new Date("2026-04-10T08:00:00") },
            { action: "MANAGER_ASSIGNED", userId: "admin-001", details: "Assigned manager-001 to Hyderabad region", createdAt: new Date("2026-04-10T08:15:00") },
            { action: "PROPERTY_REJECTED", userId: "admin-001", details: "Rejected property: Warehouse in Secunderabad - Incomplete documentation", createdAt: new Date("2026-05-01T09:00:00") },
        ];

        const auditResult = await auditLogsCol.insertMany(auditLogs);
        console.log(`✅ Inserted ${auditResult.insertedCount} audit logs`);

        console.log('\n🎉 Seed complete! MongoDB RMS database now has:');
        console.log(`   • ${await propertiesCol.countDocuments()} properties`);
        console.log(`   • ${await conversationsCol.countDocuments()} conversations`);
        console.log(`   • ${await messagesCol.countDocuments()} messages`);
        console.log(`   • ${await auditLogsCol.countDocuments()} audit logs`);

    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

seed();
