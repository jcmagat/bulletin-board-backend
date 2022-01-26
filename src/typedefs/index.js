const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Upload

  type File {
    url: String!
  }

  type Register {
    registered: Boolean!
  }

  type AuthData {
    username: String!
    accessToken: String!
    refreshToken: String!
    accessTokenExpiration: String!
    refreshTokenExpiration: String!
  }

  type User {
    username: String!
    created_at: DateTime!
    following: [Follow]
    followers: [Follow]
    posts: [Post]
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

  type Post {
    post_id: Int!
    title: String!
    description: String!
    created_since: String
    username: String
    community: Community
    reactions: Reactions
    comments_info: CommentsInfo
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
    username: String
    message: String!
    created_since: String
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
    posts: [Post]
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
    register(email: String!, username: String!, password: String!): Register
    login(username: String!, password: String!): AuthData

    # User mutations
    follow(username: String!): User
    unfollow(username: String!): User
    removeFollower(username: String!): User

    # Community mutations
    join(community_id: Int!): Community
    leave(community_id: Int!): Community

    # Post mutations
    addPost(title: String!, description: String!, community_id: Int!): Post
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

    uploadFile(file: Upload!): File!
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
