const pool = require("../database");
const { formatReactions } = require("../helpers/common");
const {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} = require("apollo-server-errors");
const fs = require("fs");

/* ========== Query Resolvers ========== */

exports.getAllPosts = async (parent, args, { req, res }) => {
  try {
    const query = await pool.query(
      `SELECT post_id, title, description, username, community_id, 
        age(now(), posts.created_at) 
      FROM posts 
        INNER JOIN users 
        ON (posts.user_id = users.user_id) 
      ORDER BY posts.created_at`
    );

    const posts = query.rows;

    return posts;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.getPostById = async (parent, args) => {
  try {
    const post_id = args.post_id;

    const query = await pool.query(
      `SELECT post_id, title, description, username, community_id, 
        age(now(), posts.created_at) 
      FROM posts 
        INNER JOIN users 
        ON (posts.user_id = users.user_id)
      WHERE post_id = ($1)`,
      [post_id]
    );

    const post = query.rows[0];

    return post;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Post to get the community that the post is in
exports.getPostCommunity = async (parent, args) => {
  try {
    const community_id = parent.community_id;

    const query = await pool.query(
      `SELECT community_id, name, title, description, created_at 
      FROM communities 
      WHERE community_id = ($1)`,
      [community_id]
    );

    const community = query.rows[0];

    return community;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Post to get info on comments
exports.getPostCommentsInfo = async (parent, args) => {
  try {
    const post_id = parent.post_id;

    const query = await pool.query(
      `SELECT COALESCE(ARRAY_AGG(comment_id), '{}') AS comment_ids, COUNT(*) AS total
      FROM comments 
      WHERE post_id = ($1)`,
      [post_id]
    );

    const commentsInfo = query.rows[0];

    return commentsInfo;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Post to get post reactions
exports.getPostReactions = async (parent, args, { req, res }) => {
  try {
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
  } catch (error) {
    throw new ApolloError(error);
  }
};

/* ========== Mutation Resolvers ========== */

exports.addPost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const title = args.title;
    const description = args.description;
    const user_id = req.user.user_id;
    const community_id = args.community_id;

    const query = await pool.query(
      `INSERT INTO posts (title, description, user_id, community_id) 
      VALUES ($1, $2, $3, $4) 
      RETURNING post_id, title, description, community_id, age(now(), created_at)`,
      [title, description, user_id, community_id]
    );

    const newPost = query.rows[0];
    newPost.username = req.user.username;

    return newPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.deletePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const post_id = args.post_id;
    const user_id = req.user.user_id;

    const query = await pool.query(
      `DELETE FROM posts 
      WHERE post_id = ($1) AND user_id = ($2) 
      RETURNING post_id, title, description, community_id, age(now(), created_at)`,
      [post_id, user_id]
    );

    const deletedPost = query.rows[0];
    if (!deletedPost) {
      throw new ForbiddenError("User not authorized to delete this post");
    }

    deletedPost.username = req.user.username;

    return deletedPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.addPostReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
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
      SELECT post_id, title, description, username, community_id, 
        age(now(), posts.created_at) 
      FROM posts 
        INNER JOIN users 
        ON (posts.user_id = users.user_id)
      WHERE post_id = ($1)`,
      [post_id, user_id, reaction]
    );

    const post = query.rows[0];

    return post;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.deletePostReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const post_id = args.post_id;
    const user_id = req.user.user_id;

    const query = await pool.query(
      `WITH x AS (
        DELETE FROM post_reactions 
        WHERE post_id = ($1) AND user_id = ($2) 
      )
      SELECT post_id, title, description, username, community_id, 
        age(now(), posts.created_at) 
      FROM posts 
        INNER JOIN users 
        ON (posts.user_id = users.user_id)
      WHERE post_id = ($1)`,
      [post_id, user_id]
    );

    const post = query.rows[0];

    return post;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.savePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const user_id = req.user.user_id;
    const post_id = args.post_id;

    const query = await pool.query(
      `WITH x AS (
        INSERT INTO saved_posts (user_id, post_id) 
        VALUES ($1, $2) 
      )
      SELECT post_id, title, description, username, community_id, 
        age(now(), posts.created_at) 
      FROM posts 
        INNER JOIN users 
        ON (posts.user_id = users.user_id)
      WHERE post_id = ($2)`,
      [user_id, post_id]
    );

    const savedPost = query.rows[0];

    return savedPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.unsavePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const user_id = req.user.user_id;
    const post_id = args.post_id;

    const query = await pool.query(
      `WITH x AS (
        DELETE FROM saved_posts 
        WHERE user_id = ($1) AND post_id = ($2) 
      )
      SELECT post_id, title, description, username, community_id, 
        age(now(), posts.created_at) 
      FROM posts 
        INNER JOIN users 
        ON (posts.user_id = users.user_id)
      WHERE post_id = ($2)`,
      [user_id, post_id]
    );

    const unsavedPost = query.rows[0];

    return unsavedPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.uploadFile = async (parent, args, { req, res }) => {
  const { createReadStream, filename, mimetype, encoding } = await args.file;

  const stream = createReadStream();

  await stream.pipe(fs.createWriteStream("local-file-output.jpg"));

  return { url: "hello" };
};
