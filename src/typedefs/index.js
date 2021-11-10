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
    created_at: String!
    user_id: Int
  }

  # Queries
  type Query {
    posts: [Post]
    post(id: ID!): Post
  }

  # Mutations
  type Mutation {
    # Auth mutations
    register(email: String!, username: String!, password: String!): Register
    login(username: String!, password: String!): AuthData

    # Post mutations
    addPost(title: String!, description: String!): Post
    deletePost(id: ID!): Post
    likePost(id: ID!): Post
    unlikePost(id: ID!): Post
  }
`;

module.exports = typeDefs;
