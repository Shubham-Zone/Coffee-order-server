require("dotenv").config();
const Subscription = require("../models/Subscription");

exports.subscribe = async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        console.log(`new req comes ${req.url}`, req.body);

        // Check if subscription already exists
        const existingSubscription = await Subscription.findOne({ endpoint });
        if (existingSubscription) {
            return res.status(400).json({ msg: "Already subscribed!" });
        }

        // Save new subscription
        const newSubscription = new Subscription({ endpoint, keys });
        await newSubscription.save();

        console.log("New subscription saved:", newSubscription);
        res.status(200).json({ msg: "Subscribed successfully!" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ msg: e.message });
    }
};

exports.getSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find();
        if(subscriptions.length === 0) {
            return res.status(402).json({msg: 'No subscriptions found.'});
        }
        res.status(200).json(subscriptions);
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
};


// exports.subscribe = async (req, res) => {
//     try {
//         subscriptions.push(req.body);
//         console.log("Subscriptions list length", subscriptions.length);
//         res.status(200).json({ msg: "Subscribed successfully!" });
//     } catch(e) {
//         return res.status(500).json({msg: e.message});
//     }
// };
