const { MongoClient } = require('mongodb');

const MANI_ID   = '7a55e975-edde-4597-b98a-9ff567834966';
const NAVEEN_ID = '38c0eda3-13e3-44a4-a763-efba53b3aa08';

async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        
        // Check RMS database
        const rmsDb = client.db('RMS');
        console.log('=== RMS Database ===');
        const maniProps = await rmsDb.collection('properties').find({ sellerId: MANI_ID }).toArray();
        console.log(`Mani properties in RMS: ${maniProps.length}`);
        maniProps.forEach(p => console.log(` - ${p.title} | status: ${p.status}`));

        const naveenProps = await rmsDb.collection('properties').find({ sellerId: NAVEEN_ID }).toArray();
        console.log(`Naveen properties in RMS: ${naveenProps.length}`);
        naveenProps.forEach(p => console.log(` - ${p.title} | status: ${p.status}`));

        // Check all properties and their sellerIds
        console.log('\n=== ALL properties in RMS ===');
        const all = await rmsDb.collection('properties').find({}).toArray();
        all.forEach(p => console.log(` id:${p._id} | sellerId:"${p.sellerId}" | title:${p.title}`));
        
        // Check if there might be whitespace issues
        console.log('\n=== Checking sellerId field types ===');
        const sample = await rmsDb.collection('properties').findOne({});
        if (sample) {
            console.log('sellerId type:', typeof sample.sellerId);
            console.log('sellerId value repr:', JSON.stringify(sample.sellerId));
            console.log('Expected Mani ID:', JSON.stringify(MANI_ID));
            console.log('Match:', sample.sellerId === MANI_ID);
        }

    } finally {
        await client.close();
    }
}

run().catch(console.error);
