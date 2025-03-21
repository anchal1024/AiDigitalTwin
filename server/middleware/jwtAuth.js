import jwt from "jsonwebtoken";
import "dotenv/config";

const extractToken = (authHeader) => {
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};

const jwtAuth = (req, res, next) => {
  try {
    const token = extractToken(req.headers["authorization"]);

    if (!token) {
      return res.status(401).json({
        error: "AUTH_REQUIRED",
        message: "Authentication token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "Token has expired",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        error: "INVALID_TOKEN",
        message: "Token is invalid or malformed",
      });
    }

    return res.status(500).json({
      error: "AUTH_ERROR",
      message: "Authentication error occurred",
    });
  }
};

export default jwtAuth;
