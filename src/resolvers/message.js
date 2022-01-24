const pool = require("../database");
const { ApolloError, AuthenticationError } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");
const { formatConversations } = require("../helpers/message");

const pubsub = new PubSub();

const NEW_MESSAGE = "NEW_MESSAGE";

/* ========== Query Resolvers ========== */
exports.getConversations = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const auth_user_id = req.user.user_id;

    const query = await pool.query(
      `SELECT message_id, sender_id, recipient_id, message, sent_at 
      FROM messages 
      WHERE sender_id = ($1) OR recipient_id = ($1)
      ORDER BY sent_at DESC`,
      [auth_user_id]
    );

    const messages = query.rows;
    const conversations = formatConversations(messages, auth_user_id);

    return conversations;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.getConversation = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const auth_user_id = req.user.user_id;
    const username = args.username;

    const query = await pool.query(
      `SELECT message_id, sender_id, recipient_id, message, sent_at 
      FROM messages 
      WHERE (sender_id = ($1) AND recipient_id IN (
        SELECT user_id 
        FROM users 
        WHERE username = ($2)
      )) OR 
      (sender_id IN (
        SELECT user_id 
        FROM users 
        WHERE username = ($2)
      ) AND recipient_id = ($1)) 
      ORDER BY sent_at DESC`,
      [auth_user_id, username]
    );

    const messages = query.rows;

    return messages;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Conversation to get User
exports.getConversationUser = async (parent, args) => {
  try {
    const user_id = parent.user_id;

    const query = await pool.query(
      `SELECT user_id, username, created_at 
      FROM users 
      WHERE user_id = ($1)`,
      [user_id]
    );

    const user = query.rows[0];

    return user;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Message to get sender User
exports.getSender = async (parent, args) => {
  try {
    const sender_id = parent.sender_id;

    const query = await pool.query(
      `SELECT user_id, username, created_at 
      FROM users 
      WHERE user_id = ($1)`,
      [sender_id]
    );

    const sender = query.rows[0];

    return sender;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Message to get recipient User
exports.getRecipient = async (parent, args) => {
  try {
    const recipient_id = parent.recipient_id;

    const query = await pool.query(
      `SELECT user_id, username, created_at 
      FROM users 
      WHERE user_id = ($1)`,
      [recipient_id]
    );

    const recipient = query.rows[0];

    return recipient;
  } catch (error) {
    throw new ApolloError(error);
  }
};

/* ========== Mutation Resolvers ========== */

exports.sendMessage = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const sender_id = req.user.user_id;
    const message = args.message;
    const recipient = args.recipient;

    const query = await pool.query(
      `INSERT INTO messages (sender_id, message, recipient_id) 
        SELECT ($1), ($2), user_id 
        FROM users 
        WHERE username = ($3) 
      RETURNING message_id, sender_id, recipient_id, message, sent_at`,
      [sender_id, message, recipient]
    );

    const newMessage = query.rows[0];

    pubsub.publish(NEW_MESSAGE, { newMessage: newMessage });

    return newMessage;
  } catch (error) {
    throw new ApolloError(error);
  }
};

/* ========== Subscription Resolvers ========== */

exports.newMessage = (parent, args, context) => {
  return pubsub.asyncIterator([NEW_MESSAGE]);
};

exports.newMessageFilter = (payload, variables, context) => {
  if (!context.isAuthenticated) {
    return false;
  }

  if (context.authUser.user_id !== payload.newMessage.recipient_id) {
    return false;
  }

  return true;
};
