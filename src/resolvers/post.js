const pool = require("../db");
const { reformatCreatedSince } = require("../helpers/post");

/* Query Resolvers */
exports.getAllPosts = async (parent, args, { req, res }) => {
  const query = await pool.query(
    `SELECT post_id, title, description, username, age(now(), posts.created_at) as created_since
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
    `SELECT post_id, title, description, username, age(now(), posts.created_at) as created_since 
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

exports.addPostReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const post_id = args.post_id;
  const user_id = req.user.user_id;

  const query = await pool.query(
    `INSERT INTO post_reactions (post_id, user_id) 
    VALUES ($1, $2) 
    RETURNING post_id`,
    [post_id, user_id]
  );

  const newPostReaction = query.rows[0];
  newPostReaction.username = req.user.username;

  return newPostReaction;
};

exports.deletePostReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const post_id = args.post_id;
  const user_id = req.user.user_id;

  const query = await pool.query(
    `DELETE FROM post_reactions 
    WHERE post_id = ($1) AND user_id = ($2) 
    RETURNING post_id`,
    [post_id, user_id]
  );

  const deletedPostReaction = query.rows[0];
  if (!deletedPostReaction) {
    throw new Error("User has not reacted to this post");
  }

  deletedPostReaction.username = req.user.username;

  return deletedPostReaction;
};
