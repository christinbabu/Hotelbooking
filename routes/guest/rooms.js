const express = require("express");
const router = express.Router();
const _ = require("lodash");
const mongoose = require("mongoose");
const guestMiddleware = require("../../middleware/guest");
const auth = require("../../middleware/auth");
const getDays = require("../../utils/getDays");
const {Hotel} = require("../../models/hotel");
const {Room} = require("../../models/room");
const {Booking} = require("../../models/booking");
const {Guest} = require("../../models/guest");
const {retrieveMainPhoto, retrieveOtherPhotos} = require("../../utils/retrieveImages");
const validateObjectId = require("../../middleware/validateObjectId");

router.get("/", async (req, res) => {
  let {roomIds, selectedDayRange,hotelId} = req.query;
  console.log(req.query)
  let hotel=await Hotel.findById(hotelId).select({extraBed:1,noOfExtraBeds:1,pricePerExtraBed:1});
  let rooms = [await Room.find().where("_id").in(roomIds).lean()];
  // console.log(rooms,"rms")
  let finalRoomsData = [];
  let allTheDays;
  selectedDayRange = JSON.parse(selectedDayRange);
  if (selectedDayRange.from) {
    allTheDays = getDays(selectedDayRange);
  } else {
    for (let room of rooms) {
      finalRoomsData.push(await retrieveMainPhoto(room));
    }

    return res.send(_.flattenDeep(finalRoomsData));
  }
  rooms = _.flattenDeep(rooms);

  // for(let room of rooms){
  //   for (let day of allTheDays) {
  //     if(room.bookingFullDates.includes(day)){
  //       // console.log(_.indexOf(room, ),"rm")
  //       // console.log(_.matches(room, { id : room._id}),"rg")
  //       // rooms.splice(), 1);
  //       _.remove(rooms, roomData => roomData._id ===room._id );
  //     }
  //   }
  // }

  for (let room of rooms) {
    if (room.numberOfBookingsByDate) {
      let days = 0;
      for (let day of allTheDays) {
        if (day in room.numberOfBookingsByDate) {
          if (room.numberOfBookingsByDate[day] > days) days = room.numberOfBookingsByDate[day];
        }
      }
      room.numberOfRoomsOfThisType = room.numberOfRoomsOfThisType - days;
    }
    finalRoomsData.push(await retrieveMainPhoto([room]));
  }

  finalRoomsData = _.flattenDeep(finalRoomsData);
  for (let room of finalRoomsData) {
    console.log(hotel.noOfExtraBeds,"eb")
    if(hotel.extraBed){
      room["noOfExtraBeds"]=hotel.noOfExtraBeds
      room["extraBed"]=hotel.extraBed
      room["pricePerExtraBed"]=hotel.pricePerExtraBed
    }
    _.remove(finalRoomsData,room => room.numberOfRoomsOfThisType ==0);
  }

  res.send(_.flattenDeep(finalRoomsData));
});

router.get("/:id", async (req, res) => {
  console.log("here");
  let room = [await Room.findById(req.params.id).select({photos: 1, facilities: 1, mainPhoto: 1})];
  console.log(room);
  if (!room[0]) return res.status(404).send("room with given id not found");
  room = await retrieveMainPhoto(room);
  room = await retrieveOtherPhotos(room);
  res.send(room);
});

module.exports = router; 
