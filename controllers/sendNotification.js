require("dotenv").config();
const PushNotifications = require("node-pushnotifications");
const Subscription = require("../models/Subscription");

const settings = {
    web: {
        vapidDetails: {
            subject: process.env.EMAIL,
            publicKey: process.env.PUBLIC_VAPID_KEY,
            privateKey: process.env.PRIVATE_VAPID_KEY
        },
        gcmAPIKey: "gcmKey",
        TTL: 2419200,
        contentEncoding: "aes128gcm",
        headers: {},
    },
    isAlwaysUseFCM: false,
};

const push = new PushNotifications(settings);

// Send Notifications at 11 AM & 5 PM
const sendNotification = async () => {
    const payload = {
        title: "Coffee or Chai?",
        body: "Would you like coffee or tea? Click to choose.",
        icon: "/coffee-icon.png",
        actions: [
            { action: "coffee", title: "☕ Coffee" },
            { action: "tea", title: "🍵 Tea" }
        ]
    };

    try {
        const subscriptions = await Subscription.find();
        await push.send(subscriptions, payload);
        console.log("Notifications sent!", subscriptions);
    } catch (error) {
        console.error("Error sending notifications:", error);
    }
};

module.exports = { sendNotification };