const { MongoClient } = require('mongodb');
async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        for (const dbName of ['RMS', 'test', 'auth']) {
            console.log(`\n================ DATABASE: ${dbName} ================`);
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            console.log('Collections:', collections.map(c => c.name));
            
            for (const colInfo of collections) {
                const colName = colInfo.name;
                const count = await db.collection(colName).countDocuments();
                console.log(`  Collection: ${colName} -> Count: ${count}`);
                if (count > 0) {
                    const sample = await db.collection(colName).find({}).limit(3).toArray();
                    console.log(`  Sample (up to 3):`, sample.map(s => {
                        const { password, ...rest } = s;
                        return rest;
                    }));
                }
            }
        }
    } catch(err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run();
