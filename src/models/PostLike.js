const mongoose = require("mongoose");

const PostLikeSchema = new mongoose.Schema({
  postId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("PostLike", PostLikeSchema);
