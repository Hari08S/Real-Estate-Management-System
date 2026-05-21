const { MongoClient } = require('mongodb');

async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const adminDb = client.db().admin();
        const dbsList = await adminDb.listDatabases();
        
        console.log('Databases on this MongoDB instance:');
        for (const dbInfo of dbsList.databases) {
            const dbName = dbInfo.name;
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            console.log(`\nDB: ${dbName} (Size: ${dbInfo.sizeOnDisk} bytes)`);
            console.log('Collections:', collections.map(c => c.name));
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(` - ${col.name}: ${count} docs`);
            }
        }
    } catch(err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run().catch(console.error);
