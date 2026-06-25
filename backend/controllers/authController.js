import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Agent, AuditLog } from '../models/dbClient.js';
import { getDbMode } from '../config/db.js';

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'srimaan_solar_secret_key_2026_secure',
    { expiresIn: '30d' }
  );
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide both username and password' });
  }

  try {
    // 1. Try to find Admin first (case-insensitive)
    let user = null;
    if (getDbMode()) {
      const admins = await User.find();
      user = admins.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    } else {
      user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    }
    
    let isAgent = false;
    let dbUser = user;

    if (!user) {
      // 2. Try to find Agent (case-insensitive)
      if (getDbMode()) {
        const agents = await Agent.find();
        user = agents.find(a => a.username.toLowerCase() === username.toLowerCase()) || null;
      } else {
        user = await Agent.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
      }
      isAgent = true;
      dbUser = user;
    }

    if (!dbUser) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check suspension for agents
    if (isAgent && dbUser.status === 'Suspended') {
      return res.status(403).json({ message: 'Your agent account has been suspended by the Admin' });
    }

    // Validate password
    const isMatch = await bcryptjs.compare(password, dbUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const role = isAgent ? 'AGENT' : dbUser.role || 'ADMIN';
    const token = generateToken(dbUser._id || dbUser.id, role);

    // Create Audit Log entry
    await AuditLog.create({
      actor: dbUser.username,
      action: 'LOGIN',
      details: `${role} logged in successfully.`
    });

    res.status(200).json({
      token,
      user: {
        id: dbUser._id || dbUser.id,
        username: dbUser.username,
        role: role,
        fullName: dbUser.fullName || dbUser.username,
        email: dbUser.email,
        agentId: isAgent ? dbUser.agentId : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const { id, role } = req.user;
    let profile = null;

    if (role === 'ADMIN') {
      profile = await User.findById(id);
    } else if (role === 'AGENT') {
      profile = await Agent.findById(id);
    }

    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: profile._id || profile.id,
      username: profile.username,
      role: role,
      fullName: profile.fullName || profile.username,
      email: profile.email,
      agentId: role === 'AGENT' ? profile.agentId : null,
      status: role === 'AGENT' ? profile.status : undefined,
      mobileNumber: profile.mobileNumber || undefined,
      joiningDate: profile.joiningDate || undefined
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
