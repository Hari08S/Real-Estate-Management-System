const { MongoClient } = require('mongodb');
async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('RMS');
        const count = await db.collection('users').countDocuments();
        console.log(`RMS.users count: ${count}`);
        if (count > 0) {
            const sample = await db.collection('users').find({}).toArray();
            sample.forEach(u => {
                console.log(`ID: ${u.id || u._id}, Name: ${u.name}, Email: ${u.email}, ActiveRole: ${u.activeRole}, Roles: ${JSON.stringify(u.roles)}`);
            });
        }
    } catch(err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run();
