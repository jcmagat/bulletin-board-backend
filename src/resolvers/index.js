const { GraphQLUpload } = require("graphql-upload");
const { setCreatedSince, getUserById } = require("./common");
const { signup, register, login } = require("./auth");
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
  changeUsername,
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
  getCommentReactions,
  getChildComments,
  addComment,
  deleteComment,
  addCommentReaction,
  deleteCommentReaction,
} = require("./comment");
const {
  getConversations,
  getConversation,
  sendMessage,
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
    homePagePosts: getHomePagePosts,
    explorePagePosts: getExplorePagePosts,
    post: getPostById,

    // Comment queries
    comments: getPostComments,

    // Message queries
    conversations: getConversations,
    conversation: getConversation,
  },

  Mutation: {
    // Auth mutations
    signup: signup,
    register: register,
    login: login,

    // User mutations
    follow: follow,
    unfollow: unfollow,
    removeFollower: removeFollower,
    changeUsername: changeUsername,

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
    comments: getUserComments,
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
};

module.exports = resolvers;
