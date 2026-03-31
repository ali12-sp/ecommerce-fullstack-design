const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send("Invalid token");
  }
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).send("Admin only");
  }

  next();
}

module.exports = {
  authRequired,
  adminRequired
};