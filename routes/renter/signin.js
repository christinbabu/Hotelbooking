const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const findRenter = require("../../utils/findRenter");
const auth = require("../../middleware/auth");
const renterMiddleware = require("../../middleware/renter");
const { Renter } = require("../../models/renter");

router.get("/", [auth, renterMiddleware],async (req, res)=>{
  let result=await Renter.findById(req.user._id).select({name:1,email:1,username:1})
  if(!result) return res.status(400).send("User not found")
  res.send(result)
})

router.post("/", async (req, res) => {
  let {userId} = req.body;
  let renter = await findRenter(userId);

  if (!renter)
    return res.status(400).send("UserId and Password doesn't Match");

  let validPassword = await bcrypt.compare(req.body.password, renter.password);
  if (!validPassword)
    return res.status(400).send("UserId and Password doesn't Match");

  const token = renter.generateAuthToken();
  res.send(token);
});

module.exports = router;
