const mongoose = require("mongoose");
const otherSchema = new mongoose.Schema({
    image:String,
    name:String
   
    }, { timestamps: true }); 
    
module.exports = mongoose.model("other", otherSchema);