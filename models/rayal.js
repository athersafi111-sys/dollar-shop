const mongoose = require("mongoose");
const rayalSchema = new mongoose.Schema({
    image:String,
    name:String
   
    }, { timestamps: true }); 
    
module.exports = mongoose.model("rayal", rayalSchema);