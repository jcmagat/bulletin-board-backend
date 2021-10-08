const Post = require("../models/Post");

exports.getAllPosts = async () => {
  console.log("all posts");
  const posts = await Post.find();
  return posts;
};

exports.getPostById = async (parent, args) => {
  console.log("1 post");
  const post = await Post.findById(args.id);
  return post;
};
