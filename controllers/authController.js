require("dotenv").config();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// for jwt, we are creating an access and refresh token
// access token is for a short time while refresh token is for a long time
// access token is held in memory by client after being issued by the server
// DO NOT store access token in localStorage or as a cookie
// We do not want a hacker to get access to the access token
// refresh tokens are issued as a http only cookie so they won't be accessible
// by javascript
// they have expiration at some point so when they do the user has to login again

// the REST API will use access token for protected routes until it expires
// it verifies the access token with middleware
// new token issued at refresh endpoint request when access token expires
// run node then require('crypto').randomBytes(64).toString('hex') in terminal
// to get ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET, store in env file

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  // do stuff
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) return res.status(401).json({ message: "Unauthorized" });

  // userInfo is being placed in the accessToken, frontend will need to decrypt the access token
  // to get username and roles
  // want to set the access token later to about 15 mins in prod
  // refresh token during deployment will be 7 days
  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: foundUser.username,
        roles: foundUser.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    // 1000 ms times 60 seconds times 60 minutes times 24 hours times 7 for 7 days
  });

  res.json({ accessToken });
};

// @desc refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      // create a new access token
      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      // respond with access token again
      res.json({ accessToken });
    }
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  // same options for when clearing the cookie
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

module.exports = { login, refresh, logout };
