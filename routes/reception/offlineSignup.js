const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const {validateOfflineGuest, OfflineGuest} = require("../../models/offlineGuest");
const validate = require("../../middleware/validate");
const Yup = require("yup");
const auth = require("../../middleware/auth");
const receptionMiddleware = require("../../middleware/reception");

router.get("/", [auth, receptionMiddleware], async (req, res) => {
  let email = await OfflineGuest.findOne({email: req.query.userId.toLowerCase()});
  let mobile = await OfflineGuest.findOne({phoneNumber: req.query.userId});
  if (mobile || email) return res.send({isGuestExist:true});
  else return res.send({isGuestExist:false});
});

router.post("/", [auth, receptionMiddleware, validate(validateOfflineGuest)], async (req, res) => {
  let email = await OfflineGuest.findOne({email: req.body.email.toLowerCase()});
  if (email) return res.status(400).send({property: "email", msg: "Email Already Registered"});

  let mobile = await OfflineGuest.findOne({phoneNumber: req.body.phoneNumber});
  if (mobile) return res.status(400).send({property: "phoneNumber", msg: "Mobile Already Exist"});

  req.body.email = req.body.email.toLowerCase();

  const offlineGuest = new OfflineGuest(req.body);
  await offlineGuest.save();
  const token = offlineGuest.generateAuthToken();
  res.send(token);
});

module.exports = router;
