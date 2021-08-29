const express = require("express");
const router = express.Router();
const _ = require("lodash");
const mongoose = require("mongoose");
const restaurantMiddleware = require("../../middleware/restaurant");
const auth = require("../../middleware/auth");
const getDays = require("../../utils/getDays");
const {Hotel} = require("../../models/hotel");
const {Room} = require("../../models/room");
const {Booking, validateBooking} = require("../../models/booking");
const {Restaurant} = require("../../models/restaurant");
const {Guest} = require("../../models/guest");
const {retrieveMainPhotobyPath, retrieveMainPhoto} = require("../../utils/retrieveImages");
const validateObjectId = require("../../middleware/validateObjectId");
const {OfflineGuest} = require("../../models/offlineGuest");
const convertBase64toImage = require("../../utils/convertBase64toImage");
const createFolder = require("../../utils/createFolder");
const validate = require("../../middleware/validate");

router.get("/staying", [auth, restaurantMiddleware], async (req, res) => {
  bookings = await Booking.find().where("status").eq("checkedin").lean();

  if (!bookings[0]) return res.status(404).send("No bookings available");

  let finalData = [];
  for (i = 0; i < bookings.length; i++) {
    let roomNumbers=[]
    bookings[i].roomFinalDetails.map(details=>roomNumbers.push(details["roomNumber"]))
    let guest = await Guest.findById(bookings[i].guestId);
    if (!guest) guest = await OfflineGuest.findById(bookings[i].guestId);
    bookings[i]["name"] = guest.name;
    bookings[i]["email"] = guest.email;
    bookings[i]["phoneNumber"] = guest?.phoneNumber || "919164253030";
    bookings[i]["roomNumbers"]=roomNumbers.join(",")
    finalData.push(bookings[i]);
  }
  res.send(finalData);
});

router.get("/fooditems",[auth,restaurantMiddleware],async(req, res)=>{
    const foodItems=await Restaurant.findById(req.user._id).select({items:1})
    console.log(foodItems,"fd")
    if(!foodItems) return res.send(404).send("No food items found");
    res.send(foodItems);
});

router.post("/fooditems",[auth,restaurantMiddleware],async(req, res)=>{
    await Restaurant.findByIdAndUpdate(req.user._id, {$set:{items:req.body.items}})
    res.send("done")
});

router.post("/addtobill",[auth,restaurantMiddleware],async(req, res)=>{

    const restaurant = await Booking.findById(req.user._id).select({items:1})
    const billedItems = _.filter(req.body.items, obj => _.has(obj, "itemQuantity"));
    billedItems.map(item =>{
        item.itemPrice=Number(item.itemPrice)
        item.itemQuantity=Number(item.itemQuantity)
    })
    console.log(billedItems,"bi")
    const booking=await Booking.findById(req.body.bookingId).select({restaurantBill:1})
    let restaurantBillCopy
    if(booking?.restaurantBill){
        restaurantBillCopy=[...booking.restaurantBill]
    }
    
    let finalRestaurantBill

    if(!restaurantBillCopy) {
        booking.restaurantBill=billedItems
        await booking.save()
    }else{
        restaurantBillCopy.map(item=>{
                billedItems.map(bitem=>{
                    if(bitem.itemName==item?.itemName){
                        item.itemQuantity=Number(item.itemQuantity)+Number(bitem.itemQuantity)
                    }
                })
        })
        finalRestaurantBill=[...restaurantBillCopy,...billedItems]
        finalRestaurantBill=_.uniqBy(finalRestaurantBill,"itemName")

        console.log(finalRestaurantBill,"frb")
        booking.restaurantBill=finalRestaurantBill
        booking.markModified("restaurantBill")
        await booking.save()
    }
    res.send("done")
});



module.exports = router;
