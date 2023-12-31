var db=require('../config/connection')
var collections=require('../config/collections');
const bcrypt=require('bcrypt');
const { response } = require('express');
var objectId=require('mongodb').ObjectID

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await  bcrypt.hash(userData.Password,10)
            db.get().collection(collections.USER_COLLECTION).insert(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })
       
    },

    doLogin:(userData)=>{
       
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let responce={}
             let user =await  db.get().collection(collections.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                      if(status){
                        console.log("login success");
                        response.user=user
                        response.status=true
                        resolve(response)
                      } else{
                        console.log("login failed");
                        resolve({status:false})
                      }   
                })
             }else{
                console.log("login failed");
                resolve({status:false})
             }
        })
      
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart= await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
             if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(userCart!=-1){
                    db.get().collection(collections.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        
                        resolve()
                    })

                }else{
                
            
                 db.get().collection(collections.CART_COLLECTION).updateOne({user:objectId(userId)},
                
                    {
                        $push:{products:proObj}
                    }
                 ).then((response)=>{
                    console.log(userCart);
                     resolve()
                 })
                }
            }else{
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                
                    resolve()
                })
            }
        })
    },
    getCartProduct:(userId)=>{
       return new Promise(async(resolve,reject)=>{
        let cartItems= await db.get().collection(collections.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
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
                    from:collections.PRODUCT_COLLECTION,
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
            
        ]).toArray()
        console.log(cartItems);
        resolve(cartItems)
       })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)

        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)


        return new Promise((resolve,reject)=>{
            if(details.count==-1  && details.quantity==1){
                db.get().collection(collections.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
            db.get().collection(collections.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }
                    ).then((response)=>{
                        resolve({status:true})
                    })
            }
            
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total= await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
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
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                  $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                  }  
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.Price',to:'int'}}]}}
                    }
                }
                
            ]).toArray()
            console.log(total[0].total);
            resolve(total[0].total)
           })
        },
        placeOrder:(order,products,total)=>{
           return new Promise((resolve,reject)=>{
            console.log(order,products,total);
           })
        },
        getCartProductList:(userId)=>{
             return new Promise(async(resolve,reject)=>{
                console.log(userId);
                let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
                console.log(cart);
                 resolve(cart.products)
             })
             
        }

}