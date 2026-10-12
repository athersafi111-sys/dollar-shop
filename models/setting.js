const mongoose = require('mongoose');
const settingSchema = new mongoose.Schema({
    twoDollarRate: Number,
    dollarRate: Number,
    rayalRate: Number,
    dollarBgColor: String,
    notification: String,
    notificationCreatedAt: Date,
    notificationExpiresAt: Date,
    notificationDuration: Number,
    // ADD THESE
    adminEmail: { type: String, default: "admin@gmail.com" },
    adminPassword: { type: String, default: "12345" }
}, { timestamps: true });

module.exports = mongoose.model('setting', settingSchema);