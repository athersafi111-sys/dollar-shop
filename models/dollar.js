const mongoose = require("mongoose");
const dollarSchema = new mongoose.Schema({
    image:String,
    name:String}, 
    { timestamps: true }); 
module.exports = mongoose.model("dollar", dollarSchema);