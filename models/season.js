const mongoose = require("mongoose");
const seasonSchema = new mongoose.Schema({
    image:String,
    name:String
   
    }, { timestamps: true }); 
    
module.exports = mongoose.model("season", seasonSchema);