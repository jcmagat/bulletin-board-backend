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

    const query = await pool.query(
      `SELECT message_id, sender_id, recipient_id, message, sent_at, is_read 
      FROM messages 
      WHERE recipient_id = ($1) AND NOT is_read 
      ORDER BY sent_at DESC`,
      [user_id]
    );

    const notifications = query.rows;

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

  console.log(payload);

  const notification = payload.newNotification;

  switch (payload.type) {
    case "Message":
      // Only publish to the message recipient
      if (context.authUser.user_id !== notification.recipient_id) {
        return false;
      }
      break;

    case "Comment":
      // Only publish to the user whose post the comment was left
      // Or whose comment the comment is replied to
      return false;
      break;

    default:
      return false;
  }

  return true;
};
