var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');


module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Hash the password before saving
                userData.password = await bcrypt.hash(userData.password, 10);

                // Insert the user data into the collection
                let result = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);

                // Log the full result, including insertedId
                console.log('Inserted user data:', result);

                // Return the entire user data including the inserted _id
                resolve({
                    ...userData,
                    _id: result.insertedId // Add the _id field to the original userData
                });
            } catch (error) {
                reject(error);
            }
        });
    },
    doLogin: (userData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .findOne({ email: userData.email })
                .then((user) => {
                    if (user) {
                        bcrypt.compare(userData.password, user.password).then((status) => {
                            if (status) {
                                console.log("login success")
                                let response = { status: true, user: user }; // ✅ Assigning user object
                                resolve(response);  // 🔥 Sending response back
                            } else {
                                let response = { status: false, user: null, message: 'Invalid password' };

                                resolve(response);

                            }
                        });
                    } else {
                        let response = { status: false, user: null, message: 'User not found' };
                        resolve(response);
                        console.log("Invalid email address")
                    }
                })
                .catch((error) => reject(error)); // Reject if error
        });
    },
    addToCart: (proId, userId) => {

        return new Promise(async (resolve, reject) => {
            const database = db.get()
            let userCart = await database.collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId), })
            if (userCart) {
                
               
                // If cart exists, update it
                 database.collection(collection.CART_COLLECTION)
                     .updateOne(
                         { user: new ObjectId(userId) },
                         { $push: { products: new ObjectId(proId) } }
 
                     )
                     .then((response) => resolve());

            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [new ObjectId(proId)]
                }
                database.collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        let: { proList: '$products' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $in: ['$_id', "$$proList"]
                                }
                            }
                        }],
                        as: 'cartItems'
                    }
                }
            ]).toArray();
            console.log("Cart items retrieved:", cartItems[0].cartItems);
            resolve(cartItems[0].cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    }



}