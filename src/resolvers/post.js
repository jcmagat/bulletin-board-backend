const pool = require("../db");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const { reformatCreatedSince } = require("../helpers/post");

/* Query Resolvers */
exports.getAllPosts = async (parent, args, { req, res }) => {
  const query = await pool.query(
    `SELECT post_id, title, description, username, age(now(), created_at) as created_since
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)`
  );

  const posts = query.rows;
  posts.forEach(reformatCreatedSince);

  return posts;
};

exports.getPostById = async (parent, args) => {
  const post_id = args.post_id;

  const query = await pool.query(
    `SELECT post_id, title, description, username, age(now(), created_at) as created_since 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE post_id = ($1)`,
    [post_id]
  );

  const post = query.rows[0];
  if (post) {
    reformatCreatedSince(post);
  }

  return post;
};

/* Mutation Resolvers */
exports.addPost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const title = args.title;
  const description = args.description;
  const user_id = req.user.user_id;

  const query = await pool.query(
    `INSERT INTO posts (title, description, user_id) 
    VALUES ($1, $2, $3) 
    RETURNING post_id, title, description`,
    [title, description, user_id]
  );

  const newPost = query.rows[0];
  newPost.username = req.user.username;
  newPost.created_since = "just now";

  return newPost;
};

exports.deletePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const post_id = args.post_id;
  const user_id = req.user.user_id;

  const query = await pool.query(
    "DELETE FROM posts WHERE post_id = ($1) AND user_id = ($2) RETURNING *",
    [post_id, user_id]
  );

  const deletedPost = query.rows[0];
  if (!deletedPost) {
    throw new Error("User not authorized to delete this post");
  }

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
