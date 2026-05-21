const { MongoClient } = require('mongodb');

const MANI_ID   = '7a55e975-edde-4597-b98a-9ff567834966';
const NAVEEN_ID = '38c0eda3-13e3-44a4-a763-efba53b3aa08';

async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('test');

        console.log('=== Updating test.properties with real seller IDs ===\n');

        // SALE + LEASE listings → Mani (previously 'u2')
        const maniSaleResult = await db.collection('properties').updateMany(
            { listingType: { $in: ['SALE', 'LEASE'] }, sellerId: { $in: ['u2', 'u1'] } },
            { $set: { 
                sellerId: MANI_ID,
                'sellerContact.name': 'Mani',
                'sellerContact.email': 'mani@gmail.com',
                'sellerContact.phone': '+91 98765 43210'
            }}
        );
        console.log(`✅ Updated ${maniSaleResult.modifiedCount} SALE/LEASE properties → Mani (${MANI_ID})`);

        // RENT listings → Naveen (previously 'u2')
        const naveenResult = await db.collection('properties').updateMany(
            { listingType: 'RENT', sellerId: { $in: ['u2', 'u1'] } },
            { $set: { 
                sellerId: NAVEEN_ID,
                'sellerContact.name': 'Naveen',
                'sellerContact.email': 'naveen@gmail.com',
                'sellerContact.phone': '+91 87654 32109'
            }}
        );
        console.log(`✅ Updated ${naveenResult.modifiedCount} RENT properties → Naveen (${NAVEEN_ID})`);

        // Verify
        console.log('\n=== After update ===');
        const all = await db.collection('properties').find({}, { projection: { title: 1, sellerId: 1, listingType: 1 } }).toArray();
        all.forEach(p => console.log(` - ${p.title} | ${p.listingType} | sellerId: ${p.sellerId}`));

    } finally {
        await client.close();
    }
}

run().catch(console.error);
