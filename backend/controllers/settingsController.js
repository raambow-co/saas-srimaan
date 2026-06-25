import bcryptjs from 'bcryptjs';
import { Settings, User, Agent, Customer, Notification, AuditLog } from '../models/dbClient.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ companyName: 'Srimaan Solar', logoUrl: '' });
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req, res) => {
  const { companyName } = req.body;
  const logoUrl = req.file ? req.file.path : undefined;

  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ companyName: 'Srimaan Solar', logoUrl: '' });
    }

    const updates = {
      companyName: companyName || settings.companyName,
    };
    if (logoUrl) {
      updates.logoUrl = logoUrl;
    }

    const updated = await Settings.findByIdAndUpdate(settings._id || settings.id, updates, { new: true });

    await AuditLog.create({
      actor: req.user.username,
      action: 'UPDATE_SETTINGS',
      details: `Updated settings. Company Name: ${updated.companyName}`
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNewAdmin = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if username exists in Users
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin username already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newAdmin = await User.create({
      username,
      password: hashedPassword,
      role: 'ADMIN',
      email: email || ''
    });

    await AuditLog.create({
      actor: req.user.username,
      action: 'CREATE_ADMIN',
      details: `Created new admin account: ${username}`
    });

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin._id || newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email
      }
    });
  } catch (error) {
    console.error('Create new admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const backupDatabase = async (req, res) => {
  try {
    const admins = await User.find({});
    const agents = await Agent.find({});
    const customers = await Customer.find({});
    const notifications = await Notification.find({});
    const settings = await Settings.find({});
    const auditLogs = await AuditLog.find({});

    const backupData = {
      admins,
      agents,
      customers,
      notifications,
      settings,
      auditLogs,
      backupTimestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    // Return as attachment
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=srimaan_solar_backup_${Date.now()}.json`);
    res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Database backup failed' });
  }
};

export const restoreDatabase = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a backup JSON file' });
  }

  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const backupData = JSON.parse(fileContent);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Basic structure check
    if (!backupData.admins || !backupData.agents || !backupData.customers) {
      return res.status(400).json({ message: 'Invalid backup file structure' });
    }

    // Restore Collections
    // 1. Admins
    await User.deleteMany({});
    for (let admin of backupData.admins) {
      await User.create(admin);
    }

    // 2. Agents
    await Agent.deleteMany({});
    for (let agent of backupData.agents) {
      await Agent.create(agent);
    }

    // 3. Customers
    await Customer.deleteMany({});
    for (let customer of backupData.customers) {
      await Customer.create(customer);
    }

    // 4. Notifications
    await Notification.deleteMany({});
    if (backupData.notifications) {
      for (let note of backupData.notifications) {
        await Notification.create(note);
      }
    }

    // 5. Settings
    await Settings.deleteMany({});
    if (backupData.settings) {
      for (let s of backupData.settings) {
        await Settings.create(s);
      }
    }

    // 6. Audit Logs
    await AuditLog.deleteMany({});
    if (backupData.auditLogs) {
      for (let log of backupData.auditLogs) {
        await AuditLog.create(log);
      }
    }

    await AuditLog.create({
      actor: req.user.username,
      action: 'RESTORE_DATABASE',
      details: `Database restored from backup timestamped: ${backupData.backupTimestamp || 'Unknown'}`
    });

    res.status(200).json({ message: 'Database restored successfully' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ message: 'Database restore failed. Ensure file is a valid backup JSON.' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({});
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.status(200).json(logs.slice(0, 100)); // limit to latest 100 entries
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getDashboardStats = async (req, res) => {
  try {
    const totalAgents = await Agent.countDocuments({});
    const totalCustomers = await Customer.countDocuments({});
    
    // Today's leads calculation
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const customers = await Customer.find({});
    const todaysLeads = customers.filter(c => new Date(c.createdAt || new Date()) >= todayStart).length;

    const pendingCustomers = customers.filter(c => ['New Lead', 'In Progress', 'Site Inspection', 'Document Verification', 'Installation Pending'].includes(c.status)).length;
    const approvedCustomers = customers.filter(c => c.status === 'Approved' || c.status === 'Installed').length;
    const rejectedCustomers = customers.filter(c => c.status === 'Rejected').length;

    // Compile recent customer activities (Timeline)
    // Combine customer history lines into a single list
    let timeline = [];
    customers.forEach(c => {
      if (c.activityHistory) {
        c.activityHistory.forEach(h => {
          timeline.push({
            customerId: c.customerId,
            customerName: c.customerName,
            action: h.action,
            performedBy: h.performedBy,
            timestamp: h.timestamp,
            notes: h.notes
          });
        });
      }
    });

    // Sort timeline descending
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      stats: {
        totalAgents,
        totalCustomers,
        todaysLeads,
        pendingCustomers,
        approvedCustomers,
        rejectedCustomers
      },
      timeline: timeline.slice(0, 15) // latest 15 timeline items
    });
  } catch (error) {
    console.error('Dashboard stats compilation failed:', error);
    res.status(500).json({ message: 'Server error compiling dashboard metrics' });
  }
};
