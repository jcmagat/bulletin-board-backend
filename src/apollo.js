const { createServer } = require("http");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { ApolloServer } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");
const { typeDefs: scalarTypeDefs } = require("graphql-scalars");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { verifyAuthToken } = require("./services/jwt");
const _ = require("lodash");

const pubsub = new PubSub();

// Format response for Apollo requests
const formatResponse = (
  response,
  { request: { operationName, variables } }
) => {
  if (operationName !== "HomePagePosts" && operationName !== "ExplorePagePosts")
    return response;

  // Sort HomePagePosts and ExplorePagePosts
  const key = operationName[0].toLowerCase() + operationName.substring(1);

  let posts = response.data[key];

  switch (variables.sort) {
    case "hot":
      posts = _.orderBy(
        posts,
        [
          (post) => {
            // Ignore time when sorting by created_at
            return post.created_at.setHours(0, 0, 0, 0);
          },
          "reactions.total",
          "comments_info.total",
        ],
        ["desc", "desc", "desc"]
      );
      break;
    case "top":
      posts = _.orderBy(posts, "reactions.total", "desc");
      break;
    case "controversial":
      posts = _.orderBy(
        posts,
        ["reactions.dislikes", "reactions.likes"],
        ["desc", "desc"]
      );
      break;
    default:
      // Posts are sorted new by default
      break;
  }

  let sortedPosts = { data: {} };
  sortedPosts.data[key] = posts;

  return _.assign({}, response, sortedPosts);
};

// Start Apollo Server
async function startServer(app) {
  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs: [...scalarTypeDefs, typeDefs],
    resolvers: resolvers,
    inheritResolversFromInterfaces: true,
  });

  // Create Subscription server
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: (connectionParams) => {
        // Can be accessed as context in the subscription resolver
        return { ...verifyAuthToken(connectionParams.headers), pubsub };
      },
    },
    { server: httpServer, path: "/subscriptions" }
  );

  // Create Query and Mutation server
  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => {
      return { req, res, ...verifyAuthToken(req.headers), pubsub };
    },
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
    formatResponse,
  });

  await server.start();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 8080;
  httpServer.listen(port, () => console.log(`Listening on port ${port}...`));
}

module.exports = startServer;
