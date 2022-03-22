const pool = require("../database");
const { ApolloError, AuthenticationError } = require("apollo-server-express");

const NEW_NOTIFICATION = "NEW_NOTIFICATION";

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

  // Assumes notification is a Message
  // The only possible notification for now
  if (context.authUser.user_id !== payload.newNotification.recipient_id) {
    return false;
  }

  return true;
};
