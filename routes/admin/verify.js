const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const adminMiddleware = require("../../middleware/admin");
const {Hotel} = require('../../models/hotel')

router.get("/",[auth,adminMiddleware], async (req, res)=>{
    const hotels = await Hotel.find({ isVerified: false })
    res.send(hotels)
})

router.put("/:id",[auth,adminMiddleware], async (req, res)=>{
    const hotels = await Hotel.findByIdAndUpdate(req.params.id,{isVerified:true},{new: true})
    if(!hotels) return res.status(404).send('Hotel with given id not found')
    res.send(hotels)
})

router.delete("/:id",[auth,adminMiddleware],async (req, res)=>{
    const hotels = await Hotel.findByIdAndDelete(req.params.id)
    if(!hotels) return res.status(404).send('Hotel with given id not found')
    res.send(hotels)
})

module.exports = router;