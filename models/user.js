const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    image:String,
    userName:String,
    email:String,
    password:String,
            dollars:[{type:mongoose.Schema.Types.ObjectId,ref:"dollar"}],
            childrens:[{type:mongoose.Schema.Types.ObjectId,ref:"children"}],
            ladies:[{type:mongoose.Schema.Types.ObjectId,ref:"lady"}],
            seasons:[{type:mongoose.Schema.Types.ObjectId,ref:"season"}],
            others:[{type:mongoose.Schema.Types.ObjectId,ref:"other"}],
            premiums:[{type:mongoose.Schema.Types.ObjectId,ref:"premium"}],
            rayals:[{type:mongoose.Schema.Types.ObjectId,ref:"rayal"}],

});
module.exports = mongoose.model("user", userSchema);