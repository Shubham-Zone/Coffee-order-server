const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
    endpoint: { type: String, required: true },
    keys: {
        auth: { type: String, required: true },
        p256dh: { type: String, required: true }  // Fixed incorrect key name
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Chai-Subscription", SubscriptionSchema);
