const express = require("express");
const router = express.Router();
const {sendNotification} = require("../controllers/sendNotification");

router.post("/send-notification", async (req, res) => {
    console.log("req comes", req.url);
    try {
        await sendNotification();
        res.status(200).json({msg: "Notification sent"});
    } catch(e) {
        console.log(e);
    } 
});

module.exports = router;