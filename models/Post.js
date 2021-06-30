const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  message: {
    type: String,
    require: true,
  },
  postedOn: {
    type: Date,
    required: true,
  },
  postedBy: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Post", PostSchema);
