const jwt = require("jsonwebtoken");

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

const verifyToken = (token, isRefresh = false) => {
  const secret = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
