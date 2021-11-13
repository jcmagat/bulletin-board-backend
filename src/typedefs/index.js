const { gql } = require("apollo-server-express");

const typeDefs = gql`
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

  type Post {
    post_id: Int!
    title: String!
    description: String!
    username: String!
    created_since: String
  }

  type PostReaction {
    post_id: Int!
    username: String!
  }

  # Queries
  type Query {
    posts: [Post]
    post(post_id: Int!): Post
  }

  # Mutations
  type Mutation {
    # Auth mutations
    register(email: String!, username: String!, password: String!): Register
    login(username: String!, password: String!): AuthData

    # Post mutations
    addPost(title: String!, description: String!): Post
    deletePost(post_id: Int!): Post
    addPostReaction(post_id: Int!): PostReaction
    deletePostReaction(post_id: Int!): PostReaction
  }
`;

module.exports = typeDefs;
