const { connectToDatabase } = require('../config/connection');

module.exports = {
    addProduct: async (product, callback) => {
        try {
            // Wait for the database connection
            const db = await connectToDatabase();  // Await the connection and get the db object

            // Check if db is null
            if (!db) {
                console.log('Database is not connected');
                callback(false);
                return;
            }

            // Insert the product into the 'products' collection
            console.log(product);  // Log the product for debugging
            
            // Perform the database operation
            db.collection('product')
                .insertOne(product)
                .then((data) => {
                    console.log('Product inserted successfully:', data);
                    callback(true);
                })
                .catch((error) => {
                    console.error('Error inserting product:', error);
                    callback(false);
                });

        } catch (error) {
            console.error('Error in addProduct:', error);
            callback(false);
        }
    }
};

