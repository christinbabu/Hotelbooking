const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const {validateAdmin, Admin} = require("../../models/admin");
const validate = require("../../middleware/validate");

router.post("/", [validate(validateAdmin)], async (req, res) => {
  let email = await Admin.findOne({email: req.body.email.toLowerCase()});
  if (email) return res.status(400).send({property: "email", msg: "Email Already Registered"});

  let username = await Admin.findOne({username: req.body.username.toLowerCase()});
  if (username) return res.status(400).send({property: "username", msg: "Username Already Taken"});

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  req.body.password = hashedPassword;
  req.body.email = req.body.email.toLowerCase();
  req.body.username = req.body.username.toLowerCase();

  let adminData = _.pick(req.body, ["name", "email", "username", "password"]);

  const admin = new Admin(adminData);
  await admin.save();
  const token=admin.generateAuthToken()
  res.send(token);
});

module.exports = router;
