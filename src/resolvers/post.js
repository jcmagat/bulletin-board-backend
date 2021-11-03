const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const { setPostedSince, setLikedByMe } = require("../helpers/post");

/* Query Resolvers */
exports.getAllPosts = async (parent, args, { req, res }) => {
  const posts = await Post.find();
  posts.forEach(setPostedSince);

  for (const post of posts) {
    await setLikedByMe(post, req.user);
  }

  return posts;
};

exports.getPostById = async (parent, args) => {
  const post = await Post.findById(args.id);
  return post;
};

/* Mutation Resolvers */
exports.addPost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const post = await Post.create({
    title: args.title,
    message: args.message,
    postedOn: Date.now(),
    postedBy: req.user.username,
  });
  post.postedSince = "just now";
  return post;
};

exports.deletePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const post = await Post.findById(args.id);
  if (post.postedBy !== req.user.username) {
    throw new Error("User not authorized to delete this post");
  }

  const deletedPost = await Post.findByIdAndDelete(args.id);
  return deletedPost;
};

exports.likePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const postId = args.id;
  const userId = req.user.id;

  const postLike = await PostLike.findOne({ postId: postId, userId: userId });
  if (postLike) {
    throw new Error("User already liked this post");
  }

  const post = await Post.findByIdAndUpdate(
    postId,
    { $inc: { likes: 1 } },
    { new: true, useFindAndModify: false }
  );

  const newPostLike = await PostLike.create({ postId: postId, userId: userId });

  return post;
};

exports.unlikePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const postId = args.id;
  const userId = req.user.id;

  const postLike = await PostLike.findOne({ postId: postId, userId: userId });
  if (!postLike) {
    throw new Error("User has not liked this post");
  }

  const post = await Post.findByIdAndUpdate(
    postId,
    { $inc: { likes: -1 } },
    { new: true, useFindAndModify: false }
  );

  const deletedPostLike = await PostLike.findByIdAndDelete(postLike._id);

  return post;
};
