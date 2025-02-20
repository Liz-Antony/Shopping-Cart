var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');

/* GET home page. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { products });
  });
});

router.get('/add-product', function (req, res) {
  res.render('admin/add-product');
});

router.post('/add-product', (req, res) => {
  productHelpers.addProduct(req.body, (insertedId) => {
    if (!insertedId) {
      return res.status(500).send("Error adding product");
    }

    let image = req.files.image; // Ensure 'image' exists
    if (!image) {
      return res.status(400).send("No image uploaded");
    }

    image.mv('./public/product-images/' + insertedId + '.jpg', (err) => {
      if (err) {
        console.log("Error moving file:", err);
        return res.status(500).send(err);
      }
      console.log("Image uploaded successfully");
      res.redirect('/admin/add-product');
    });
  });
});

router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id;
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/');
  });
});

router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  res.render('admin/edit-product', { product });
});

router.post('/edit-product/:id', (req, res) => {
  console.log(req.params.id);
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin');
    if (req.files.image) {
      let image = req.files.image;
      image.mv('./public/product-images/' + req.params.id + '.jpg');
    }
  });
});

module.exports = router;
