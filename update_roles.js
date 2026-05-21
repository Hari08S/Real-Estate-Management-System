const { MongoClient } = require('mongodb');

async function updateRoles() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('RMS'); // Using RMS database based on previous conversations
        const usersCollection = db.collection('users');

        // Find users that don't have RENTAL_OWNER
        const result = await usersCollection.updateMany(
            { roles: { $ne: "RENTAL_OWNER" } },
            { $push: { roles: { $each: ["RENTAL_OWNER", "RENTAL_SEEKER"] } } }
        );

        console.log(`Updated ${result.modifiedCount} users to include RENTAL roles.`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

updateRoles();
