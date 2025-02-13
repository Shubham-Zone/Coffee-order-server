const express = require("express");
const router = express.Router();
const {subscribe, getSubscriptions} = require("../controllers/subscribe");

router.post("/subscribe", subscribe);

router.get("/subscriptions", getSubscriptions);

module.exports = router;