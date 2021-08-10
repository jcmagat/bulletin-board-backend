const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// @desc Register a user
// @route POST /users
// @access Public
exports.registerUser = async (req, res, next) => {
  try {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const username = req.body.username;
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOne({ username: username });
    if (user) {
      return res.status(400).send("Username is already taken");
    }

    const newUser = await User.create({
      firstName: firstName,
      lastName: lastName,
      username: username,
      password: hashedPassword,
    });

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc Login a user
// @route POST /users/login
// @access Public
exports.loginUser = async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(400).send("Username not found");
    }

    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        username: user.username,
      };
      const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

      return res.status(200).json({
        success: true,
        accessToken: accessToken,
      });
    } else {
      return res.status(400).send("Incorrect password");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
