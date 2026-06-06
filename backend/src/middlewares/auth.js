const { verifyToken: jwtVerify } = require('../utils/jwt');

// Middleware to verify the JWT token from the headers
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwtVerify(token);
    req.user = decoded; // Attaches { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Middleware to restrict access by user roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to perform this action.' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  restrictTo
};
