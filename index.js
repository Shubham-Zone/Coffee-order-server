const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const subscribeRouter = require("./routers/subscribe");
const notificationRouter = require("./routers/notification");
const orderRouter = require("./routers/order");
require("dotenv").config();
const cors = require("cors");
const cron = require("node-cron");
const { sendNotification } = require("./controllers/sendNotification");

const app = express();

// Set static path
app.use(express.static(path.join(__dirname, "client")));

app.use(cors());
app.use(express.json());

// app.use(AuthMiddleware);
app.use(subscribeRouter);
app.use(notificationRouter);
app.use(orderRouter);

mongoose
    .connect(process.env.MONGOURL)
    .then(() => {
        console.log("Connected to mongo");
    })
    .catch((err) => {
        console.log("Error connecting to mongo", err);
    });

// cron.schedule("0 11,17 * * *", async () => await sendNotification());
cron.schedule("0 11,17 * * *", async () => {
    console.log("Cron job running every second...", new Date().toLocaleTimeString());
    await sendNotification();
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started at port ${PORT}`);
});

