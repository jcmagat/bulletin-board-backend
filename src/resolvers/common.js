const pool = require("../database");
const { ApolloError } = require("apollo-server-express");

// Child resolver for Post and Comment to set created_since
exports.setCreatedSince = async (parent) => {
  const age = parent.age;
  if (!age) {
    return null;
  }

  const { years, months, days, hours, minutes } = age;
  let time;
  let ago;

  if (years) {
    time = years;
    ago = years > 1 ? " years ago" : " year ago";
  } else if (months) {
    time = months;
    ago = months > 1 ? " months ago" : " month ago";
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

// Child resolver for:
// Post to get the poster
// Comment to get the commenter
// Conversation to get the user
// Message to get the sender and recipient
exports.getUserById = async (parent, args, context, { path }) => {
  try {
    let user_id;

    if (path.typename === "Message" && path.key === "sender") {
      user_id = parent.sender_id;
    } else if (path.typename === "Message" && path.key === "recipient") {
      user_id = parent.recipient_id;
    } else {
      user_id = parent.user_id;
    }

    const query = await pool.query(
      `SELECT user_id, username, created_at, profile_pic_src 
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
