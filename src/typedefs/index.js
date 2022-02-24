const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Upload

  type Success {
    success: Boolean!
  }

  type AuthData {
    username: String!
    accessToken: String!
    refreshToken: String!
    accessTokenExpiration: String!
    refreshTokenExpiration: String!
  }

  type User {
    user_id: ID!
    email: String
    username: String!
    created_at: DateTime!
    profile_pic_src: String
    following: [Follow]
    followers: [Follow]
    posts: [Post]
    comments: [Comment]
    saved_posts: [Post]
  }

  type Follow {
    username: String!
    followed_at: DateTime!
  }

  type Community {
    community_id: Int!
    name: String!
    title: String!
    description: String!
    created_at: DateTime!
    members: [User]
    posts: [Post]
  }

  interface Post {
    post_id: Int!
    title: String!
    created_at: DateTime!
    created_since: String
    poster: User
    community: Community
    reactions: Reactions
    comments_info: CommentsInfo
  }

  type TextPost implements Post {
    post_id: Int!
    title: String!
    created_at: DateTime!
    created_since: String
    poster: User
    community: Community
    reactions: Reactions
    comments_info: CommentsInfo
    description: String!
  }

  type MediaPost implements Post {
    post_id: Int!
    title: String!
    created_at: DateTime!
    created_since: String
    poster: User
    community: Community
    reactions: Reactions
    comments_info: CommentsInfo
    media_src: String!
  }

  type Reactions {
    likes: Int!
    dislikes: Int!
    total: Int!
    auth_user_reaction: String
  }

  type CommentsInfo {
    total: Int!
    comment_ids: [Int]
  }

  type Comment {
    comment_id: Int!
    parent_comment_id: Int
    post_id: Int!
    message: String!
    created_since: String
    commenter: User
    reactions: Reactions
    child_comments: [Comment]
  }

  type Message {
    message_id: Int!
    sender: User!
    recipient: User!
    message: String!
    sent_at: DateTime!
  }

  type Conversation {
    user: User!
    messages: [Message]
  }

  # Queries
  type Query {
    # User queries
    user(username: String!): User
    authUser: User

    # Community queries
    communities: [Community]
    community(name: String!): Community

    # Post queries
    homePagePosts(sort: String!): [Post]
    explorePagePosts(sort: String!): [Post]
    post(post_id: Int!): Post

    # Comment queries
    comments(post_id: Int!): [Comment]

    # Message queries
    conversations: [Conversation]
    conversation(username: String!): [Message]
  }

  # Mutations
  type Mutation {
    # Auth mutations
    signup(email: String!): Success
    register(token: String!, username: String!, password: String!): Success
    login(username: String!, password: String!): AuthData

    # User mutations
    follow(username: String!): User
    unfollow(username: String!): User
    removeFollower(username: String!): User
    changeUsername(username: String!): User
    changeProfilePic(profile_pic: Upload!): User
    changePassword(current_password: String!, new_password: String!): User
    confirmDeleteAccount(password: String!): Success

    # Community mutations
    join(community_id: Int!): Community
    leave(community_id: Int!): Community

    # Post mutations
    addTextPost(title: String!, description: String!, community_id: Int!): Post
    addMediaPost(title: String!, media: Upload!, community_id: Int!): Post
    deletePost(post_id: Int!): Post
    addPostReaction(post_id: Int!, reaction: String!): Post
    deletePostReaction(post_id: Int!): Post
    savePost(post_id: Int!): Post
    unsavePost(post_id: Int!): Post

    # Comment mutations
    addComment(parent_comment_id: Int, post_id: Int!, message: String!): Comment
    deleteComment(comment_id: Int!): Comment
    addCommentReaction(comment_id: Int!, reaction: String!): Comment
    deleteCommentReaction(comment_id: Int!): Comment

    # Message mutations
    sendMessage(recipient: String!, message: String!): Message
  }

  type Subscription {
    newMessage: Message
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

module.exports = typeDefs;
