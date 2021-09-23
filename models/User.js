const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  posts: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("User", UserSchema);
