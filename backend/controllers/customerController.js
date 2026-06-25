import fs from 'fs';
import csvParser from 'csv-parser';
import { Customer, Agent, Notification, AuditLog } from '../models/dbClient.js';

// Helper to auto-generate customer ID
const generateCustomerId = async () => {
  const count = await Customer.countDocuments();
  return `CUST${String(count + 1).padStart(4, '0')}`;
};

// Helper to push notifications
const pushNotification = async (title, message, recipientRole, recipientId = null) => {
  try {
    await Notification.create({
      title,
      message,
      recipientRole,
      recipientId,
      read: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getCustomers = async (req, res) => {
  try {
    const { role, agentId } = req.user;
    let filter = {};

    // Agents can only see their own assigned customers
    if (role === 'AGENT') {
      filter.assignedAgent = agentId;
    }

    const customers = await Customer.find(filter);
    res.status(200).json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check permissions
    if (req.user.role === 'AGENT' && customer.assignedAgent !== req.user.agentId) {
      return res.status(403).json({ message: 'Access denied: Customer is assigned to another agent' });
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCustomer = async (req, res) => {
  const {
    customerName, aadhaarNumber, mobileNumber, houseNumber, fullAddress,
    village, mandal, district, state, pincode, solarCapacityRequired,
    electricityBillAmount, assignedAgent
  } = req.body;

  if (!customerName || !aadhaarNumber || !mobileNumber) {
    return res.status(400).json({ message: 'Customer Name, Aadhaar Number, and Mobile Number are required' });
  }

  try {
    const customerId = await generateCustomerId();

    // Setup assignment: Agents can only assign to themselves. Admins can assign to anyone.
    const agent = req.user.role === 'AGENT' ? req.user.agentId : assignedAgent || '';

    const newCustomer = await Customer.create({
      customerId,
      customerName,
      aadhaarNumber,
      mobileNumber,
      houseNumber,
      fullAddress,
      village,
      mandal,
      district,
      state,
      pincode,
      solarCapacityRequired: Number(solarCapacityRequired) || 0,
      electricityBillAmount: Number(electricityBillAmount) || 0,
      assignedAgent: agent,
      status: 'New Lead',
      activityHistory: [{
        action: 'LEAD_CREATED',
        performedBy: req.user.username,
        timestamp: new Date(),
        notes: `Lead created by ${req.user.role}`
      }]
    });

    // Write Audit Log
    await AuditLog.create({
      actor: req.user.username,
      action: 'CREATE_CUSTOMER',
      details: `Created customer ${customerName} (ID: ${customerId})`
    });

    // Notify Admin
    await pushNotification(
      'New Customer Added',
      `Customer ${customerName} (ID: ${customerId}) has been added as a New Lead.`,
      'ADMIN'
    );

    // Notify Agent (if assigned and not self-added by agent)
    if (agent && req.user.role === 'ADMIN') {
      await pushNotification(
        'New Customer Assigned',
        `You have been assigned a new customer: ${customerName} (ID: ${customerId}).`,
        'AGENT',
        agent
      );
    }

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Role check for agents
    if (req.user.role === 'AGENT' && customer.assignedAgent !== req.user.agentId) {
      return res.status(403).json({ message: 'Access denied: Customer belongs to another agent' });
    }

    const {
      customerName, aadhaarNumber, mobileNumber, houseNumber, fullAddress,
      village, mandal, district, state, pincode, solarCapacityRequired,
      electricityBillAmount, assignedAgent, status
    } = req.body;

    const originalStatus = customer.status;
    const originalAgent = customer.assignedAgent;

    // Build activities timeline update
    const historyEntries = [];

    // Check status changes
    let finalStatus = customer.status;
    if (status && status !== customer.status) {
      finalStatus = status;
      historyEntries.push({
        action: 'STATUS_CHANGE',
        performedBy: req.user.username,
        timestamp: new Date(),
        notes: `Status updated from "${originalStatus}" to "${status}"`
      });

      // Notification logic
      if (req.user.role === 'AGENT') {
        // Notify Admin of agent status change
        await pushNotification(
          'Customer Status Updated',
          `Agent ${req.user.fullName} updated status of ${customer.customerName} to "${status}".`,
          'ADMIN'
        );
      } else {
        // Admin status change: Notify agent if assigned
        if (customer.assignedAgent) {
          await pushNotification(
            'Customer Status Changed',
            `Admin updated status of your customer ${customer.customerName} to "${status}".`,
            'AGENT',
            customer.assignedAgent
          );
        }
      }
    }

    // Check assignment change (Admin only)
    let finalAgent = customer.assignedAgent;
    if (req.user.role === 'ADMIN' && assignedAgent !== undefined && assignedAgent !== customer.assignedAgent) {
      finalAgent = assignedAgent;
      historyEntries.push({
        action: 'AGENT_REASSIGNED',
        performedBy: req.user.username,
        timestamp: new Date(),
        notes: `Assigned agent changed from "${originalAgent || 'Unassigned'}" to "${assignedAgent || 'Unassigned'}"`
      });

      if (assignedAgent) {
        await pushNotification(
          'Customer Assigned',
          `You have been assigned customer ${customer.customerName} (ID: ${customer.customerId}).`,
          'AGENT',
          assignedAgent
        );
      }
    }

    // Basic fields update
    const updateData = {
      customerName: customerName || customer.customerName,
      aadhaarNumber: aadhaarNumber || customer.aadhaarNumber,
      mobileNumber: mobileNumber || customer.mobileNumber,
      houseNumber: houseNumber !== undefined ? houseNumber : customer.houseNumber,
      fullAddress: fullAddress !== undefined ? fullAddress : customer.fullAddress,
      village: village !== undefined ? village : customer.village,
      mandal: mandal !== undefined ? mandal : customer.mandal,
      district: district !== undefined ? district : customer.district,
      state: state !== undefined ? state : customer.state,
      pincode: pincode !== undefined ? pincode : customer.pincode,
      solarCapacityRequired: solarCapacityRequired !== undefined ? Number(solarCapacityRequired) : customer.solarCapacityRequired,
      electricityBillAmount: electricityBillAmount !== undefined ? Number(electricityBillAmount) : customer.electricityBillAmount,
      assignedAgent: finalAgent,
      status: finalStatus
    };

    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Save history entries if any
    for (let entry of historyEntries) {
      await Customer.findByIdAndUpdate(req.params.id, {
        $push: { activityHistory: entry }
      });
    }

    await AuditLog.create({
      actor: req.user.username,
      action: 'UPDATE_CUSTOMER',
      details: `Updated customer ${customer.customerName} (ID: ${customer.customerId})`
    });

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Agents cannot delete customers
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Only Admins can delete customers' });
    }

    await Customer.findByIdAndDelete(req.params.id);

    // Delete associated files
    const files = [customer.customerPhoto, customer.aadhaarFront, customer.aadhaarBack];
    files.forEach(filePath => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to delete file ${filePath}:`, err);
        }
      }
    });

    await AuditLog.create({
      actor: req.user.username,
      action: 'DELETE_CUSTOMER',
      details: `Deleted customer ${customer.customerName} (ID: ${customer.customerId})`
    });

    res.status(200).json({ message: 'Customer record deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadCustomerDocuments = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check agent permission
    if (req.user.role === 'AGENT' && customer.assignedAgent !== req.user.agentId) {
      return res.status(403).json({ message: 'Access denied: Customer belongs to another agent' });
    }

    const updates = {};
    const filesUploaded = [];

    if (req.files) {
      if (req.files.customerPhoto) {
        updates.customerPhoto = req.files.customerPhoto[0].path;
        filesUploaded.push('Photo');
      }
      if (req.files.aadhaarFront) {
        updates.aadhaarFront = req.files.aadhaarFront[0].path;
        filesUploaded.push('Aadhaar Front');
      }
      if (req.files.aadhaarBack) {
        updates.aadhaarBack = req.files.aadhaarBack[0].path;
        filesUploaded.push('Aadhaar Back');
      }
    }

    if (filesUploaded.length === 0) {
      return res.status(400).json({ message: 'No documents were uploaded' });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, updates, { new: true });

    // Log update on activity timeline
    await Customer.findByIdAndUpdate(req.params.id, {
      $push: {
        activityHistory: {
          action: 'DOCUMENTS_UPLOADED',
          performedBy: req.user.username,
          timestamp: new Date(),
          notes: `Uploaded: ${filesUploaded.join(', ')}`
        }
      }
    });

    // Notify Admin
    await pushNotification(
      'Documents Uploaded',
      `Documents (${filesUploaded.join(', ')}) uploaded for customer ${customer.customerName} (ID: ${customer.customerId}) by ${req.user.role}.`,
      'ADMIN'
    );

    await AuditLog.create({
      actor: req.user.username,
      action: 'UPLOAD_DOCUMENTS',
      details: `Uploaded documents for customer ${customer.customerName} (ID: ${customer.customerId}): ${filesUploaded.join(', ')}`
    });

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const bulkImportCustomers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }

  const results = [];
  const errors = [];
  let rowCount = 0;

  try {
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => {
        rowCount++;
        // Validation check
        if (!data.customerName || !data.aadhaarNumber || !data.mobileNumber) {
          errors.push(`Row ${rowCount}: Name, Aadhaar, and Mobile number are required fields.`);
          return;
        }
        results.push(data);
      })
      .on('end', async () => {
        // Clean up uploaded temp CSV file
        fs.unlinkSync(req.file.path);

        if (errors.length > 0) {
          return res.status(400).json({ errors });
        }

        let importCount = 0;
        for (const row of results) {
          const customerId = await generateCustomerId();
          let agentId = row.assignedAgent || '';

          // If assignedAgent name/username is provided, map to their actual ID
          if (agentId) {
            const agentObj = await Agent.findOne({
              $or: [{ agentId: agentId }, { username: agentId }, { fullName: agentId }]
            });
            if (agentObj) {
              agentId = agentObj.agentId;
            } else {
              agentId = ''; // fall back to unassigned if agent doesn't exist
            }
          }

          await Customer.create({
            customerId,
            customerName: row.customerName,
            aadhaarNumber: row.aadhaarNumber,
            mobileNumber: row.mobileNumber,
            houseNumber: row.houseNumber || '',
            fullAddress: row.fullAddress || '',
            village: row.village || '',
            mandal: row.mandal || '',
            district: row.district || '',
            state: row.state || '',
            pincode: row.pincode || '',
            solarCapacityRequired: Number(row.solarCapacityRequired) || 0,
            electricityBillAmount: Number(row.electricityBillAmount) || 0,
            assignedAgent: agentId,
            status: row.status || 'New Lead',
            activityHistory: [{
              action: 'LEAD_IMPORTED',
              performedBy: req.user.username,
              timestamp: new Date(),
              notes: 'Imported via bulk CSV upload'
            }]
          });

          importCount++;
        }

        await AuditLog.create({
          actor: req.user.username,
          action: 'BULK_IMPORT_CUSTOMERS',
          details: `Imported ${importCount} customers successfully from CSV`
        });

        res.status(200).json({
          message: `Successfully imported ${importCount} customer records.`,
          count: importCount
        });
      });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error parsing CSV file' });
  }
};
