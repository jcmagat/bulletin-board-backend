const pool = require("../db");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const { setPostedSince, setLikedByMe } = require("../helpers/post");

/* Query Resolvers */
exports.getAllPosts = async (parent, args, { req, res }) => {
  // TODO: maybe set postedSince and likedByMe

  const posts = await pool.query("SELECT * FROM posts");
  return posts.rows;
};

exports.getPostById = async (parent, args) => {
  const post_id = args.post_id;

  const post = await pool.query("SELECT * FROM posts WHERE post_id = ($1)", [
    post_id,
  ]);

  return post.rows[0];
};

/* Mutation Resolvers */
exports.addPost = async (parent, args, { req, res }) => {
  // if (!req.isAuth) {
  //   throw new Error("Not authenticated");
  // }

  // TODO: set user_id, maybe postedSince

  const title = args.title;
  const description = args.description;

  const newPost = await pool.query(
    "INSERT INTO posts (title, description) VALUES ($1, $2) RETURNING *",
    [title, description]
  );

  if (!newPost) {
    throw new Error("Failed to add post");
  }

  return newPost.rows[0];
};

exports.deletePost = async (parent, args, { req, res }) => {
  // if (!req.isAuth) {
  //   throw new Error("Not authenticated");
  // }

  const post_id = args.post_id;

  const deletedPost = await pool.query(
    "DELETE FROM posts WHERE post_id = ($1) RETURNING *",
    [post_id]
  );

  return deletedPost.rows[0];
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
