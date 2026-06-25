import express from 'express';
import {
  getSettings,
  updateSettings,
  createNewAdmin,
  backupDatabase,
  restoreDatabase,
  getAuditLogs,
  getDashboardStats
} from '../controllers/settingsController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

// Admin-only configurations
router.get('/', restrictTo('ADMIN'), getSettings);
router.put('/', restrictTo('ADMIN'), upload.single('logo'), updateSettings);
router.post('/admins', restrictTo('ADMIN'), createNewAdmin);
router.get('/backup', restrictTo('ADMIN'), backupDatabase);
router.post('/restore', restrictTo('ADMIN'), upload.single('file'), restoreDatabase);
router.get('/audit-logs', restrictTo('ADMIN'), getAuditLogs);
router.get('/stats', restrictTo('ADMIN'), getDashboardStats);

export default router;
