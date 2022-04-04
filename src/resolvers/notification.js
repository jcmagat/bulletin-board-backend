const pool = require("../database");
const { ApolloError, AuthenticationError } = require("apollo-server-express");
const { NEW_NOTIFICATION } = require("../utils/constants");

/* ========== Query Resolvers ========== */

exports.getNotifications = async (parent, args, context) => {
  if (!context.isAuthenticated) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const user_id = context.authUser.user_id;

    const messageQuery = await pool.query(
      `SELECT message_id, sender_id, recipient_id, message, sent_at, is_read 
      FROM messages 
      WHERE recipient_id = ($1) AND NOT is_read 
      ORDER BY sent_at DESC`,
      [user_id]
    );

    const commentQuery = await pool.query(
      `SELECT c.comment_id, parent_comment_id, post_id, user_id, message, 
        age(now(), n.created_at) 
      FROM notifications n 
      INNER JOIN comments c 
        ON n.comment_id = c.comment_id 
      WHERE recipient_id = ($1) AND NOT n.is_read 
      ORDER BY n.created_at DESC`,
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
