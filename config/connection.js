const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db = null;

async function connect() {
    try {
        await client.connect();
        db = client.db('shopping'); // Connect once and store db
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}

function get() {
    if (!db) {
        throw new Error('Database not connected');
    }
    return db;
}

module.exports = { connect, get };



