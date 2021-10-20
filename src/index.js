const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config({ path: "src/.env" });

// apollo-server-express
async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();
  server.applyMiddleware({ app });
}

startServer();

// REST
app.get("/", (req, res) => {
  res.send("Hello world!");
});

const usersRoute = require("./routes/users");
app.use("/users", usersRoute);

const postsRoute = require("./routes/posts");
app.use("/api/v1/posts", postsRoute);

// Connect to the database
mongoose
  .connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("DB Connected!"))
  .catch((err) => {
    console.log(`DB Connection Error: ${err.message}`);
  });

const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Listening on port ${port}...`));
