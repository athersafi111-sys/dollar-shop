const mongoose = require("mongoose");
const childrenSchema = new mongoose.Schema({
    image:String,
    name:String
   
    }, { timestamps: true }); 
    
module.exports = mongoose.model("children", childrenSchema);