import { Customer, Agent } from '../models/dbClient.js';

export const getReportsData = async (req, res) => {
  try {
    const customers = await Customer.find({});
    const agents = await Agent.find({});

    // 1. Agent-wise Report
    const agentReport = agents.map(agent => {
      const agentCustomers = customers.filter(c => c.assignedAgent === agent.agentId);
      const total = agentCustomers.length;
      const approved = agentCustomers.filter(c => c.status === 'Approved').length;
      const installed = agentCustomers.filter(c => c.status === 'Installed').length;
      const rejected = agentCustomers.filter(c => c.status === 'Rejected').length;
      const inProgress = agentCustomers.filter(c => ['New Lead', 'In Progress', 'Site Inspection', 'Document Verification', 'Installation Pending'].includes(c.status)).length;
      
      return {
        agentId: agent.agentId,
        fullName: agent.fullName,
        total,
        converted: installed + approved,
        pending: inProgress,
        rejected,
        conversionRate: total > 0 ? Math.round(((installed + approved) / total) * 100) : 0
      };
    });

    // 2. Monthly Customer Report (Last 6 Months)
    const monthlyReport = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyReport[label] = { label, leads: 0, installed: 0 };
    }

    customers.forEach(c => {
      const date = new Date(c.createdAt || new Date());
      const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyReport[label]) {
        monthlyReport[label].leads++;
        if (c.status === 'Installed') {
          monthlyReport[label].installed++;
        }
      }
    });

    const monthlyReportArray = Object.values(monthlyReport);

    // 3. Installation Status Report
    const installationReport = {
      newLead: customers.filter(c => c.status === 'New Lead').length,
      inProgress: customers.filter(c => c.status === 'In Progress').length,
      siteInspection: customers.filter(c => c.status === 'Site Inspection').length,
      docVerification: customers.filter(c => c.status === 'Document Verification').length,
      approved: customers.filter(c => c.status === 'Approved').length,
      installationPending: customers.filter(c => c.status === 'Installation Pending').length,
      installed: customers.filter(c => c.status === 'Installed').length,
      rejected: customers.filter(c => c.status === 'Rejected').length
    };

    // 4. Revenue Report (Assumes standard price is Rs. 50,000 / kW)
    // Compiled into monthly revenue (Total value of Approved + Installed capacities)
    const revenueReport = {
      totalInstalledCapacity: customers.filter(c => c.status === 'Installed').reduce((sum, c) => sum + (c.solarCapacityRequired || 0), 0),
      totalPendingCapacity: customers.filter(c => ['Approved', 'Installation Pending'].includes(c.status)).reduce((sum, c) => sum + (c.solarCapacityRequired || 0), 0),
      get installedRevenue() { return this.totalInstalledCapacity * 50000; },
      get pendingRevenue() { return this.totalPendingCapacity * 50000; },
      get totalRevenue() { return this.installedRevenue + this.pendingRevenue; }
    };

    // 5. District-wise Report
    const districts = {};
    customers.forEach(c => {
      const dist = c.district || 'Unspecified';
      if (!districts[dist]) {
        districts[dist] = { district: dist, count: 0, installed: 0 };
      }
      districts[dist].count++;
      if (c.status === 'Installed') {
        districts[dist].installed++;
      }
    });

    const districtReportArray = Object.values(districts);

    res.status(200).json({
      agentReport,
      monthlyReport: monthlyReportArray,
      installationReport,
      revenueReport: {
        totalInstalledCapacity: revenueReport.totalInstalledCapacity,
        totalPendingCapacity: revenueReport.totalPendingCapacity,
        installedRevenue: revenueReport.installedRevenue,
        pendingRevenue: revenueReport.pendingRevenue,
        totalRevenue: revenueReport.totalRevenue
      },
      districtReport: districtReportArray
    });
  } catch (error) {
    console.error('Get reports data error:', error);
    res.status(500).json({ message: 'Server error compiling reports' });
  }
};
