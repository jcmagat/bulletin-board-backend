const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { graphqlUploadExpress } = require("graphql-upload");
const { createServer } = require("http");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { ApolloServer } = require("apollo-server-express");
const { typeDefs: scalarTypeDefs } = require("graphql-scalars");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { authenticateToken } = require("./middlewares/auth");
const { authenticateToken: authenticateTokenNew } = require("./services/auth");

dotenv.config();

const app = express();
app.use(express.json());

// Set up CORS
const devCorsOptions = {
  origin: "*",
  credentials: true,
};

const prodCorsOptions = {
  origin: ["https://kind-brattain-40fab6.netlify.app", "https://cirqls.app"],
  credentials: true,
};

const corsOptions =
  process.env.NODE_ENV === "production" ? prodCorsOptions : devCorsOptions;
app.use(cors(corsOptions));

// Cookie parser
app.use(cookieParser());

// Auth middleware
app.use(authenticateToken);

// File upload middleware
app.use(graphqlUploadExpress());

// Create and start GraphQL server
async function startServer() {
  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs: [...scalarTypeDefs, typeDefs],
    resolvers: resolvers,
  });

  // Create Subscription server
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: (connectionParams) => {
        // Can be accessed as context in the subscription resolver
        return authenticateTokenNew(connectionParams.headers);
      },
    },
    { server: httpServer, path: "/subscriptions" }
  );

  // Create Query and Mutation server
  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res }),
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
  });

  await server.start();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 8080;
  httpServer.listen(port, () => console.log(`Listening on port ${port}...`));
}

startServer();
