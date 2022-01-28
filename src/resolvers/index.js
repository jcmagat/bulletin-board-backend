const { GraphQLUpload } = require("graphql-upload");
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
  addTextPost,
  addMediaPost,
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
  getConversations,
  getConversation,
  sendMessage,
  getConversationUser,
  getSender,
  getRecipient,
  newMessage,
  newMessageFilter,
} = require("./message");
const { withFilter } = require("graphql-subscriptions");

const resolvers = {
  Upload: GraphQLUpload,

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
    conversations: getConversations,
    conversation: getConversation,
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
    addTextPost: addTextPost,
    addMediaPost: addMediaPost,
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
      subscribe: withFilter(newMessage, newMessageFilter),
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
    __resolveType(post) {
      return post.type;
    },
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

  Conversation: {
    user: getConversationUser,
  },
};

module.exports = resolvers;
