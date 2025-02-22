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
  console.log("Cart Products:", products);
  res.render('user/cart',{products,user:req.session.user})
})

router.get('/add-to-cart/:id', async (req, res) => {
  console.log('api called')
  await userHelpers.addToCart(req.params.id, req.session.user._id).then(()=>{
    res.json({status:true})
  })
 
  
})

router.post('/change-product-quantity', async (req, res, next) => {
  console.log(req.body); // Logging the request body for debugging

  try {
      const response = await userHelpers.changeProductQuantity(req.body);

      // Respond with success status and optional response from the database
      res.json({ success: true, message: "Quantity updated successfully" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
  }
});



module.exports = router;