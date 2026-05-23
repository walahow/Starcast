const jwt = require("jsonwebtoken");

/**
 * JWT authentication middleware.
 * Checks for Bearer token in Authorization header or httpOnly cookie.
 * Attaches decoded user payload to req.user on success.
 */
function authMiddleware(req, res, next) {
  let token = null;

  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // Fallback to cookie
  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional auth — attaches user if token present, but doesn't block.
 */
function optionalAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
}

module.exports = { authMiddleware, optionalAuth };
