const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const router = express.Router();
const auth = require("../../middleware/auth");
const adminMiddleware = require("../../middleware/admin");
const validate = require("../../middleware/validate");
const validateObjectId = require("../../middleware/validateObjectId");
const saveImagesandGetPath = require("../../utils/saveImagesandGetPath");
const createFolder = require("../../utils/createFolder");
const {validateRoomBoy, RoomBoy} = require("../../models/roomBoy");
const {retrieveMainPhotobyPath, retrieveOtherPhotos} = require("../../utils/retrieveImages");
const {Booking} = require("../../models/booking");
const convertBase64toImage = require("../../utils/convertBase64toImage");
const removeImage = require("../../utils/deleteFolder");

router.get("/", [auth, adminMiddleware], async (req, res) => {
  const roomBoys = await RoomBoy.find();
  res.send(roomBoys);
});

router.get("/:id", [auth, adminMiddleware, validateObjectId], async (req, res) => {
  let roomBoy = await RoomBoy.findById(req.params.id);
  if (!roomBoy) return res.status(400).send("Room Boy with given ID not found");
  roomBoy.photo = await retrieveMainPhotobyPath(roomBoy.photo);
  res.send(roomBoy);
});

router.post("/", [auth, adminMiddleware, validate(validateRoomBoy)], async (req, res) => {
  console.log("here");
  const roomboy = await RoomBoy.findOne({aadharNumber: req.body.aadharNumber});
  if (roomboy) return res.status(400).send("This Room Boy already exists");
  const dt=await createFolder(req.user.email);
  console.log(dt,"gg")

  req.body.photo = await convertBase64toImage(req.user.email, req.body.photo);
  const roomBoy = new RoomBoy(req.body);
  await roomBoy.save();
  res.send("done");
});

router.put(
  "/:id",
  [auth, adminMiddleware, validateObjectId, validate(validateRoomBoy)],
  async (req, res) => {
    req.body.photo = await convertBase64toImage(req.user.email, req.body.photo);
    await RoomBoy.findByIdAndUpdate(req.params.id, req.body);
    res.send("done");
  }
);

router.delete("/:id", [auth, adminMiddleware, validateObjectId], async (req, res) => {
    const bookings=await Booking.findOne({"roomFinalDetails.roomBoyId":req.params.id,status:"checkedin"});
    if(bookings) return res.status(409).send("Room Boy is currently allocated to a room, so could not delete")

    const deletedRoomBoy=await RoomBoy.findByIdAndRemove(req.params.id)
    removeImage(deletedRoomBoy.photo, function (error) {
        if(error){
            console.log(error);
        }
      });
    const roomBoys=await RoomBoy.find()
    res.send(roomBoys)
});

module.exports = router;
