var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');

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
                                resolve(response);  // 🔥 Sending `response` back
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
    }
    
    
    
}


