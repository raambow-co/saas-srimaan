import bcryptjs from 'bcryptjs';
import { Agent, Customer, AuditLog } from '../models/dbClient.js';

export const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find();
    res.status(200).json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    res.status(200).json(agent);
  } catch (error) {
    console.error('Get agent by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAgent = async (req, res) => {
  const { fullName, mobileNumber, email, address, username, password } = req.body;

  if (!fullName || !mobileNumber || !email || !username || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Check if username already exists in Agent or User
    const existingAgent = await Agent.findOne({ username });
    if (existingAgent) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Auto-generate Agent ID
    const count = await Agent.countDocuments();
    const agentId = `AGT${String(count + 1).padStart(3, '0')}`;

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newAgent = await Agent.create({
      agentId,
      fullName,
      mobileNumber,
      email,
      address,
      username,
      password: hashedPassword,
      status: 'Active'
    });

    await AuditLog.create({
      actor: req.user.username,
      action: 'CREATE_AGENT',
      details: `Created agent ${fullName} (ID: ${agentId}, Username: ${username})`
    });

    res.status(201).json(newAgent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAgent = async (req, res) => {
  const { fullName, mobileNumber, email, address } = req.body;

  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const updatedAgent = await Agent.findByIdAndUpdate(req.params.id, {
      fullName: fullName || agent.fullName,
      mobileNumber: mobileNumber || agent.mobileNumber,
      email: email || agent.email,
      address: address || agent.address
    }, { new: true });

    await AuditLog.create({
      actor: req.user.username,
      action: 'UPDATE_AGENT',
      details: `Updated agent details for ${agent.fullName} (ID: ${agent.agentId})`
    });

    res.status(200).json(updatedAgent);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleSuspendAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const newStatus = agent.status === 'Active' ? 'Suspended' : 'Active';
    const updatedAgent = await Agent.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });

    await AuditLog.create({
      actor: req.user.username,
      action: newStatus === 'Suspended' ? 'SUSPEND_AGENT' : 'UNSUSPEND_AGENT',
      details: `${newStatus === 'Suspended' ? 'Suspended' : 'Activated'} agent ${agent.fullName} (ID: ${agent.agentId})`
    });

    res.status(200).json(updatedAgent);
  } catch (error) {
    console.error('Toggle suspend agent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetAgentPassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }

  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await Agent.findByIdAndUpdate(req.params.id, { password: hashedPassword });

    await AuditLog.create({
      actor: req.user.username,
      action: 'RESET_AGENT_PASSWORD',
      details: `Reset password for agent ${agent.fullName} (ID: ${agent.agentId})`
    });

    res.status(200).json({ message: 'Agent password reset successfully' });
  } catch (error) {
    console.error('Reset agent password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    await Agent.findByIdAndDelete(req.params.id);

    // Unassign customers associated with this agent
    const customers = await Customer.find({ assignedAgent: agent.agentId });
    for (let c of customers) {
      await Customer.findByIdAndUpdate(c._id || c.id, {
        assignedAgent: '',
        $push: {
          activityHistory: {
            action: 'UNASSIGNED',
            performedBy: req.user.username,
            timestamp: new Date(),
            notes: 'Agent deleted from the system'
          }
        }
      });
    }

    await AuditLog.create({
      actor: req.user.username,
      action: 'DELETE_AGENT',
      details: `Deleted agent ${agent.fullName} (ID: ${agent.agentId}). Unassigned ${customers.length} customers.`
    });

    res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAgentPerformance = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const customers = await Customer.find({ assignedAgent: agent.agentId });

    // Count statistics
    const totalCustomers = customers.length;
    const pendingCustomers = customers.filter(c => ['New Lead', 'In Progress', 'Site Inspection', 'Document Verification', 'Installation Pending'].includes(c.status)).length;
    const approvedCustomers = customers.filter(c => c.status === 'Approved' || c.status === 'Installed').length;
    const rejectedCustomers = customers.filter(c => c.status === 'Rejected').length;
    const installedCustomers = customers.filter(c => c.status === 'Installed').length;

    // Monthly customer additions (last 6 months)
    const monthlyAdditions = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyAdditions[label] = 0;
    }

    customers.forEach(c => {
      const date = new Date(c.createdAt || c.joiningDate || new Date());
      const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyAdditions[label] !== undefined) {
        monthlyAdditions[label]++;
      }
    });

    const chartData = Object.keys(monthlyAdditions).map(month => ({
      month,
      leads: monthlyAdditions[month]
    }));

    const conversionRate = totalCustomers > 0 ? Math.round((approvedCustomers / totalCustomers) * 100) : 0;

    res.status(200).json({
      agent: {
        agentId: agent.agentId,
        fullName: agent.fullName,
        joiningDate: agent.joiningDate
      },
      stats: {
        totalCustomers,
        pendingCustomers,
        approvedCustomers,
        rejectedCustomers,
        installedCustomers,
        conversionRate
      },
      chartData
    });
  } catch (error) {
    console.error('Get agent performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
