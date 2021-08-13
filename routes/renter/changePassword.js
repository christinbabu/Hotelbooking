const express = require("express");
const router = express.Router();
const {validateRenterPassword} = require("../../models/renter");
const validate = require("../../middleware/validate");
const auth = require("../../middleware/auth");
const bcrypt = require("bcrypt");
const findRenter = require("../../utils/findRenter");
const renterMiddleware = require("../../middleware/renter");

router.post("/", [auth, renterMiddleware, validate(validateRenterPassword)], async (req, res) => {
  const renter = await findRenter(req.user["username"]);
  let validPassword = await bcrypt.compare(req.body.oldpassword, renter.password);
  if (!validPassword)
    return res.status(400).send({property: "oldpassword", msg: "Old password is wrong"});

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  renter.password = hashedPassword;
  await renter.save();
  const token = renter.generateAuthToken();
  res.send({token, msg: "Password changed successfully"});
});

module.exports = router;
