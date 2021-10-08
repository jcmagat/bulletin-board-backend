const Post = require("../models/Post");

const PostsResolver = async () => {
  const posts = await Post.find();
  return posts;
};

module.exports = PostsResolver;
