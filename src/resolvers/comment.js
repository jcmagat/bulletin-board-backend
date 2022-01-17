const pool = require("../database");
const { formatReactions } = require("../helpers/common");
const {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} = require("apollo-server-errors");

/* ========== Query Resolvers ========== */

exports.getPostComments = async (parent, args) => {
  try {
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
  } catch (error) {
    throw new ApolloError("Internal server error");
  }
};

// Child resolver for Comment to get child_comments
exports.getChildComments = async (parent, args) => {
  try {
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
  } catch (error) {
    throw new ApolloError("Internal server error");
  }
};

// Child resolver for Comment to get comment reactions
exports.getCommentReactions = async (parent, args, { req, res }) => {
  try {
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
  } catch (error) {
    throw new ApolloError("Internal server error");
  }
};

/* ========== Mutation Resolvers ========== */

exports.addComment = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
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
  } catch (error) {
    throw new ApolloError("Internal server error");
  }
};

exports.deleteComment = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const comment_id = args.comment_id;
    const user_id = req.user.user_id;

    const query = await pool.query(
      `DELETE FROM comments 
      WHERE comment_id = ($1) AND user_id = ($2) 
      RETURNING comment_id, parent_comment_id, post_id, message, 
        age(now(), created_at)`,
      [comment_id, user_id]
    );

    const deletedComment = query.rows[0];
    if (!deletedComment) {
      throw new ForbiddenError("User not authorized to delete this comment");
    }

    deletedComment.username = req.user.username;

    return deletedComment;
  } catch (error) {
    throw new ApolloError("Internal server error");
  }
};

exports.addCommentReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const comment_id = args.comment_id;
    const user_id = req.user.user_id;
    const reaction = args.reaction;

    const query = await pool.query(
      `WITH x AS (
        INSERT INTO comment_reactions (comment_id, user_id, reaction) 
        VALUES ($1, $2, $3) 
        ON CONFLICT ON CONSTRAINT comment_reactions_pkey
        DO UPDATE SET reaction = ($3)
      )
      SELECT comment_id, parent_comment_id, post_id, username, message, 
        age(now(), comments.created_at) 
      FROM comments 
        INNER JOIN users
        ON (comments.user_id = users.user_id)
      WHERE comment_id = ($1)`,
      [comment_id, user_id, reaction]
    );

    const comment = query.rows[0];

    return comment;
  } catch (error) {
    throw new ApolloError("Internal server error");
  }
};

exports.deleteCommentReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const comment_id = args.comment_id;
    const user_id = req.user.user_id;

    const query = await pool.query(
      `WITH x AS (
        DELETE FROM comment_reactions 
        WHERE comment_id = ($1) AND user_id = ($2) 
      )
      SELECT comment_id, parent_comment_id, post_id, username, message, 
        age(now(), comments.created_at) 
      FROM comments 
        INNER JOIN users
        ON (comments.user_id = users.user_id)
      WHERE comment_id = ($1)`,
      [comment_id, user_id]
    );

    const comment = query.rows[0];

    return comment;
  } catch (error) {
    throw new ApolloError("Internal server error");
  }
};
