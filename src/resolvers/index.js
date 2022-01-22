const { setCreatedSince } = require("./common");
const { register, login } = require("./auth");
const {
  getUser,
  getAuthUser,
  getFollowing,
  getFollowers,
  getUserPosts,
  getSavedPosts,
  follow,
  unfollow,
  removeFollower,
} = require("./user");
const {
  getAllCommunities,
  getCommunity,
  getCommunityMembers,
  getCommunityPosts,
  join,
  leave,
} = require("./community");
const {
  getAllPosts,
  getPostById,
  getPostCommunity,
  getPostCommentsInfo,
  getPostReactions,
  addPost,
  deletePost,
  addPostReaction,
  deletePostReaction,
  savePost,
  unsavePost,
} = require("./post");
const {
  getPostComments,
  getChildComments,
  getCommentReactions,
  addComment,
  deleteComment,
  addCommentReaction,
  deleteCommentReaction,
} = require("./comment");
const {
  getMessages,
  sendMessage,
  getSender,
  getRecipient,
  newMessage,
} = require("./message");
const { withFilter } = require("graphql-subscriptions");

const resolvers = {
  Query: {
    // User queries
    user: getUser,
    authUser: getAuthUser,

    // Community queries
    communities: getAllCommunities,
    community: getCommunity,

    // Post queries
    posts: getAllPosts,
    post: getPostById,

    // Comment queries
    comments: getPostComments,

    // Message queries
    messages: getMessages,
  },

  Mutation: {
    // Auth mutations
    register: register,
    login: login,

    // User mutations
    follow: follow,
    unfollow: unfollow,
    removeFollower: removeFollower,

    // Community mutations
    join: join,
    leave: leave,

    // Post mutations
    addPost: addPost,
    deletePost: deletePost,
    addPostReaction: addPostReaction,
    deletePostReaction: deletePostReaction,
    savePost: savePost,
    unsavePost: unsavePost,

    // Comment mutations
    addComment: addComment,
    deleteComment: deleteComment,
    addCommentReaction: addCommentReaction,
    deleteCommentReaction: deleteCommentReaction,

    // Message mutations
    sendMessage: sendMessage,
  },

  Subscription: {
    newMessage: {
      subscribe: withFilter(newMessage, (payload, variables, context) => {
        if (!context.isAuthenticated) {
          return false;
        }

        if (context.authUser.user_id !== payload.newMessage.recipient_id) {
          return false;
        }

        return true;
      }),
    },
  },

  User: {
    following: getFollowing,
    followers: getFollowers,
    posts: getUserPosts,
    saved_posts: getSavedPosts,
  },

  Community: {
    members: getCommunityMembers,
    posts: getCommunityPosts,
  },

  Post: {
    created_since: setCreatedSince,
    community: getPostCommunity,
    reactions: getPostReactions,
    comments_info: getPostCommentsInfo,
  },

  Comment: {
    created_since: setCreatedSince,
    reactions: getCommentReactions,
    child_comments: getChildComments,
  },

  Message: {
    sender: getSender,
    recipient: getRecipient,
  },
};

module.exports = resolvers;
