const User = require("../models/User");
const bcrypt = require("bcrypt");

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
      return res.status(409).send("Username is already taken");
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
      return res.status(404).send("Username not found");
    }

    if (await bcrypt.compare(password, user.password)) {
      return res.status(200).json({
        success: true,
      });
    } else {
      return res.status(404).send("Incorrect password");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
