const pool = require("../database");
const { ApolloError, AuthenticationError } = require("apollo-server-express");
const { NEW_NOTIFICATION } = require("../utils/constants");
const _ = require("lodash");

/* ========== Query Resolvers ========== */

exports.getNotifications = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const user_id = req.user.user_id;

    const messageQuery = await pool.query(
      `SELECT message_id, sender_id, recipient_id, message, sent_at, is_read 
      FROM messages 
      WHERE recipient_id = ($1) AND NOT is_read 
      ORDER BY sent_at DESC`,
      [user_id]
    );

    const commentQuery = await pool.query(
      `WITH 
        comment_ids AS (
          SELECT comment_id FROM comments WHERE user_id = ($1)
        ), 
        post_ids AS (
          SELECT post_id FROM posts WHERE user_id = ($1)
        )
      SELECT comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), created_at) 
      FROM comments 
      WHERE (
          parent_comment_id IN (SELECT * FROM comment_ids) OR 
          parent_comment_id IS NULL AND post_id IN (SELECT * FROM post_ids)
        ) AND 
        NOT is_read`,
      [user_id]
    );

    const notifications = [...messageQuery.rows, ...commentQuery.rows];

    return notifications;
  } catch (error) {
    throw new ApolloError(error);
  }
};

/* ========== Subscription Resolvers ========== */

exports.newNotification = (parent, args, context) => {
  return context.pubsub.asyncIterator([NEW_NOTIFICATION]);
};

exports.newNotificationFilter = (payload, variables, context) => {
  if (!context.isAuthenticated) {
    return false;
  }

  switch (payload.type) {
    case "Message":
      // Only publish to the message recipient
      if (context.authUser.user_id === payload.newNotification.recipient_id) {
        return true;
      }
      break;

    case "Comment":
      // Only publish to the creator of the parent comment
      // If there's no parent comment, only publish to the creator of the post
      if (context.authUser.user_id === payload.info.recipient_id) {
        return true;
      }
      break;

    default:
      return false;
  }

  return false;
};
