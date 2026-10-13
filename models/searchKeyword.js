const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    keyword: String,
    count: { type: Number, default: 1 },
    lastSearched: { type: Date, default: Date.now }
});
module.exports = mongoose.model("SearchKeyword", schema);