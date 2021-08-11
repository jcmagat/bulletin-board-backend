const express = require("express");
const { getPosts, addPost, deletePost } = require("../controllers/posts");
const { authenticateToken } = require("../controllers/users");

const router = express.Router();

router.route("/").get(getPosts);
router.post("/", authenticateToken, addPost);

router.route("/:id").delete(deletePost);

module.exports = router;
