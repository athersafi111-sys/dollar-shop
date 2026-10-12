const mongoose = require("mongoose");
const ladySchema = new mongoose.Schema({
    image:String,
    name:String
   
    }, { timestamps: true }); 
    
module.exports = mongoose.model("lady", ladySchema);