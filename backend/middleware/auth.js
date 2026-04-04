const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

exports.auth = async (req, res, next) => {
  const token = req.header("authorization");
  // const io = req.app.get("io");
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

      // const whereClause = JSON.stringify({
      //   SQLWhere: `base.vLoginToken='${token}'`,
      //   SQLJoin: "",
      //   SQLOrderby: "",
      // });

      // console.log(whereClause, "[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[");
      // console.log(decoded);

      // const result = await new sql.Request()
      //   .input("_ActionuserId", sql.Int, decoded.userId)
      //   .input("JsonPara", sql.NVarChar, whereClause)
      //   .input("IsLogin", sql.NVarChar, "")
      //   .output("_RecCnt", sql.Int, 0)
      //   .execute("usp_UserLog_Get");
      // console.log(result);

      // const refreshedToken = jwt.sign(decoded, process.env.JWT_SECRET, {
      //   expiresIn: process.env.TOKEN_EXPIRATION,
      // });
      // io.emit(req.user.id, { token: refreshedToken });
      next();
    });
  } catch (e) {
    console.log(e);

    return res
      .status(enums.HTTP_CODES.UNAUTHORIZED)
      .json({ success: false, message: messages.INVALID_TOKEN });
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {}
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
