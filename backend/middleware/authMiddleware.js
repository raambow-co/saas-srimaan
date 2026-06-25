import jwt from 'jsonwebtoken';
import { User, Agent } from '../models/dbClient.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'srimaan_solar_secret_key_2026_secure');
    
    // Find the user or agent based on ID and role in token
    let currentUser = null;
    if (decoded.role === 'ADMIN') {
      currentUser = await User.findById(decoded.id);
    } else if (decoded.role === 'AGENT') {
      currentUser = await Agent.findById(decoded.id);
    }

    if (!currentUser) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists' });
    }

    if (decoded.role === 'AGENT' && currentUser.status === 'Suspended') {
      return res.status(403).json({ message: 'Your agent account has been suspended' });
    }

    // Attach user information to request
    req.user = {
      id: currentUser._id || currentUser.id,
      username: currentUser.username,
      role: decoded.role,
      fullName: currentUser.fullName || currentUser.username,
      agentId: currentUser.agentId || null
    };

    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};
