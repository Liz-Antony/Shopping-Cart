var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET users listing. */
router.get('/',async (req, res) => {
  let user = req.session.user;
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((products) => {

    res.render('user/view-products', { products, user,cartCount });
  });
});



router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect('/');
  }else {
    res.render('user/login',{LoginErr:req.session.loginErr})
    req.session.loginErr = false;  // Clear the session error message

  }
  
 // Pass the error message to the view
});


router.get('/signup',(req,res)=>{
  res.render('user/signup')
});

router.post('/signup',(req,res)=>{
   userHelpers.doSignup(req.body).then((response)=>{
      console.log(response)
      req.session.loggedIn=true
      req.session.user=response
      res.redirect('/')
   })
})


router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      req.session.save(() => { // Ensure session is saved before redirecting
        res.redirect('/');
      });
    } else {
      req.session.loginErr=true
      res.redirect('/login');
    }
  });
});


router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async (req,res)=>{
  let products=await userHelpers.getCartProducts(req.session.user._id)
  let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
  console.log("Cart Products:", products);
  res.render('user/cart',{products,user:req.session.user,totalValue})
})

router.get('/add-to-cart/:id', async (req, res) => {
  console.log('api called')
  await userHelpers.addToCart(req.params.id, req.session.user._id).then(()=>{
    res.json({status:true})
  })
 
  
})

router.post('/change-product-quantity', (req, res, next) => {
 
    userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    let total=await userHelpers.getTotalAmount(req.body.user._id)
   
     res.json(total)
   })
   
 })

router.post('/remove-product', async (req, res) => {
  try {
      const response = await userHelpers.removeProduct(req.body);
      res.json(response);
  } catch (error) {
      console.error("Error removing product:", error);
      res.status(500).json({ success: false, message: "Failed to remove product" });
  }
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  console.log("User id available at get place order router"+req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})

})

router.post('/place-order', async (req, res) => {
  console.log(req.body);  // Add this to see the form data being sent
  try {
      let userId = req.body.user; 
      console.log(userId)
      // Ensure you're using the correct field for userId
      let products = await userHelpers.getCartProductList(userId);
      let totalPrice = await userHelpers.getTotalAmount(userId);

      userHelpers.placeOrder(req.body,userId, products, totalPrice).then((response) => {
        res.json({status:true})
          
      }).catch((error) => {
          res.status(500).send("Error placing order: " + error);
      });
  } catch (error) {
      console.error("Error getting cart products: ", error);
      res.status(500).send("Cart not found or other error: " + error);
  }
})

router.get('/orderDetails',(req,res)=>{
  res.render('user/orderDetails',{user:req.session.user})
})

router.get('/view-order', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
      return res.redirect('/login'); // Redirect to login if no user session is found
  }
  let userId = req.session.user._id;
  let orders = await userHelpers.getUserOrders(userId);
  res.render('user/previous-orderList', { user: req.session.user, orders });
});

router.get('/view-order-products/:id',async(req,res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  console.log("Products printing before passing to be displayed"+products);  // Ensure this is an array

  res.render('user/view-order-products',{user:req.session.user,products})
})













module.exports = router;