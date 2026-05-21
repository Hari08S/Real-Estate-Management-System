const { MongoClient } = require('mongodb');

const MANI_ID   = '7a55e975-edde-4597-b98a-9ff567834966';  // Mani (SELLER) from Oracle
const NAVEEN_ID = '38c0eda3-13e3-44a4-a763-efba53b3aa08';  // Naveen (RENTAL_OWNER) from Oracle

async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('RMS');
        const col = db.collection('properties');

        // Show current state
        const all = await col.find({}, { projection: { title: 1, sellerId: 1, listingType: 1 } }).toArray();
        console.log('Current properties:');
        all.forEach(p => console.log(` - ${p.title} | sellerId: ${p.sellerId} | type: ${p.listingType}`));

        // SALE / LEASE listings → Mani
        const maniResult = await col.updateMany(
            { listingType: { $in: ['SALE', 'LEASE'] } },
            { $set: { sellerId: MANI_ID, 'sellerContact.name': 'Mani', 'sellerContact.email': 'mani@gmail.com', 'sellerContact.phone': '+91 98765 43210' } }
        );
        console.log(`\n✅ Updated ${maniResult.modifiedCount} SALE/LEASE properties → Mani`);

        // RENT listings → Naveen
        const naveenResult = await col.updateMany(
            { listingType: 'RENT' },
            { $set: { sellerId: NAVEEN_ID, 'sellerContact.name': 'Naveen', 'sellerContact.email': 'naveen@gmail.com', 'sellerContact.phone': '+91 87654 32109' } }
        );
        console.log(`✅ Updated ${naveenResult.modifiedCount} RENT properties → Naveen`);

        // Verify
        console.log('\nAfter update:');
        const updated = await col.find({}, { projection: { title: 1, sellerId: 1, listingType: 1 } }).toArray();
        updated.forEach(p => console.log(` - ${p.title} | sellerId: ${p.sellerId} | type: ${p.listingType}`));

    } catch(err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}
run();
