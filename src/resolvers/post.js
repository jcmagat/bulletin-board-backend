const pool = require("../db");
const { formatReactions } = require("../helpers/common");

/* ========== Query Resolvers ========== */

exports.getAllPosts = async (parent, args, { req, res }) => {
  const query = await pool.query(
    `SELECT post_id, title, description, username, age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id) 
    ORDER BY posts.created_at`
  );

  const posts = query.rows;

  return posts;
};

exports.getPostById = async (parent, args) => {
  const post_id = args.post_id;

  const query = await pool.query(
    `SELECT post_id, title, description, username, age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE post_id = ($1)`,
    [post_id]
  );

  const post = query.rows[0];

  return post;
};

// Child resolver for Post to get info on comments
exports.getPostCommentsInfo = async (parent, args) => {
  const post_id = parent.post_id;

  const query = await pool.query(
    `SELECT COALESCE(ARRAY_AGG(comment_id), '{}') AS comment_ids, COUNT(*) AS total
    FROM comments 
    WHERE post_id = ($1)`,
    [post_id]
  );

  const commentsInfo = query.rows[0];

  return commentsInfo;
};

// Child resolver for Post to get post reactions
exports.getPostReactions = async (parent, args, { req, res }) => {
  const post_id = parent.post_id;

  const query = await pool.query(
    `SELECT reaction, COUNT(*) 
    FROM post_reactions 
    WHERE post_id = ($1) 
    GROUP BY reaction`,
    [post_id]
  );

  let postReactions = formatReactions(query.rows);

  if (req.isAuth) {
    const user_id = req.user.user_id;

    const auth_query = await pool.query(
      `SELECT reaction as auth_user_reaction
      FROM post_reactions
      WHERE post_id = ($1) AND user_id = ($2)`,
      [post_id, user_id]
    );

    postReactions = { ...postReactions, ...auth_query.rows[0] };
  }

  return postReactions;
};

/* ========== Mutation Resolvers ========== */

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
    RETURNING post_id, title, description, age(now(), created_at)`,
    [title, description, user_id]
  );

  const newPost = query.rows[0];
  newPost.username = req.user.username;

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
  const reaction = args.reaction;

  const query = await pool.query(
    `WITH x AS (
      INSERT INTO post_reactions (post_id, user_id, reaction) 
      VALUES ($1, $2, $3) 
      ON CONFLICT ON CONSTRAINT post_reactions_pkey
      DO UPDATE SET reaction = ($3)
    )
    SELECT post_id, title, description, username, age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE post_id = ($1)`,
    [post_id, user_id, reaction]
  );

  const post = query.rows[0];

  return post;
};

exports.deletePostReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const post_id = args.post_id;
  const user_id = req.user.user_id;

  const query = await pool.query(
    `WITH x AS (
      DELETE FROM post_reactions 
      WHERE post_id = ($1) AND user_id = ($2) 
    )
    SELECT post_id, title, description, username, age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE post_id = ($1)`,
    [post_id, user_id]
  );

  const post = query.rows[0];

  return post;
};

exports.savePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const user_id = req.user.user_id;
  const post_id = args.post_id;

  const query = await pool.query(
    `WITH x AS (
      INSERT INTO saved_posts (user_id, post_id) 
      VALUES ($1, $2) 
    )
    SELECT post_id, title, description, username, age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE post_id = ($2)`,
    [user_id, post_id]
  );

  const savedPost = query.rows[0];

  return savedPost;
};

exports.unsavePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const user_id = req.user.user_id;
  const post_id = args.post_id;

  const query = await pool.query(
    `WITH x AS (
      DELETE FROM saved_posts 
      WHERE user_id = ($1) AND post_id = ($2) 
    )
    SELECT post_id, title, description, username, age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE post_id = ($2)`,
    [user_id, post_id]
  );

  const unsavedPost = query.rows[0];

  return unsavedPost;
};
