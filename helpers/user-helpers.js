var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { response } = require('express');


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
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
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
        details.quantity = parseInt(details.quantity);

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {  // Fixed logical AND
                // Remove product if quantity is 1 and decrement is pressed
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne(
                        { _id: new ObjectId(details.cart) },
                        { $pull: { products: { item: new ObjectId(details.product) } } }
                    )
                    .then((response) => {
                        resolve({ removeProduct: true }); // Indicate product removal
                    })
                    .catch(reject);
            } else {
                // Otherwise, update quantity
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne(
                        { _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
                        { $inc: { 'products.$.quantity': details.count } }  // Fixed 'products.$.quantity'
                    )
                    .then((response) => {
                        resolve({status:true}); // Indicate success
                    })
                    .catch(reject);
            }
        });
    },

    removeProduct : (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne(
                    { _id: new ObjectId(details.cart) },
                    { $pull: { products: { item: new ObjectId(details.product) } } }
                )
                .then((response) => {
                    resolve({ success: true });  // Send success response
                })
                .catch((error) => {
                    console.error("Error removing product:", error);
                    reject({ success: false });
                });
        });
    },
    getTotalAmount: (userId) => {
        
        return new Promise(async (resolve, reject) => {
            try {

                
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: new ObjectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, 
                            quantity: 1, 
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    {
                        $project: {
                            quantity: 1,
                            price: { $toDouble: '$product.price' }  // Convert the price to a number
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$price'] } }
                        }
                    }
                ]).toArray();
                
    
                if (total.length > 0) {
                    console.log(total[0].total)
                    resolve(total[0].total);  // Return the total amount
                } else {
                    resolve(0);  // Return 0 if no data is found
                }
            } catch (error) {
                console.error('Error calculating total:', error);
                reject(error);  // Reject in case of error
            }
        });
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
            if (cart) {
                resolve(cart.products);
                console.log(cart.products)
            } else {
                reject("Cart not found for user");
            }
        });
    },

    placeOrder: (order,userId,products,total) => {
        return new Promise((resolve, reject) => {
            // Ensure the user ID is being passed correctly
            
            console.log('Placing order for user ID:', userId);
    
            let status = order.paymentMethod === 'cash-on-delivery' ? 'placed' : 'pending';
    
            // Construct the order object
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    postalCode: order.postalCode
                },
                userId: userId,  // Ensure the correct ObjectId is being used
                paymentMethod: order.paymentMethod,
                totalAmount: total,
                products: products,
                status: status,
                date: new Date()
            };
    
            // Debugging to make sure the order object looks correct
            console.log('Order object:', orderObj);
    
            // Insert the order into the database
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj)
                .then((response) => {
                    console.log('Order placed successfully:', response);
    
                    // After placing the order, delete the cart for the user
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(userId) })
                        .then((deleteResponse) => {
                            console.log('Cart cleared for user:', deleteResponse);
                            resolve();  // Resolve the promise after both operations are done
                        })
                        .catch((err) => {
                            console.error('Error clearing cart:', err);
                            reject(err);
                        });
                })
                .catch((err) => {
                    console.error('Error placing order:', err);
                    reject(err);
                });
        });
    },


    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('Fetching orders for userId:', userId);
                
                // Use userId as a string in the query
                const orders = await db.get().collection(collection.ORDER_COLLECTION)
                    .find({ userId: userId })  // Compare userId as a string
                    .toArray();
                    
                if (orders.length === 0) {
                    console.log('No orders found for this user.');
                } else {
                    console.log('Orders fetched successfully:', orders);
                }
                
                resolve(orders);
            } catch (error) {
                console.error('Error retrieving orders:', error);
                reject(error);
            }
        });
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: new ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }


            ]).toArray();
            console.log(orderItems)
            resolve(orderItems)
        })
    }
    


}