const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

exports.auth = async (req, res, next) => {
  const authHeader = req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET, async function (err, decoded) {
      if (err) {
        console.log(err);

        return res.status(401).json({ success: false, message: err.message });
      }

      req.user = decoded;
      req.ip =
        req.headers["x-forwarded-for"]?.split(",").shift() ||
        req.socket?.remoteAddress;

      next();
    });
  } catch (e) {
    console.log(e);

    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

exports.optionalAuth = async (req, res, next) => {
  let token = req.cookies.jwt;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  next();
};

exports.protect = async (req, res, next) => {
  let token = req.cookies.jwt;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
