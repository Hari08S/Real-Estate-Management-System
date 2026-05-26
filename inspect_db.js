const { MongoClient } = require('mongodb');

async function main() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('RMS');
        
        console.log("=== USERS ===");
        const users = await db.collection('users').find({}).toArray();
        for (const u of users) {
            console.log(`ID: ${u.id || u._id}, Name: ${u.name}, Email: ${u.email}, Roles: ${JSON.stringify(u.roles)}, ActiveRole: ${u.activeRole}`);
        }

        console.log("\n=== CONVERSATIONS ===");
        const convs = await db.collection('conversations').find({}).toArray();
        for (const c of convs) {
            console.log(`ID: ${c._id}, Participants: ${JSON.stringify(c.participants)}, Property: ${c.propertyTitle}, LastMsg: ${c.lastMessage}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();
