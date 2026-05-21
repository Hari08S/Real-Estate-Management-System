// Seeds conversations and messages into the 'test' and 'RMS' database using real Oracle DB User UUIDs
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

const HARI_BUYER_ID = '0a9653a4-5714-41e3-a1e9-ff2601a9458a';   // Hari Kumar (BUYER)
const MANI_ID = '7a55e975-edde-4597-b98a-9ff567834966';         // Mani (SELLER)
const NAVEEN_ID = '38c0eda3-13e3-44a4-a763-efba53b3aa08';       // Naveen (RENTAL_OWNER/SELLER)
const RAVI_MANAGER_ID = '501affe5-0af2-44c8-b9b8-76009c21c585'; // Ravi Menon (MANAGER)
const ADMIN_ID = 'f7b5d741-2c51-4fd8-84b0-4d76ad6093ec';         // Admin User (ADMIN)

async function seed() {
    await client.connect();
    console.log('Connected to MongoDB');

    for (const dbName of ['test', 'RMS']) {
        const db = client.db(dbName);

        // ── Conversations ─────────────────────────────────────────
        const convCol = db.collection('conversations');
        await convCol.deleteMany({});

        // Get property IDs from this DB
        const props = await db.collection('properties').find({}, { projection: { _id: 1, title: 1 } }).toArray();
        const propMap = {};
        props.forEach(p => propMap[p.title] = p._id.toString());

        const convs = [
            {
                participants: [HARI_BUYER_ID, MANI_ID],
                propertyId: propMap['Luxury 3BHK in Banjara Hills'] || '6a0d889eec5ecc716bc94e0f',
                propertyTitle: 'Luxury 3BHK in Banjara Hills',
                lastMessage: 'Is the price negotiable?',
                lastMessageAt: new Date('2026-05-17T14:30:00'),
                unreadCounts: { [MANI_ID]: 1, [HARI_BUYER_ID]: 0 },
                createdAt: new Date('2026-05-15T10:00:00')
            },
            {
                participants: [HARI_BUYER_ID, NAVEEN_ID],
                propertyId: propMap['Cozy 2BHK for Rent in Gachibowli'] || '6a0d889eec5ecc716bc94e11',
                propertyTitle: 'Cozy 2BHK for Rent in Gachibowli',
                lastMessage: 'Can I schedule a visit this weekend?',
                lastMessageAt: new Date('2026-05-16T18:00:00'),
                unreadCounts: { [NAVEEN_ID]: 1, [HARI_BUYER_ID]: 0 },
                createdAt: new Date('2026-05-14T09:00:00')
            },
            {
                participants: [HARI_BUYER_ID, RAVI_MANAGER_ID],
                propertyId: 'general',
                propertyTitle: 'Support — Hyderabad, Telangana',
                lastMessage: 'Hi, I need assistance regarding properties in Hyderabad, Telangana.',
                lastMessageAt: new Date('2026-05-18T09:00:00'),
                unreadCounts: { [RAVI_MANAGER_ID]: 0, [HARI_BUYER_ID]: 0 },
                createdAt: new Date('2026-05-16T11:00:00')
            },
            {
                participants: [RAVI_MANAGER_ID, ADMIN_ID],
                propertyId: 'admin-support',
                propertyTitle: 'Admin Support Channel',
                lastMessage: 'Hi, I need support from the admin team.',
                lastMessageAt: new Date('2026-05-19T09:00:00'),
                unreadCounts: { [ADMIN_ID]: 0, [RAVI_MANAGER_ID]: 0 },
                createdAt: new Date('2026-05-19T09:00:00')
            }
        ];

        const convResult = await convCol.insertMany(convs);
        const convIds = Object.values(convResult.insertedIds);
        console.log(`✅ ${dbName}.conversations: Inserted ${convResult.insertedCount}`);

        // ── Messages ───────────────────────────────────────────────
        const msgCol = db.collection('messages');
        await msgCol.deleteMany({});

        const messages = [
            // Conv 1 (Hari Kumar & Mani)
            { conversationId: convIds[0].toString(), senderId: HARI_BUYER_ID, content: 'Hi, I am interested in the 3BHK in Banjara Hills. Is it still available?', createdAt: new Date('2026-05-15T10:00:00') },
            { conversationId: convIds[0].toString(), senderId: MANI_ID, content: 'Yes, it is available! Would you like to schedule a visit?', createdAt: new Date('2026-05-15T10:15:00') },
            { conversationId: convIds[0].toString(), senderId: HARI_BUYER_ID, content: 'Sure, how about this Saturday at 11 AM?', createdAt: new Date('2026-05-15T10:30:00') },
            { conversationId: convIds[0].toString(), senderId: MANI_ID, content: 'Saturday works. I will send you the exact directions.', createdAt: new Date('2026-05-15T11:00:00') },
            { conversationId: convIds[0].toString(), senderId: HARI_BUYER_ID, content: 'Is the price negotiable?', createdAt: new Date('2026-05-17T14:30:00') },
            
            // Conv 2 (Hari Kumar & Naveen)
            { conversationId: convIds[1].toString(), senderId: HARI_BUYER_ID, content: 'Hello, is the 2BHK in Gachibowli still available for rent?', createdAt: new Date('2026-05-14T09:00:00') },
            { conversationId: convIds[1].toString(), senderId: NAVEEN_ID, content: 'Yes! It is available from June 1st. Fully furnished.', createdAt: new Date('2026-05-14T09:20:00') },
            { conversationId: convIds[1].toString(), senderId: HARI_BUYER_ID, content: 'Can I schedule a visit this weekend?', createdAt: new Date('2026-05-16T18:00:00') },
            
            // Conv 3 (Hari Kumar & Ravi Menon Manager)
            { conversationId: convIds[2].toString(), senderId: HARI_BUYER_ID, content: 'Hi, I need assistance regarding properties in Hyderabad, Telangana.', createdAt: new Date('2026-05-16T11:00:00') },
            
            // Conv 4 (Ravi Menon Manager & Admin)
            { conversationId: convIds[3].toString(), senderId: RAVI_MANAGER_ID, content: 'Hi, I need support from the admin team.', createdAt: new Date('2026-05-19T09:00:00') }
        ];

        const msgResult = await msgCol.insertMany(messages);
        console.log(`✅ ${dbName}.messages: Inserted ${msgResult.insertedCount}`);
    }

    await client.close();
    console.log('\n🎉 Chat data seeded with real Oracle UUIDs in both test and RMS databases!');
}

seed().catch(console.error);
