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
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        };
    
        return new Promise(async (resolve, reject) => {
            try {
                const database = db.get();
                let userCart = await database.collection(collection.CART_COLLECTION)
                    .findOne({ user: new ObjectId(userId) });
    
                if (userCart && userCart.products) {
                    let proExist = userCart.products.findIndex(product => 
                        product.item && product.item.equals(new ObjectId(proId)) // ✅ Check if `item` exists
                    );
    
                    if (proExist !== -1) {
                        // If product exists, increment quantity
                        await database.collection(collection.CART_COLLECTION)
                            .updateOne(
                                { user: new ObjectId(userId), 'products.item': new ObjectId(proId) },
                                { $inc: { 'products.$.quantity': 1 } }
                            );
                    } else {
                        // If product does not exist, push new product
                        await database.collection(collection.CART_COLLECTION)
                            .updateOne(
                                { user: new ObjectId(userId) },
                                { $push: { products: proObj } }
                            );
                    }
                } else {
                    // If userCart doesn't exist, create a new cart
                    let cartObj = {
                        user: new ObjectId(userId),
                        products: [proObj]
                    };
                    await database.collection(collection.CART_COLLECTION)
                        .insertOne(cartObj);
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }


            ]).toArray();
            resolve(cartItems)
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
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count);
    
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne(
                    { _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }
                ).then((response) => {
                    // Ensure the updated quantity doesn't go below 1
                    db.get().collection(collection.CART_COLLECTION)
                        .findOne({ _id: new ObjectId(details.cart) })
                        .then((cart) => {
                            const product = cart.products.find(p => p.item.equals(new ObjectId(details.product)));
                            if (product && product.quantity < 1) {
                                // Reset to 1 if it goes below 1
                                db.get().collection(collection.CART_COLLECTION)
                                    .updateOne(
                                        { _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
                                        { $set: { 'products.$.quantity': 1 } }
                                    );
                            }
                            resolve(response);
                        });
                }).catch((err) => reject(err));
        });
    }
    


}