const express = require("express");
const router = express.Router();
const guestMiddleware = require("../../middleware/guest");
const auth = require("../../middleware/auth");
const validateObjectId = require("../../middleware/validateObjectId");
const {Hotel} = require("../../models/hotel");
const {Review} = require("../../models/review");
const {Guest} = require("../../models/guest");
const {OfflineGuest} = require("../../models/offlineGuest");
const {Booking} = require("../../models/booking");

router.get("/:id", async (req, res) => {
  const linkReviewId = req.params.id;
  console.log(linkReviewId,"here")
  const booking = await Booking.find({linkReviewId: linkReviewId});
  console.log(booking,"nm")
  if(!booking[0]) return res.status(400).send("Invalid URL")
  const review=await Review.findById(booking[0].reviewId)
  // const {reviewIds} = await Hotel.findById(req.params.id).select({reviewIds: 1, _id: 0});
  // if (reviewIds.length === 0) return res.status(404).send("no review yet");
  
  // const reviews = await Review.find({
  //   _id: {
    //     $in: reviewIds,
    //   },
    // });
    console.log(review,"rv")
    res.send(review);
  });
  
  router.post("/:id", async (req, res) => {
    const linkReviewId = req.params.id;
    console.log(linkReviewId,"here")
    //   const {bookingId} = req.body;
    const booking = await Booking.findOne({linkReviewId});
    console.log(booking,"here1")
    
    if (!booking) return res.status(403).send("You cannot write review! Check your URL.");
    
    let guest;
    let previousBookedHotelDetails;
    if (booking.bookingMode === "online") {
    guest = await Guest.findById(booking.guestId);
    previousBookedHotelDetails = guest.previousBookedHotelDetails;
  }
  
  if (booking.bookingMode === "offline") {
    guest = await OfflineGuest.findById(booking.guestId);
    previousBookedHotelDetails = guest.previousBookedHotelDetails;
  }
  console.log(previousBookedHotelDetails,"here2")

  let eligibleToReview = previousBookedHotelDetails.includes(booking.hotelId);
  if (!eligibleToReview) return res.status(400).send("You are not elligible to review");

  // let result
  // result=await Review.findOne({bookingId})
  // console.log(result,"nn")
  // if(result) return res.status(400).send("You have already reviewed")

  let reviewedOn = new Date().toLocaleString("en-us", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // result = await Booking.findById(booking._id).select({startingDayOfStay: 1, endingDayOfStay: 1});

  let date1 = new Date(booking.startingDayOfStay);
  let date2 = new Date(booking?.earlyEndingDayOfStay||booking.endingDayOfStay);
  let diffDays = Math.round((date2 - date1) / (1000 * 60 * 60 * 24), 10);

  req.body.guestId = guest._id;
  req.body.hotelId = booking.hotelId;
  req.body.reviewedOn = reviewedOn;
  req.body.numberOfDays = diffDays + 1;
  req.body.name = guest.name;
  req.body.bookingId = booking._id;

  let review;
  if(booking?.reviewId){
    review=await Review.findByIdAndUpdate(booking.reviewId,req.body,{new:true})
  }else{
    review = new Review(req.body);
    await review.save();
    await Hotel.findByIdAndUpdate(booking.hotelId, {$push: {reviewIds: review._id}});
    await Guest.findByIdAndUpdate(booking.guestId, {
      $push: {reviewedHotelIds: booking.hotelId, reviewIds: review._id},
    });
  
    await Booking.findByIdAndUpdate(booking._id, {reviewId: review._id});
  }

  res.send(review);
});

// router.put("/:id", [auth, guestMiddleware, validateObjectId], async (req, res) => {
//   const review = await Review.findById(req.params.id);
//   if (!review) return res.status(404).send("Review with given Id not found");

//   const {reviewIds} = await Guest.findById(req.user._id);

//   const editPermission = reviewIds.includes(req.params.id);
//   if (!editPermission) return res.status(400).send("You don't have permission to edit");

//   review.review = req.body.review;
//   review.rating = req.body.rating;
//   review.markModified("review", "rating");

//   await review.save();
//   res.send(review);
// });

// router.delete("/:id", [auth, guestMiddleware, validateObjectId], async (req, res) => {
//   const reviewId = req.params.id;
//   const review = await Review.findById(reviewId);
//   if (!review) return res.status(404).send("Review with given Id not found");

//   const {reviewIds} = await Guest.findById(req.user._id);

//   const editPermission = reviewIds.includes(reviewId);
//   if (!editPermission) return res.status(400).send("You don't have permission to delete");

//   const deleted = await Review.findByIdAndDelete(reviewId);
//   if (!deleted) return res.status(500).send("Something went wrong at our end");
//   await Hotel.findByIdAndUpdate(review.hotelId, {$pull: {reviewIds: review._id}});
//   await Guest.findByIdAndUpdate(req.user._id, {
//     $pull: {reviewedHotelIds: review.hotelId, reviewIds: review._id},
//   });

//   res.send(review);
// });

module.exports = router;
