const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    image:String,
    userName:String,
    email:String,
    password:String,
            dollars:[{type:mongoose.Schema.Types.ObjectId,ref:"dollar"}],
});
module.exports = mongoose.model("user", userSchema);