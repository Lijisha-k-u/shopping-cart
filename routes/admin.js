var express = require('express');
const { log } = require('handlebars');
var router = express.Router();
var productHelper= require('../helpers/product-helpers');
const productHelpers = require('../helpers/product-helpers');

/* GET users listing. */
router.get('/', function(req, res, next) {
   productHelpers.getAllProducts().then((products)=>{
    console.log(products);
    res.render('admin/view-products',{admin:true,products})
   })
  
});

router.get('/add-product',(req,res)=>{
   res.render('admin/add-product',{admin:true})
})
router.post('/add-product',(req,res)=>{
  console.log(req.body);
  console.log(req.files.Image);
  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.Image
    console.log(id);
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.render("admin/add-product",{admin:true})
      }else {
        console.log(err);
      }
      
    })
  
  })

})
router.get('/delete-product/:id',(req,res)=>{
   let proId=req.params.id
   console.log(proId);
   productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
   })
 
})
router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })

})


module.exports = router;
