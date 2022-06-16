const { GraphQLUpload } = require("graphql-upload");
const { setCreatedSince, getUserById } = require("./common");
const { signup, registerOAuth, login, logout } = require("./auth");
const {
  getUser,
  getAuthUser,
  getFollowing,
  getFollowers,
  getUserPosts,
  getUserComments,
  getSavedPosts,
  follow,
  unfollow,
  removeFollower,
  changeEmail,
  changeUsername,
  changeProfilePic,
  changePassword,
  confirmDeleteAccount,
  deleteAccount,
} = require("./user");
const {
  getAllCommunities,
  getCommunity,
  getCommunityModerators,
  getCommunityMembers,
  getCommunityPosts,
  join,
  leave,
  createCommunity,
  editCommunity,
} = require("./community");
const {
  getHomePagePosts,
  getExplorePagePosts,
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
  getComment,
  getCommentReactions,
  getChildComments,
  addComment,
  deleteComment,
  addCommentReaction,
  deleteCommentReaction,
  readComments,
} = require("./comment");
const {
  getConversations,
  getConversation,
  sendMessage,
  readMessages,
  newMessage,
  newMessageFilter,
} = require("./message");
const {
  getNotifications,
  newNotification,
  newNotificationFilter,
} = require("./notification");
const { search } = require("./search");
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
    homePagePosts: getHomePagePosts,
    explorePagePosts: getExplorePagePosts,
    post: getPostById,

    // Comment queries
    postComments: getPostComments,
    comment: getComment,

    // Message queries
    conversations: getConversations,
    conversation: getConversation,

    // Notification queries
    notifications: getNotifications,

    // Search queries
    search: search,
  },

  Mutation: {
    // Auth mutations
    signup: signup,
    registerOAuth: registerOAuth,
    login: login,
    logout: logout,

    // User mutations
    follow: follow,
    unfollow: unfollow,
    removeFollower: removeFollower,
    changeEmail: changeEmail,
    changeUsername: changeUsername,
    changeProfilePic: changeProfilePic,
    changePassword: changePassword,
    confirmDeleteAccount: confirmDeleteAccount,
    deleteAccount: deleteAccount,

    // Community mutations
    join: join,
    leave: leave,
    createCommunity: createCommunity,
    editCommunity: editCommunity,

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
    readComments: readComments,

    // Message mutations
    sendMessage: sendMessage,
    readMessages: readMessages,
  },

  Subscription: {
    newMessage: {
      subscribe: withFilter(newMessage, newMessageFilter),
    },
    newNotification: {
      subscribe: withFilter(newNotification, newNotificationFilter),
    },
  },

  User: {
    following: getFollowing,
    followers: getFollowers,
    posts: getUserPosts,
    comments: getUserComments,
    saved_posts: getSavedPosts,
  },

  Community: {
    moderators: getCommunityModerators,
    members: getCommunityMembers,
    posts: getCommunityPosts,
  },

  Post: {
    __resolveType(post) {
      return post.type;
    },
    created_since: setCreatedSince,
    poster: getUserById,
    community: getPostCommunity,
    reactions: getPostReactions,
    comments_info: getPostCommentsInfo,
  },

  Comment: {
    created_since: setCreatedSince,
    commenter: getUserById,
    reactions: getCommentReactions,
    child_comments: getChildComments,
  },

  Message: {
    sender: getUserById,
    recipient: getUserById,
  },

  Conversation: {
    user: getUserById,
  },

  Notification: {
    __resolveType(obj) {
      if (obj.message_id) {
        return "Message";
      } else if (obj.comment_id) {
        return "Comment";
      }
    },
  },

  SearchResult: {
    __resolveType(obj) {
      if (obj.post_id) {
        // Note: posts also have user_id and community_id
        return obj.type;
      } else if (obj.user_id) {
        return "User";
      } else {
        return "Community";
      }
    },
  },
};

module.exports = resolvers;
