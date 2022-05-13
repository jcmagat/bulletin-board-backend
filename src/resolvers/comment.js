const pool = require("../database");
const { formatReactions } = require("../helpers/common");
const {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} = require("apollo-server-errors");
const { NEW_NOTIFICATION } = require("../utils/constants");

/* ========== Query Resolvers ========== */

exports.getPostComments = async (parent, args) => {
  try {
    const post_id = args.post_id;

    const query = await pool.query(
      `SELECT comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at) 
      FROM comments 
      WHERE parent_comment_id IS NULL AND post_id = ($1)`,
      [post_id]
    );

    const comments = query.rows;

    return comments;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.getComment = async (parent, args) => {
  try {
    const comment_id = args.comment_id;

    const query = await pool.query(
      `SELECT comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at) 
      FROM comments 
      WHERE comment_id = ($1)`,
      [comment_id]
    );

    const comment = query.rows[0];

    return comment;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Comment to get comment reactions
exports.getCommentReactions = async (parent, args, context) => {
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

    if (context.isAuthenticated) {
      const user_id = context.authUser.user_id;

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
    throw new ApolloError(error);
  }
};

// Child resolver for Comment to get child_comments
exports.getChildComments = async (parent, args) => {
  try {
    const parent_comment_id = parent.comment_id;

    const query = await pool.query(
      `SELECT comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at) 
      FROM comments 
      WHERE parent_comment_id = ($1)`,
      [parent_comment_id]
    );

    const comments = query.rows;

    return comments;
  } catch (error) {
    throw new ApolloError(error);
  }
};

/* ========== Mutation Resolvers ========== */

exports.addComment = async (parent, args, { req, res, pubsub }) => {
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
      RETURNING comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at)`,
      [parent_comment_id, post_id, user_id, message]
    );

    const newComment = query.rows[0];

    const notificationQuery = await pool.query(
      `WITH 
        parent_comment_user_id AS (
          SELECT user_id FROM comments WHERE comment_id = ($1)
        ), 
        post_user_id AS (
          SELECT user_id FROM posts WHERE post_id = ($2)
        )
      INSERT INTO notifications (recipient_id, actor_id, comment_id)
      VALUES (
          COALESCE((SELECT * FROM parent_comment_user_id), (SELECT * FROM post_user_id)), 
          ($3), ($4)
        )
      RETURNING *`,
      [parent_comment_id, post_id, user_id, newComment.comment_id]
    );

    const info = notificationQuery.rows[0];

    pubsub.publish(NEW_NOTIFICATION, {
      type: "Comment",
      newNotification: newComment,
      info: info,
    });

    return newComment;
  } catch (error) {
    throw new ApolloError(error);
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
      RETURNING comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at)`,
      [comment_id, user_id]
    );

    const deletedComment = query.rows[0];
    if (!deletedComment) {
      throw new ForbiddenError("User not authorized to delete this comment");
    }

    return deletedComment;
  } catch (error) {
    throw new ApolloError(error);
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
      SELECT comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at) 
      FROM comments 
      WHERE comment_id = ($1)`,
      [comment_id, user_id, reaction]
    );

    const comment = query.rows[0];

    return comment;
  } catch (error) {
    throw new ApolloError(error);
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
      SELECT comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at) 
      FROM comments 
      WHERE comment_id = ($1)`,
      [comment_id, user_id]
    );

    const comment = query.rows[0];

    return comment;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.readComments = async (parent, args, context) => {
  if (!context.isAuthenticated) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const user_id = context.authUser.user_id;
    const comment_ids = args.comment_ids;

    const query = await pool.query(
      `WITH read_comment_ids AS (
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE recipient_id = ($1) AND comment_id = ANY($2) 
        RETURNING comment_id
      )
      SELECT comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at) 
      FROM comments 
      WHERE comment_id IN (SELECT * FROM read_comment_ids)`,
      [user_id, comment_ids]
    );

    const comments = query.rows;

    return comments;
  } catch (error) {
    throw new ApolloError(error);
  }
};
