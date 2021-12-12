const pool = require("../db");
const { formatReactions } = require("../helpers/post");

/* Query Resolvers */
exports.getAllPosts = async (parent, args, { req, res }) => {
  const query = await pool.query(
    `SELECT post_id, title, description, posts.user_id, username, 
      age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id) 
    ORDER BY posts.created_at`
  );

  // TODO: return number of comments and list of comment_ids

  const posts = query.rows;

  return posts;
};

exports.getPostById = async (parent, args) => {
  const post_id = args.post_id;

  const query = await pool.query(
    `SELECT post_id, title, description, posts.user_id, username, 
      age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE post_id = ($1)`,
    [post_id]
  );

  const post = query.rows[0];

  // TODO: return number of comments

  return post;
};

exports.getPostComments = async (parent, args) => {
  const post_id = args.post_id;

  const query = await pool.query(
    `SELECT comment_id, parent_comment_id, post_id, username, message, 
      age(now(), comments.created_at) 
    FROM comments 
      INNER JOIN users
      ON (comments.user_id = users.user_id)
    WHERE parent_comment_id IS NULL AND post_id = ($1)`,
    [post_id]
  );

  const comments = query.rows;

  return comments;
};

exports.getChildComments = async (parent, args) => {
  const parent_comment_id = parent.comment_id;

  const query = await pool.query(
    `SELECT comment_id, parent_comment_id, post_id, username, message, 
      age(now(), comments.created_at) 
    FROM comments 
      INNER JOIN users
      ON (comments.user_id = users.user_id)
    WHERE parent_comment_id = ($1)`,
    [parent_comment_id]
  );

  const comments = query.rows;

  return comments;
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
    RETURNING post_id, title, description, user_id, age(now(), created_at)`,
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

// Child resolver for Post and Comment to set created_since
exports.setCreatedSince = async (parent, args, { req, res }) => {
  const age = parent.age;
  if (!age) {
    return null;
  }

  const { years, days, hours, minutes } = age;
  let time;
  let ago;

  if (years) {
    time = years;
    ago = years > 1 ? " years ago" : " year ago";
  } else if (days) {
    time = days;
    ago = days > 1 ? " days ago" : " day ago";
  } else if (hours) {
    time = hours;
    ago = hours > 1 ? " hours ago" : " hour ago";
  } else if (minutes) {
    time = minutes;
    ago = minutes > 1 ? " minutes ago" : " minute ago";
  } else {
    return "just now";
  }

  return time + ago;
};

// Child resolver for Post to set reactions
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

exports.addPostReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const post_id = args.post_id;
  const user_id = req.user.user_id;
  const reaction = args.reaction;

  const query = await pool.query(
    `INSERT INTO post_reactions (post_id, user_id, reaction) 
    VALUES ($1, $2, $3) 
    ON CONFLICT ON CONSTRAINT post_reactions_pkey
    DO UPDATE SET reaction = ($3)
    RETURNING post_id, reaction`,
    [post_id, user_id, reaction]
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
    RETURNING post_id, reaction`,
    [post_id, user_id]
  );

  const deletedPostReaction = query.rows[0];
  if (!deletedPostReaction) {
    throw new Error("User has not reacted to this post");
  }

  deletedPostReaction.username = req.user.username;

  return deletedPostReaction;
};

exports.addComment = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const parent_comment_id = args.parent_comment_id;
  const post_id = args.post_id;
  const user_id = req.user.user_id;
  const message = args.message;

  const query = await pool.query(
    `INSERT INTO comments (parent_comment_id, post_id, user_id, message)
    VALUES ($1, $2, $3, $4)
    RETURNING comment_id, parent_comment_id, post_id, message, 
      age(now(), created_at)`,
    [parent_comment_id, post_id, user_id, message]
  );

  const newComment = query.rows[0];
  newComment.username = req.user.username;

  return newComment;
};

exports.getCommentReactions = async (parent, args, { req, res }) => {
  const comment_id = parent.comment_id;

  const query = await pool.query(
    `SELECT reaction, COUNT(*) 
    FROM comment_reactions 
    WHERE comment_id = ($1) 
    GROUP BY reaction`,
    [comment_id]
  );

  let commentReactions = formatReactions(query.rows);

  if (req.isAuth) {
    const user_id = req.user.user_id;

    const auth_query = await pool.query(
      `SELECT reaction as auth_user_reaction
      FROM comment_reactions
      WHERE comment_id = ($1) AND user_id = ($2)`,
      [comment_id, user_id]
    );

    commentReactions = { ...commentReactions, ...auth_query.rows[0] };
  }

  return commentReactions;
};

exports.addCommentReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const comment_id = args.comment_id;
  const user_id = req.user.user_id;
  const reaction = args.reaction;

  const query = await pool.query(
    `INSERT INTO comment_reactions (comment_id, user_id, reaction) 
    VALUES ($1, $2, $3) 
    ON CONFLICT ON CONSTRAINT comment_reactions_pkey
    DO UPDATE SET reaction = ($3)
    RETURNING comment_id, reaction`,
    [comment_id, user_id, reaction]
  );

  const newCommentReaction = query.rows[0];
  newCommentReaction.username = req.user.username;

  return newCommentReaction;
};
