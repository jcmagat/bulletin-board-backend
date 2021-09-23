const Post = require("../models/Post");
const User = require("../models/User");

// @desc Get all posts
// @route GET /api/v1/posts
// @access Public
exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find();

    return res.status(200).json({
      success: true,
      date: Date.now(),
      count: posts.length,
      data: posts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc Add a post
// @route POST /api/v1/posts
// @access Public
exports.addPost = async (req, res, next) => {
  try {
    const title = req.body.title;
    const message = req.body.message;
    const postedBy = req.user.username;

    const post = await Post.create({
      title: title,
      message: message,
      postedOn: Date.now(),
      postedBy: postedBy,
    });
    const savedPost = await post.save();

    await User.findOneAndUpdate(
      { username: postedBy },
      { $push: { posts: savedPost._id } }
    );

    return res.status(200).json({
      success: true,
      date: Date.now(),
      data: savedPost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc Delete a post
// @route DELETE /api/v1/posts/:id
// @access Public
exports.deletePost = async (req, res, next) => {
  try {
    const id = req.params.id;

    const deletedPost = await Post.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      data: deletedPost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
