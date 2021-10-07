const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const app = express();
const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} = require("graphql");
const { graphqlHTTP } = require("express-graphql");

const Post = require("./models/Post");

app.use(express.json());
app.use(cors());

const PostType = new GraphQLObjectType({
  name: "Post",
  fields: () => ({
    _id: { type: GraphQLString },
    title: { type: GraphQLString },
    message: { type: GraphQLString },
    postedOn: { type: GraphQLString },
    postedBy: { type: GraphQLString },
    likes: { type: GraphQLInt },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "RootQueryType",
  fields: () => ({
    posts: {
      type: new GraphQLList(PostType),
      resolve: async () => {
        const posts = await Post.find();
        return posts;
      },
    },
  }),
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
});

const schema = new GraphQLSchema({
  query: RootQueryType,
});

app.use("/graphql", graphqlHTTP({ schema: schema, graphiql: true }));

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
