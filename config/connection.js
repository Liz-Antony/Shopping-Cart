const { MongoClient } = require('mongodb');
let db = null;

async function connectToDatabase() {
    if (db) return db;  // If already connected, return the existing connection

    try {
        const uri = 'mongodb://localhost:27017';
        const client = new MongoClient(uri);

        await client.connect();  // Wait for the connection
        console.log('Connected to MongoDB');
        
        db = client.db('shopping');  // Set the db object when connected
        console.log('Using database: shopping');
        return db;  // Return the db object when connection is successful

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;  // Throw error if connection fails
    }
}

module.exports = { connectToDatabase };



