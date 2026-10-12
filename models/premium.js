const mongoose = require("mongoose");
const premiumSchema = new mongoose.Schema({
    image:String,
    name:String
   
    }, { timestamps: true }); 
    
module.exports = mongoose.model("premium", premiumSchema);