var db = require('../config/connection');
var collection = require('../config/collections');
const { ObjectId } = require('mongodb');

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

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
            resolve(products);
        });
    },

    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new ObjectId(prodId) }).then((response) => {
                console.log(response);
                resolve(response);
            });
        });
    },

    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(proId) }).then((product) => {
                console.log(product);
                resolve(product);
            });
        });
    },

    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new ObjectId(proId) }, {
                $set: {
                    name: proDetails.name,
                    description: proDetails.description,
                    category: proDetails.category
                }
            }).then((response) => {
                resolve();
            });
        });
    }
};
