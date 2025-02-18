const db = require('../config/connection');
var collection=require('../config/collections')


module.exports = {
    addProduct: async (product, callback) => {
        try {
            const database = db.get(); // Use get() to retrieve db
            let result = await database.collection(collection.PRODUCT_COLLECTION).insertOne(product);
            callback(result.insertedId); // Return the inserted ID
        } catch (error) {
            console.error('Error in addProduct:', error);
            callback(null);
        }
    },
    getAllProducts:()=>{
        return new Promise(async (resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    }
};


