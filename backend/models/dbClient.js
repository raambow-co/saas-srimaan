import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { getDbMode } from '../config/db.js';
import { MockModel } from './mockDb.js';

// Define Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'ADMIN' },
  email: { type: String }
}, { timestamps: true });

const agentSchema = new mongoose.Schema({
  agentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String },
  status: { type: String, default: 'Active' }, // Active, Suspended
  joiningDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  aadhaarNumber: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  houseNumber: { type: String },
  fullAddress: { type: String },
  village: { type: String },
  mandal: { type: String },
  district: { type: String },
  state: { type: String },
  pincode: { type: String },
  solarCapacityRequired: { type: Number },
  electricityBillAmount: { type: Number },
  assignedAgent: { type: String }, // agentId
  customerPhoto: { type: String },
  aadhaarFront: { type: String },
  aadhaarBack: { type: String },
  status: { type: String, default: 'New Lead' },
  activityHistory: [{
    action: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now },
    notes: String
  }]
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipientRole: { type: String, required: true }, // ADMIN, AGENT
  recipientId: { type: String, default: null }, // agentId or null for ADMIN
  read: { type: Boolean, default: false }
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Srimaan Solar' },
  logoUrl: { type: String, default: '' }
}, { timestamps: true });

const auditLogSchema = new mongoose.Schema({
  actor: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Compile Mongoose models
const MongooseUser = mongoose.model('User', userSchema);
const MongooseAgent = mongoose.model('Agent', agentSchema);
const MongooseCustomer = mongoose.model('Customer', customerSchema);
const MongooseNotification = mongoose.model('Notification', notificationSchema);
const MongooseSettings = mongoose.model('Settings', settingsSchema);
const MongooseAuditLog = mongoose.model('AuditLog', auditLogSchema);

// Hash seed passwords
const adminPasswordHash = bcryptjs.hashSync('srimaan$123', 10);
const agentPasswordHash = bcryptjs.hashSync('agent$123', 10);

// Sample data
const defaultAdmins = [
  {
    _id: 'admin_seed_1',
    username: 'Srimaan_solar',
    password: adminPasswordHash,
    role: 'ADMIN',
    email: 'admin@srimaansolar.com'
  }
];

const sampleAgentNames = [
  'Ravi Kumar', 'Suresh Reddy', 'Mahesh Babu', 'Praveen Kumar', 'Kiran Kumar',
  'Srinivas Rao', ' राजेश Naidu', 'Ganesh Kumar', 'Venkatesh Reddy', 'Harish Kumar'
];

// Clean up agent names for usernames
const getCleanUsername = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

const defaultAgents = sampleAgentNames.map((name, i) => {
  const indexStr = String(i + 1).padStart(3, '0');
  const user = getCleanUsername(name);
  return {
    _id: `agent_seed_${i + 1}`,
    agentId: `AGT${indexStr}`,
    fullName: name,
    mobileNumber: `98765432${indexStr.slice(1)}`,
    email: `${user}@srimaansolar.com`,
    address: `${name.split(' ')[1] || 'Vijayawada'}, Andhra Pradesh`,
    status: 'Active',
    joiningDate: '2026-06-01',
    username: user,
    password: agentPasswordHash
  };
});

const defaultSettings = [
  {
    _id: 'settings_seed_1',
    companyName: 'Srimaan Solar',
    logoUrl: ''
  }
];

const defaultCustomers = [
  {
    _id: 'cust_seed_1',
    customerId: 'CUST0001',
    customerName: 'Aditya Naidu',
    aadhaarNumber: '908765432101',
    mobileNumber: '9988776655',
    houseNumber: '4-89/A',
    fullAddress: 'Temple Street, Gopalapuram, Krishna Dist, AP',
    village: 'Gopalapuram',
    mandal: 'Pamarru',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    pincode: '521157',
    solarCapacityRequired: 5,
    electricityBillAmount: 3500,
    assignedAgent: 'AGT001',
    status: 'Installed',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'ravi_kumar', timestamp: '2026-06-01T10:00:00.000Z', notes: 'Lead registered by agent.' },
      { action: 'STATUS_CHANGE', performedBy: 'ravi_kumar', timestamp: '2026-06-03T11:30:00.000Z', notes: 'Updated status: In Progress.' },
      { action: 'STATUS_CHANGE', performedBy: 'ravi_kumar', timestamp: '2026-06-05T14:00:00.000Z', notes: 'Site Inspection scheduled.' },
      { action: 'STATUS_CHANGE', performedBy: 'ravi_kumar', timestamp: '2026-06-07T09:15:00.000Z', notes: 'Document Verification.' },
      { action: 'STATUS_CHANGE', performedBy: 'Srimaan_solar', timestamp: '2026-06-08T16:45:00.000Z', notes: 'Approved by admin.' },
      { action: 'STATUS_CHANGE', performedBy: 'ravi_kumar', timestamp: '2026-06-12T10:30:00.000Z', notes: 'Installation Completed.' }
    ]
  },
  {
    _id: 'cust_seed_2',
    customerId: 'CUST0002',
    customerName: 'Venkata Satish',
    aadhaarNumber: '876543210987',
    mobileNumber: '9848022338',
    houseNumber: '10-23-1',
    fullAddress: 'Ganga Street, Vuyyuru, Krishna, AP',
    village: 'Vuyyuru',
    mandal: 'Vuyyuru',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    pincode: '521165',
    solarCapacityRequired: 3,
    electricityBillAmount: 2200,
    assignedAgent: 'AGT002',
    status: 'Installation Pending',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'suresh_reddy', timestamp: '2026-06-05T10:00:00.000Z', notes: 'Lead registered.' },
      { action: 'STATUS_CHANGE', performedBy: 'Srimaan_solar', timestamp: '2026-06-12T11:00:00.000Z', notes: 'Documents verified and approved.' }
    ]
  },
  {
    _id: 'cust_seed_3',
    customerId: 'CUST0003',
    customerName: 'Kiran Reddy',
    aadhaarNumber: '765432109876',
    mobileNumber: '8123456789',
    houseNumber: '1-45',
    fullAddress: 'Guntur Rural, Guntur, AP',
    village: 'Guntur Rural',
    mandal: 'Guntur',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    pincode: '522001',
    solarCapacityRequired: 10,
    electricityBillAmount: 8500,
    assignedAgent: 'AGT003',
    status: 'Approved',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'mahesh_babu', timestamp: '2026-06-08T10:00:00.000Z', notes: 'Lead registered.' },
      { action: 'STATUS_CHANGE', performedBy: 'Srimaan_solar', timestamp: '2026-06-15T15:00:00.000Z', notes: 'Lead approved by Admin.' }
    ]
  },
  {
    _id: 'cust_seed_4',
    customerId: 'CUST0004',
    customerName: 'Sunita Sharma',
    aadhaarNumber: '654321098765',
    mobileNumber: '9112233445',
    houseNumber: 'Plot 402',
    fullAddress: 'Madhapur, Hyderabad, TS',
    village: 'Madhapur',
    mandal: 'Serilingampally',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    solarCapacityRequired: 8,
    electricityBillAmount: 6200,
    assignedAgent: 'AGT004',
    status: 'Document Verification',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'praveen_kumar', timestamp: '2026-06-10T12:00:00.000Z', notes: 'Lead added.' },
      { action: 'STATUS_CHANGE', performedBy: 'praveen_kumar', timestamp: '2026-06-14T09:30:00.000Z', notes: 'Uploaded Aadhaar front and back for verification.' }
    ]
  },
  {
    _id: 'cust_seed_5',
    customerId: 'CUST0005',
    customerName: 'Srinivas Rao',
    aadhaarNumber: '543210987654',
    mobileNumber: '9000111222',
    houseNumber: '2-12',
    fullAddress: 'Benz Circle, Vijayawada, Krishna, AP',
    village: 'Benz Circle',
    mandal: 'Vijayawada Urban',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    pincode: '520010',
    solarCapacityRequired: 4,
    electricityBillAmount: 2800,
    assignedAgent: 'AGT005',
    status: 'Site Inspection',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'kiran_kumar', timestamp: '2026-06-12T10:00:00.000Z', notes: 'Lead registered.' },
      { action: 'STATUS_CHANGE', performedBy: 'kiran_kumar', timestamp: '2026-06-18T14:30:00.000Z', notes: 'Site Inspection conducted by engineer.' }
    ]
  },
  {
    _id: 'cust_seed_6',
    customerId: 'CUST0006',
    customerName: 'Anil Kumar',
    aadhaarNumber: '432109876543',
    mobileNumber: '8008123456',
    houseNumber: '5-67',
    fullAddress: 'Visakhapatnam Beach Road, Vizag, AP',
    village: 'Beach Road',
    mandal: 'Visakhapatnam Urban',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    pincode: '530002',
    solarCapacityRequired: 6,
    electricityBillAmount: 4900,
    assignedAgent: 'AGT006',
    status: 'In Progress',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'srinivas_rao', timestamp: '2026-06-15T09:00:00.000Z', notes: 'Contact initiated and details logged.' }
    ]
  },
  {
    _id: 'cust_seed_7',
    customerId: 'CUST0007',
    customerName: 'Rajesh Naidu',
    aadhaarNumber: '321098765432',
    mobileNumber: '9550123456',
    houseNumber: '12-4B',
    fullAddress: 'Tirupati, Chittoor, AP',
    village: 'Tirupati',
    mandal: 'Tirupati',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    pincode: '517501',
    solarCapacityRequired: 5,
    electricityBillAmount: 3800,
    assignedAgent: 'AGT007',
    status: 'New Lead',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'rajesh_naidu', timestamp: '2026-06-18T11:00:00.000Z', notes: 'Lead added from marketing campaign.' }
    ]
  },
  {
    _id: 'cust_seed_8',
    customerId: 'CUST0008',
    customerName: 'Ganesh Kumar',
    aadhaarNumber: '210987654321',
    mobileNumber: '7013456789',
    houseNumber: '3-40',
    fullAddress: 'Nellore Town, Nellore, AP',
    village: 'Nellore',
    mandal: 'Nellore',
    district: 'Nellore',
    state: 'Andhra Pradesh',
    pincode: '524001',
    solarCapacityRequired: 4,
    electricityBillAmount: 3200,
    assignedAgent: 'AGT008',
    status: 'Rejected',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'ganesh_kumar', timestamp: '2026-06-20T10:00:00.000Z', notes: 'Lead added.' },
      { action: 'STATUS_CHANGE', performedBy: 'Srimaan_solar', timestamp: '2026-06-22T16:00:00.000Z', notes: 'Rejected: Inadequate structural support for solar panels on roof.' }
    ]
  },
  {
    _id: 'cust_seed_9',
    customerId: 'CUST0009',
    customerName: 'Venkatesh Reddy',
    aadhaarNumber: '109876543210',
    mobileNumber: '9490123456',
    houseNumber: '7-123',
    fullAddress: 'Kurnool, AP',
    village: 'Kurnool',
    mandal: 'Kurnool',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    pincode: '518001',
    solarCapacityRequired: 12,
    electricityBillAmount: 11000,
    assignedAgent: 'AGT009',
    status: 'Installed',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'venkatesh_reddy', timestamp: '2026-06-02T10:00:00.000Z', notes: 'Lead added.' },
      { action: 'STATUS_CHANGE', performedBy: 'Srimaan_solar', timestamp: '2026-06-08T11:00:00.000Z', notes: 'Lead Approved.' },
      { action: 'STATUS_CHANGE', performedBy: 'venkatesh_reddy', timestamp: '2026-06-15T15:00:00.000Z', notes: 'Installation completed successfully.' }
    ]
  },
  {
    _id: 'cust_seed_10',
    customerId: 'CUST0010',
    customerName: 'Harish Kumar',
    aadhaarNumber: '098765432109',
    mobileNumber: '8885566778',
    houseNumber: '1-8',
    fullAddress: 'Secunderabad, Hyderabad, TS',
    village: 'Secunderabad',
    mandal: 'Secunderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500003',
    solarCapacityRequired: 6,
    electricityBillAmount: 4205,
    assignedAgent: 'AGT010',
    status: 'New Lead',
    activityHistory: [
      { action: 'LEAD_CREATED', performedBy: 'harish_kumar', timestamp: '2026-06-24T14:00:00.000Z', notes: 'Lead generated.' }
    ]
  }
];

// Seed Helper for Mongoose
export const seedMongooseDB = async () => {
  try {
    const adminCount = await MongooseUser.countDocuments();
    if (adminCount === 0) {
      await MongooseUser.create(defaultAdmins);
      console.log('Seeded default admin user into MongoDB');
    }
    const agentCount = await MongooseAgent.countDocuments();
    if (agentCount === 0) {
      await MongooseAgent.create(defaultAgents);
      console.log('Seeded 10 default agent accounts into MongoDB');
    }
    const settingsCount = await MongooseSettings.countDocuments();
    if (settingsCount === 0) {
      await MongooseSettings.create(defaultSettings);
      console.log('Seeded default settings into MongoDB');
    }
    const customerCount = await MongooseCustomer.countDocuments();
    if (customerCount === 0) {
      await MongooseCustomer.create(defaultCustomers);
      console.log('Seeded default customers into MongoDB');
    }
  } catch (error) {
    console.error('Error seeding MongoDB:', error);
  }
};

// Unified DB model classes wrapping both MongoDB and Mock JSON DB
class ModelWrapper {
  constructor(mongooseModel, collectionName, defaultData = []) {
    this.mongooseModel = mongooseModel;
    this.mockModel = new MockModel(collectionName, defaultData);
  }

  get db() {
    if (getDbMode()) {
      return this.mockModel;
    }
    return this.mongooseModel;
  }

  async find(filter = {}) {
    return await this.db.find(filter);
  }

  async findOne(filter = {}) {
    return await this.db.findOne(filter);
  }

  async findById(id) {
    return await this.db.findById(id);
  }

  async create(data) {
    return await this.db.create(data);
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    return await this.db.findByIdAndUpdate(id, update, options);
  }

  async findByIdAndDelete(id) {
    return await this.db.findByIdAndDelete(id);
  }

  async deleteMany(filter = {}) {
    return await this.db.deleteMany(filter);
  }

  async countDocuments(filter = {}) {
    return await this.db.countDocuments(filter);
  }
}

// Export Wrapper instances
export const User = new ModelWrapper(MongooseUser, 'Admins', defaultAdmins);
export const Agent = new ModelWrapper(MongooseAgent, 'Agents', defaultAgents);
export const Customer = new ModelWrapper(MongooseCustomer, 'Customers', defaultCustomers);
export const Notification = new ModelWrapper(MongooseNotification, 'Notifications', []);
export const Settings = new ModelWrapper(MongooseSettings, 'Settings', defaultSettings);
export const AuditLog = new ModelWrapper(MongooseAuditLog, 'AuditLogs', []);
export { MongooseUser, MongooseAgent, MongooseCustomer, MongooseNotification, MongooseSettings, MongooseAuditLog };
