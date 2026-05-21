const { MongoClient } = require('mongodb');
async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('RMS');
        const collections = await db.listCollections().toArray();
        console.log('Collections in RMS:', collections.map(c => c.name));
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`RMS.${col.name} count: ${count}`);
            if (count > 0) {
                const sample = await db.collection(col.name).find({}).limit(5).toArray();
                console.log(`RMS.${col.name} sample:`, sample.map(s => {
                    const { password, passwordHash, ...rest } = s;
                    return rest;
                }));
            }
        }
    } catch(err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run();
